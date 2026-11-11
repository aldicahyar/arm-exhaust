'use client';

import { useState, useCallback, useEffect } from 'react';
import type { AuthMode, AuthStep, AuthApiResponse } from './types';
import { useNotice } from '@/shared/components';

export interface UseAuthFormOptions {
  initialMode?: AuthMode;
  onSuccess?: (response: AuthApiResponse) => void;
}

/**
 * Helper to safely extract human-friendly error messages from NestJS / standard JSON responses.
 * Maps raw HTTP codes and technical validation payloads into clear, polite user guidance.
 */
function parseApiErrorMessage(data: AuthApiResponse | any, fallback: string): string {
  // 1. Process custom backend error message if present
  if (data?.message) {
    const rawMsg = Array.isArray(data.message) ? data.message[0] : String(data.message);
    if (rawMsg) {
      if (rawMsg.includes('Invalid or expired OTP') || rawMsg.includes('Invalid or expired')) {
        return 'The verification code entered is invalid or has expired. Please check your email or request a new code.';
      }
      if (rawMsg.includes('Too many failed attempts') || rawMsg.includes('locked')) {
        return 'Too many incorrect attempts. For your security, verification has been temporarily locked for 5 minutes.';
      }
      if (rawMsg.includes('already registered')) {
        return 'This email is already registered. Please sign in instead.';
      }
      if (rawMsg.includes('email must be an email')) {
        return 'Please enter a valid email address.';
      }
      if (rawMsg.includes('password must be longer') || rawMsg.includes('Password must be')) {
        return rawMsg;
      }
      // If message is generic "Bad Request", do not show it raw
      if (rawMsg !== 'Bad Request' && rawMsg !== 'Internal Server Error') {
        return rawMsg;
      }
    }
  }

  // 2. Map HTTP error status words or codes into human-friendly messages
  const errCode = data?.statusCode || data?.status;
  const errText = typeof data?.error === 'string' ? data.error : '';

  if (errCode === 409 || errText === 'Conflict') {
    return 'This email is already registered. Please sign in instead.';
  }
  if (errCode === 401 || errText === 'Unauthorized') {
    return 'Incorrect email or password.';
  }
  if (errCode === 423 || errText === 'Locked' || errText.includes('locked')) {
    return 'Too many incorrect attempts. For your security, verification has been temporarily locked for 5 minutes.';
  }
  if (errCode === 429 || errText.toLowerCase().includes('too many requests')) {
    return 'Too many requests from your device. Please wait a few moments before trying again.';
  }
  if (errCode === 400 || errText === 'Bad Request') {
    return fallback || 'Please check your input and ensure all fields are filled out correctly.';
  }
  if (errCode === 500 || errText === 'Internal Server Error') {
    return 'Our server encountered an unexpected issue. Please try again in a few moments.';
  }

  return errText || fallback;
}

/**
 * Validasi client-side email sederhana yang mencakup format umum.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Kebijakan password registrasi — identik dengan backend/src/auth.mjs.
 * Set simbol persis requirement: !@#$%^&*(),.?":{}|<> ('-' dan '_' tidak termasuk).
 * Mengembalikan pesan error spesifik, atau null jika compliant.
 */
export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter (A-Z).';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter (a-z).';
  if (!/[0-9]/.test(password)) return 'Password must contain a number (0-9).';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).';
  }
  return null;
}

export type PasswordStrengthLevel = 'empty' | 'weak' | 'medium' | 'strong';

/**
 * Kategori kekuatan password: kelas karakter terpenuhi (besar/kecil/angka/simbol).
 * 'strong' ≡ memenuhi kebijakan penuh. Login tidak memakai fungsi ini.
 */
export function getPasswordStrength(password: string): PasswordStrengthLevel {
  if (!password) return 'empty';
  const classes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*(),.?":{}|<>]/].filter((r) => r.test(password)).length;
  if (password.length < 8 || classes <= 2) return 'weak';
  if (classes === 3) return 'medium';
  return 'strong';
}

/**
 * Custom Hook: useAuthForm
 * Mengelola state input, validasi input, status mutasi, dan integrasi HTTP endpoint
 * Memisahkan logika bisnis dari lapisan presentasi visual (Single Responsibility Principle).
 */
