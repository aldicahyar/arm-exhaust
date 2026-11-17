'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthSlider } from './AuthSlider';
import { LabelInput } from './LabelInput';
import { PasswordStrength } from './PasswordStrength';
import { Turnstile } from './Turnstile';
import { validatePasswordPolicy } from './useAuthForm';

export function ResetPasswordCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [verifying, setVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenEmail, setTokenEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Verifikasi keabsahan token saat halaman pertama kali dimuat
  useEffect(() => {
    let active = true;

    async function checkToken() {
      if (!token) {
        if (active) {
          setIsValidToken(false);
          setVerifying(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (active) {
          if (res.ok && data?.valid) {
            setIsValidToken(true);
            setTokenEmail(data?.email ?? '');
          } else {
            setIsValidToken(false);
          }
          setVerifying(false);
        }
      } catch {
        if (active) {
          setIsValidToken(false);
          setVerifying(false);
        }
      }
    }

    void checkToken();

    return () => {
      active = false;
    };
  }, [token]);

  // Redirect otomatis ke login setelah sukses
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3500);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!password) {
        setError('New password is required.');
        return;
      }

      const policyErr = validatePasswordPolicy(password);
      if (policyErr) {
        setError(policyErr);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            password,
            captchaToken,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data?.message ?? 'Failed to reset password. Please request a new link.');
          return;
        }

        setIsSuccess(true);
      } catch {
        setError('Unable to connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [token, password, confirmPassword, captchaToken],
  );

  return (
    <div
      className="grid w-full max-w-[880px] grid-cols-1 overflow-hidden rounded-2xl border border-[#2B2B30] bg-[#0F0F11] shadow-2xl md:grid-cols-[1.05fr_1fr] my-auto"
      style={{
        minHeight: 'clamp(420px, 72vh, 520px)',
      }}
    >
      {/* Kolom Kiri: Slider Promosi & Aset Visual */}
      <AuthSlider />

      {/* Kolom Kanan: State Card (Verifying / Invalid / Form / Success) */}
      <div className="flex flex-col justify-center px-4 sm:px-6 py-4 sm:py-6">
        {/* Brand Logo */}
        <div className="flex justify-center mb-2">
          <Image
            src="/assets/Logo ARM no BG.png"
            alt="ARM Exhaust"
            width={80}
            height={40}
            priority
            className="h-auto w-auto max-w-[80px] object-contain"
          />
        </div>

        {verifying ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2B2B30] border-t-white mb-3" />
            <p className="text-xs text-[#9AA0A8]">Validating security token…</p>
          </div>
        ) : !isValidToken ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-[#FF6B77] border border-red-500/20 mb-3">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-white mb-1">Invalid or Expired Link</h2>
            <p className="text-xs text-[#9AA0A8] max-w-[300px] mb-4 leading-relaxed">
              This password reset link is invalid, has expired, or has already been used. Please request a new link from the login page.
            </p>
            <Link
              href="/login"
              className="w-full rounded-2xl bg-white px-4 py-2 text-[13px] font-semibold text-black text-center transition hover:bg-[#E5E5E5] active:scale-[0.98]"
            >
              Return to Sign In
            </Link>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-white mb-1">Password Updated</h2>
            <p className="text-xs text-[#9AA0A8] max-w-[300px] mb-4 leading-relaxed">
              Your password has been changed successfully. You will be redirected to the sign in page shortly.
            </p>
            <Link
              href="/login"
              className="w-full rounded-2xl bg-white px-4 py-2 text-[13px] font-semibold text-black text-center transition hover:bg-[#E5E5E5] active:scale-[0.98]"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <div>
            <div className="relative mb-3 flex items-center justify-center text-center">
              <p className="text-xs text-[#9AA0A8]">
                Create a new password for <span className="text-white font-medium">{tokenEmail}</span>
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-2.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[#FF6B77] text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col">
              <div className="mb-2">
                <LabelInput
                  label="New Password"
                  type="password"
                  name="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  corner={14}
                />
              </div>

              <div className="pb-2">
                <PasswordStrength password={password} isFocused={isPasswordFocused} />
              </div>

              <div className="mb-2 flex flex-col gap-0.5">
                <LabelInput
                  label="Confirm Password"
                  type="password"
                  name="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  error={passwordsMismatch}
                  corner={14}
                />
                {passwordsMismatch && (
                  <span className="text-[10px] font-medium text-[#FF6B77] pl-2">
                    Passwords do not match.
                  </span>
                )}
              </div>

              <div className="my-1">
                <Turnstile onVerify={setCaptchaToken} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1.5 w-full rounded-2xl bg-white px-4 py-2 text-[13px] font-semibold text-black transition-all hover:bg-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0F0F11] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Updating…' : 'Update Password'}
              </button>

              <div className="mt-3 text-center">
                <Link href="/login" className="text-[11px] text-[#9AA0A8] transition hover:text-white">
                  &larr; Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
