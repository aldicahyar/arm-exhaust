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
  initialMode?: AuthMode;
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
export function AuthCard({ initialMode = 'login' }: AuthCardProps) {
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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
