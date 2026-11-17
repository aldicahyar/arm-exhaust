'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthSlider } from './AuthSlider';
import { AuthGoogleButton } from './AuthGoogleButton';
import { LabelInput } from './LabelInput';
import { AuthCheckbox } from './AuthCheckbox';
import { useAuthForm } from './useAuthForm';
import { PasswordStrength } from './PasswordStrength';
import { Turnstile } from './Turnstile';
import { OtpStep } from './OtpStep';
import type { AuthMode } from './types';

export interface AuthCardProps {
  readonly initialMode?: AuthMode;
}

/**
 * Komponen AuthCard
 * Mengintegrasikan form autentikasi modular bergaya Bencho minimalist dengan slider visual promosi dalam split card.
 * Mengimplementasikan:
 * - Dynamic SVG ring cut-out gap inputs dengan staggered letter-hop micro-interaction
 * - Kontrol sesi "Remember me" minimalis pada mode login
 * - High-contrast solid white action button (Bencho monochrome style)
 * - Transisi mulus state Sign In <-> Register
 * - Accessible form labels dan alert error
 * - Cloudflare Turnstile anti-bot protection
 * - 6-Digit OTP Step dengan countdown & auto-submission
 */
export function AuthCard({ initialMode = 'login' }: Readonly<AuthCardProps>) {
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const {
    mode,
    isRegister,
    step,
    setCaptchaToken,
    name,
    email,
    password,
    confirmPassword,
    setConfirmPassword,
    rememberMe,
    setRememberMe,
    passwordsMismatch,
    error,
    loading,
    otpLoading,
    setName,
    setEmail,
    setPassword,
    toggleMode,
    handleSubmit,
    handleGoogleSuccess,
    verifyOtp,
    resendOtp,
    backToForm,
    autoVerifyCode,
  } = useAuthForm({ initialMode });

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setForgotError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForgotError(data?.message ?? 'Failed to send reset email. Please try again.');
        return;
      }
      setForgotSent(true);
    } catch {
      setForgotError('Unable to connect to server. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      className="grid w-full max-w-[880px] grid-cols-1 overflow-hidden rounded-2xl border border-[#2B2B30] bg-[#0F0F11] shadow-2xl md:grid-cols-[1.05fr_1fr] my-auto"
      style={{
        minHeight: 'clamp(420px, 72vh, 520px)',
      }}
    >
      {/* Kolom Kiri: Slider Promosi & Aset Visual 2:3 */}
      <AuthSlider />

      {/* Kolom Kanan: Form Autentikasi Single-Card / Verifikasi OTP */}
      <div className="flex flex-col justify-center px-4 sm:px-6 py-2.5 sm:py-3.5">
        {step === 'otp' ? (
          <OtpStep
            email={email}
            onVerify={verifyOtp}
            onResend={resendOtp}
            onBack={backToForm}
            loading={otpLoading}
            error={error}
            autoCode={autoVerifyCode}
          />
        ) : isForgot ? (
          <div className="flex flex-col justify-center">
            {/* Brand Logo */}
            <div className="flex justify-center mb-1">
              <Image
                src="/assets/Logo ARM no BG.png"
                alt="ARM Exhaust"
                width={80}
                height={40}
                priority
                className="h-auto w-auto max-w-[80px] object-contain"
              />
            </div>

            <div className="relative mb-2 min-h-[16px] flex items-center justify-center">
              <p className="text-center text-[11px] text-[#9AA0A8]">
                {forgotSent
                  ? 'Check your email for reset instructions.'
                  : 'Enter your email to receive a password reset link.'}
              </p>
            </div>

            {forgotSent ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-center text-xs text-[#9AA0A8] max-w-[320px] leading-relaxed">
                  If an account exists for <span className="text-white font-medium">{email}</span>, instructions to reset your password have been sent. The link is valid for 15 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(false);
                    setForgotSent(false);
                  }}
                  className="mt-2 w-full rounded-2xl bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-[#E5E5E5] active:scale-[0.98]"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} noValidate className="flex flex-col">
                {forgotError && (
                  <div role="alert" className="mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[#FF6B77] text-xs text-center">
                    {forgotError}
                  </div>
                )}
                <div className="mb-2">
                  <LabelInput
                    label="Email"
                    type="email"
                    name="forgot-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={forgotLoading}
                    corner={14}
                  />
                </div>

                <div className="my-1">
                  <Turnstile onVerify={setCaptchaToken} />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="mt-1 w-full rounded-2xl bg-white px-4 py-2 text-[13px] font-semibold text-black transition-all hover:bg-[#E5E5E5] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(false);
                    setForgotError('');
                  }}
                  className="mt-3 text-center text-[11px] text-[#9AA0A8] transition hover:text-white"
                >
                  &larr; Back to Sign In
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Brand Logo: Hanya logo yang mempertahankan warna aslinya */}
            <div className="flex justify-center mb-1">
              <Image
                src="/assets/Logo ARM no BG.png"
                alt="ARM Exhaust"
                width={80}
                height={40}
                priority
                className="h-auto w-auto max-w-[80px] object-contain"
              />
            </div>

            {/* Subtitle dinamis dengan smooth cross-fade */}
            <div className="relative mb-1.5 min-h-[16px] flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={isRegister ? 'reg' : 'log'}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="text-center text-[11px] text-[#9AA0A8]"
                >
                  {isRegister
                    ? 'Create an account to enjoy ARM Exhaust features.'
                    : 'Welcome back to ARM Exhaust.'}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Tombol SSO Google */}
            <div className="mb-1.5">
              <AuthGoogleButton disabled={loading} onCredential={handleGoogleSuccess} />
            </div>

            {/* Divider pemisah */}
            <div className="mb-1.5 flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#5C6068]">
              <span className="h-px flex-1 bg-[#2B2B30]" />
              <span>or</span>
              <span className="h-px flex-1 bg-[#2B2B30]" />
            </div>

            {/* Accessible screen-reader live region */}
            {error && <span role="alert" className="sr-only">{error}</span>}

            {/* Form Body dengan Bencho LabelInput & Smooth Layout Transition */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col">
              <AnimatePresence initial={false}>
                {isRegister && (
                  <motion.div
                    key="field-name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-1.5">
                      <LabelInput
                        label="Full Name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={2}
                        maxLength={100}
                        autoComplete="name"
                        disabled={loading}
                        corner={14}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-1.5">
                <LabelInput
                  label="Email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  corner={14}
                />
              </div>

              <div className="mb-1.5">
                <LabelInput
                  label="Password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                  minLength={8}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  disabled={loading}
                  corner={14}
                />
              </div>

              <AnimatePresence initial={false}>
                {isRegister && (
                  <motion.div
                    key="field-password-strength"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-1.5">
                      <PasswordStrength
                        password={password}
                        isFocused={isPasswordFocused}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {isRegister && (
                  <motion.div
                    key="field-confirm-password"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-0.5 pb-1.5">
                      <LabelInput
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sesi "Remember Me" (Hanya pada Mode Login dengan Smooth Transition) */}
              <AnimatePresence initial={false}>
                {!isRegister && (
                  <motion.div
                    key="field-remember-me"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-xs pb-1.5 pt-0.5">
                      <AuthCheckbox
                        checked={Boolean(rememberMe)}
                        onChange={setRememberMe}
                        label="Remember me"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgot(true);
                          setForgotSent(false);
                          setForgotError('');
                        }}
                        className="text-[11px] font-medium text-[#9AA0A8] transition hover:text-white focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cloudflare Turnstile Protection */}
              <div className="my-0.5">
                <Turnstile onVerify={setCaptchaToken} />
              </div>

              {/* Action Button: Solid White Kontras Tinggi (Bencho Monochrome Style) */}
              <button
                type="submit"
                disabled={loading}
                className="mt-0.5 w-full rounded-2xl bg-white px-4 py-2 text-[13px] font-semibold text-black transition-all duration-150 ease-out hover:bg-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0F0F11] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={loading ? 'loading' : isRegister ? 'register' : 'signin'}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="inline-block"
                  >
                    {loading ? 'Processing…' : isRegister ? 'Create Account' : 'Sign In'}
                  </motion.span>
                </AnimatePresence>
              </button>
            </form>

            {/* Switch Link: Sign In <-> Register */}
            <p className="mt-1.5 text-center text-[11px] text-[#9AA0A8]">
              <span>{isRegister ? 'Already have an account? ' : "Don't have an account? "}</span>
              <button
                type="button"
                onClick={() => {
                  toggleMode();
                }}
                className="font-semibold text-white hover:underline focus:outline-none ml-1"
              >
                {isRegister ? 'Sign In' : 'Register'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