export function useAuthForm({ initialMode = 'login', onSuccess }: UseAuthFormOptions = {}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>('form');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [autoVerifyCode, setAutoVerifyCode] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  let notify: any = null;
  try {
    const noticeCtx = useNotice();
    notify = noticeCtx?.notify;
  } catch {
    // Silently fall back if rendered outside NoticeProvider (e.g. isolated unit tests)
  }

  const setErrorMessage = useCallback(
    (msg: string) => {
      setError(msg);
      if (msg) {
        notify?.error(msg);
      }
    },
    [notify]
  );

  // Coordinated State Initialization:
  // 1. Prioritize URL query parameters (for 1-click verification links like ?email=...&otp=...)
  // 2. Validate email format strictly against script injection / malformed input
  // 3. Preserve '+' in email plus-addressing (e.g. arkanpasiva+8@gmail.com)
  // 4. Prepopulate saved email from localStorage ONLY if on login form and no email param in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search;
    const params = search ? new URLSearchParams(search) : null;
    const rawEmailParam = params?.get('email');
    const rawOtpParam = params?.get('otp');

    if (rawEmailParam) {
      // Preserve '+' for plus-addressing (standard URLSearchParams decodes unencoded '+' to space ' ')
      const sanitizedEmail = rawEmailParam.trim().replace(/\s+/g, '+').toLowerCase();
      if (isValidEmail(sanitizedEmail)) {
        setEmail(sanitizedEmail);
        if (rawOtpParam && /^\d{6}$/.test(rawOtpParam.trim())) {
          setStep('otp');
          setAutoVerifyCode(rawOtpParam.trim());
        }

        // Security best practice: Strip credentials from browser address bar immediately
        if (window.history?.replaceState) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
        return; // Absolute precedence: Skip localStorage completely
      }
    }

    // Prepopulate saved email if Remember Me was previously enabled (only in clean login form)
    try {
      const savedEmail = localStorage.getItem('arm_remember_email');
      if (savedEmail && initialMode === 'login') {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage access restrictions
    }
  }, [initialMode]);

  // Cross-tab sync: Automatically detect if user verified in another tab or device
  useEffect(() => {
    if (step !== 'otp' || typeof window === 'undefined') return;

    let isSubscribed = true;
    let channel: BroadcastChannel | null = null;
    let hasRedirected = false;

    const handleVerified = (userData?: any) => {
      if (!isSubscribed || hasRedirected) return;
      hasRedirected = true;
      notify?.success('Account successfully verified!', 'Welcome to ARM Exhaust.');
      const role = userData?.role || 'customer';
      setTimeout(() => {
        window.location.href = role === 'admin' ? '/admin' : '/';
      }, 500);
    };

    // 1. Instant 0ms cross-tab notification via native BroadcastChannel
    try {
      channel = new BroadcastChannel('arm_auth_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'AUTH_SUCCESS') {
          handleVerified(event.data.user);
        }
      };
    } catch {}

    // 2. Storage event fallback for cross-tab synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'arm_auth_event' && isSubscribed) {
        try {
          const parsed = JSON.parse(e.newValue || '{}');
          if (parsed.type === 'AUTH_SUCCESS') {
            handleVerified(parsed.user);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Smart background session poll (checks /api/auth/me every 2.5s)
    // Ensures tab refreshes even if verification occurred on mobile device
    const pollTimer = setInterval(async () => {
      if (!isSubscribed || hasRedirected) return;
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const d = await res.json();
          if (d?.user) {
            handleVerified(d.user);
          }
        }
      } catch {}
    }, 2500);

    return () => {
      isSubscribed = false;
      channel?.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollTimer);
    };
  }, [step, notify]);

  const isRegister = mode === 'register';

  // Real-time: hanya tampil setelah user mulai mengetik konfirmasi
  const passwordsMismatch = isRegister && confirmPassword.length > 0 && confirmPassword !== password;

  const toggleMode = useCallback((targetMode?: AuthMode) => {
    setError('');
    setConfirmPassword('');
    setStep('form');
    if (targetMode) {
      setMode(targetMode);
    } else {
      setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    }
  }, []);

  const validate = useCallback((): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return 'Email is required.';
    }
    if (!isValidEmail(trimmedEmail)) {
      return 'Invalid email format.';
    }
    if (!password) {
      return 'Password is required.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (isRegister) {
      const policyError = validatePasswordPolicy(password);
      if (policyError) return policyError;
      if (confirmPassword !== password) {
        return 'Passwords do not match.';
      }
      const trimmedName = name.trim();
      if (!trimmedName) {
        return 'Full name is required.';
      }
      if (trimmedName.length < 2) {
        return 'Name must be at least 2 characters.';
      }
      if (trimmedName.length > 100) {
        return 'Name must be at most 100 characters.';
      }
    }
    return null;
  }, [email, password, isRegister, name, confirmPassword]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError('');

      const clientValidationError = validate();
      if (clientValidationError) {
        setErrorMessage(clientValidationError);
        return;
      }

      setLoading(true);
      const endpoint = `/api/auth/${isRegister ? 'register' : 'login'}`;
      if (!isRegister && typeof window !== 'undefined') {
        try {
          if (rememberMe) {
            localStorage.setItem('arm_remember_email', email.trim().toLowerCase());
          } else {
            localStorage.removeItem('arm_remember_email');
          }
        } catch {}
      }

      const payload = isRegister
        ? {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            ...(captchaToken ? { captchaToken } : {}),
          }
        : {
            email: email.trim().toLowerCase(),
            password,
            rememberMe,
            ...(captchaToken ? { captchaToken } : {}),
          };

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        let data: AuthApiResponse;
        try {
          data = await res.json();
        } catch {
          data = {
            statusCode: res.status,
            error: res.status >= 500
              ? 'Tidak dapat terhubung ke server backend (Port 4000). Pastikan backend aktif.'
              : res.status === 404
              ? 'Endpoint otentikasi tidak ditemukan (HTTP 404). Pastikan server backend aktif di port 4000.'
              : res.status === 401
              ? 'Email atau password salah.'
              : res.status === 429
              ? 'Terlalu banyak permintaan dari perangkat Anda. Silakan tunggu beberapa saat.'
              : `Respons server backend tidak valid (HTTP ${res.status}). Pastikan backend aktif.`
          };
        }

        if (!res.ok) {
          setErrorMessage(parseApiErrorMessage(data, 'An error occurred while processing authentication.'));
          return;
        }

        if (isRegister && data.requiresOtp) {
          setStep('otp');
          setError('');
          return;
        }

        if (onSuccess) {
          onSuccess(data);
        } else {
          // Default redirect: role admin menuju /admin, role customer menuju beranda /
          const role = data.user?.role;
          window.location.href = role === 'admin' ? '/admin' : '/';
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setErrorMessage('Request aborted.');
        } else {
          setErrorMessage('Cannot connect to the backend server. Make sure it is running.');
        }
      } finally {
        setLoading(false);
      }
    },
    [validate, isRegister, name, email, password, captchaToken, rememberMe, onSuccess]
  );

  const verifyOtp = useCallback(
    async (code: string): Promise<boolean> => {
      setError('');
      const cleanCode = code.trim();
      if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
        setErrorMessage('OTP code must be 6 numeric digits.');
        return false;
      }

      setOtpLoading(true);
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: cleanCode,
          }),
        });

        let data: AuthApiResponse;
        try {
          data = await res.json();
        } catch {
          data = {
            statusCode: res.status,
            error: res.status >= 500
              ? 'Tidak dapat terhubung ke server backend (Port 4000). Pastikan backend aktif.'
              : res.status === 404
              ? 'Endpoint otentikasi tidak ditemukan (HTTP 404). Pastikan server backend aktif di port 4000.'
              : res.status === 401
              ? 'Email atau password salah.'
              : res.status === 429
              ? 'Terlalu banyak permintaan dari perangkat Anda. Silakan tunggu beberapa saat.'
              : `Respons server backend tidak valid (HTTP ${res.status}). Pastikan backend aktif.`
          };
        }

        if (!res.ok) {
          setErrorMessage(parseApiErrorMessage(data, 'Invalid or expired OTP code.'));
          return false;
        }

        if (onSuccess) {
          onSuccess(data);
        } else {
          // Broadcast to other open tabs that authentication succeeded
          if (typeof window !== 'undefined') {
            try {
              const channel = new BroadcastChannel('arm_auth_sync');
              channel.postMessage({
                type: 'AUTH_SUCCESS',
                user: data.user,
                role: data.user?.role,
              });
              channel.close();
            } catch {}

            try {
              localStorage.setItem(
                'arm_auth_event',
                JSON.stringify({ type: 'AUTH_SUCCESS', user: data.user, timestamp: Date.now() })
              );
            } catch {}
          }

          notify?.success('Account successfully verified!', 'Welcome to ARM Exhaust.');
          const role = data.user?.role;
          setTimeout(() => {
            window.location.href = role === 'admin' ? '/admin' : '/';
          }, 600);
        }
        return true;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setErrorMessage('Request aborted.');
        } else {
          setErrorMessage('Cannot connect to the backend server. Make sure it is running.');
        }
        return false;
      } finally {
        setOtpLoading(false);
      }
    },
    [email, onSuccess, setErrorMessage]
  );

  const resendOtp = useCallback(async (): Promise<boolean> => {
    setError('');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      let data: AuthApiResponse;
      try {
        data = await res.json();
      } catch {
        data = {
          statusCode: res.status,
          error: res.status >= 500
            ? 'Tidak dapat terhubung ke server backend (Port 4000). Pastikan backend aktif.'
            : res.status === 404
            ? 'Endpoint otentikasi tidak ditemukan (HTTP 404). Pastikan server backend aktif di port 4000.'
            : res.status === 401
            ? 'Email atau password salah.'
            : res.status === 429
            ? 'Terlalu banyak permintaan dari perangkat Anda. Silakan tunggu beberapa saat.'
            : `Respons server backend tidak valid (HTTP ${res.status}). Pastikan backend aktif.`
        };
      }

      if (!res.ok) {
        setErrorMessage(parseApiErrorMessage(data, 'Failed to resend OTP code. Please try again.'));
        return false;
      }

      notify?.success('A new verification code has been sent to your email.');
      return true;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorMessage('Request aborted.');
      } else {
        setErrorMessage('Cannot connect to the backend server. Make sure it is running.');
      }
      return false;
    } finally {
      setOtpLoading(false);
    }
  }, [email, notify, setErrorMessage]);

  const backToForm = useCallback(() => {
    setStep('form');
    setMode('register');
    setError('');
    setAutoVerifyCode(null);
  }, []);

  const handleGoogleSuccess = useCallback(
    async (credential: string) => {
      setError('');
      setLoading(true);

      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        });

        let data: AuthApiResponse;
        try {
          data = await res.json();
        } catch {
          data = {
            statusCode: res.status,
            error: res.status >= 500
              ? 'Tidak dapat terhubung ke server backend (Port 4000). Pastikan backend aktif.'
              : res.status === 404
              ? 'Endpoint otentikasi tidak ditemukan (HTTP 404). Pastikan server backend aktif di port 4000.'
              : res.status === 401
              ? 'Email atau password salah.'
              : res.status === 429
              ? 'Terlalu banyak permintaan dari perangkat Anda. Silakan tunggu beberapa saat.'
              : `Respons server backend tidak valid (HTTP ${res.status}). Pastikan backend aktif.`
          };
        }

        if (!res.ok) {
          setErrorMessage(parseApiErrorMessage(data, 'Google authentication failed.'));
          return;
        }

        if (onSuccess) {
          onSuccess(data);
        } else {
          // Broadcast ke tab lain bahwa login/register Google berhasil
          if (typeof window !== 'undefined') {
            try {
              const channel = new BroadcastChannel('arm_auth_sync');
              channel.postMessage({
                type: 'AUTH_SUCCESS',
                user: data.user,
                role: data.user?.role,
              });
              channel.close();
            } catch {}

            try {
              localStorage.setItem(
                'arm_auth_event',
                JSON.stringify({ type: 'AUTH_SUCCESS', user: data.user, timestamp: Date.now() })
              );
            } catch {}
          }

          notify?.success(
            'Welcome to ARM Exhaust!',
            `Signed in as ${data.user?.name || data.user?.email}`
          );

          const role = data.user?.role;
          setTimeout(() => {
            window.location.href = role === 'admin' ? '/admin' : '/';
          }, 600);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setErrorMessage('Request aborted.');
        } else {
          setErrorMessage('Cannot connect to the backend server. Make sure it is running.');
        }
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, setErrorMessage]
  );

  return {
    mode,
    isRegister,
    step,
    captchaToken,
    setCaptchaToken,
    name,
    email,
    password,
    confirmPassword,
    rememberMe,
    setRememberMe,
    error,
    loading,
    otpLoading,
    setName,
    setEmail,
    setPassword,
    setConfirmPassword,
    passwordsMismatch,
    setError,
    toggleMode,
    handleSubmit,
    handleGoogleSuccess,
    verifyOtp,
    resendOtp,
    backToForm,
    autoVerifyCode,
  };
}
