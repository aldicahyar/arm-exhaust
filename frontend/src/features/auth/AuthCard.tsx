'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AuthSlider } from './AuthSlider';
import { AuthGoogleButton } from './AuthGoogleButton';
import { LabelInput } from './LabelInput';
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
      className="grid w-full max-w-[900px] grid-cols-1 overflow-hidden rounded-2xl border border-[#2B2B30] bg-[#0F0F11] shadow-2xl md:grid-cols-[1.05fr_1fr] my-auto"
      style={{
        minHeight: 'clamp(440px, 78vh, 560px)',
      }}
    >
      {/* Kolom Kiri: Slider Promosi & Aset Visual 2:3 */}
      <AuthSlider />

      {/* Kolom Kanan: Form Autentikasi Single-Card / Verifikasi OTP */}
      <div className="flex flex-col justify-center px-[clamp(16px,2.5vw,32px)] py-[clamp(12px,1.8vh,20px)]">
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
            <div className="flex justify-center mb-[clamp(4px,1vh,8px)]">
              <Image
                src="/assets/Logo ARM no BG.png"
                alt="ARM Exhaust"
                width={92}
                height={46}
                priority
                className="h-auto w-auto max-w-[92px] object-contain"
              />
            </div>

            {/* Subtitle dinamis */}
            <p className="mb-[clamp(6px,1.1vh,10px)] text-center text-xs text-[#9AA0A8]">
              {isRegister
                ? 'Create an account to enjoy ARM Exhaust features.'
                : 'Welcome back to ARM Exhaust.'}
            </p>

            {/* Tombol SSO Google */}
            <div className="mb-[clamp(4px,0.9vh,8px)]">
              <AuthGoogleButton disabled={loading} onCredential={handleGoogleSuccess} />
            </div>

            {/* Divider pemisah */}
            <div className="mb-[clamp(4px,0.9vh,8px)] flex items-center gap-2.5 text-[10px] uppercase tracking-widest text-[#5C6068]">
              <span className="h-px flex-1 bg-[#2B2B30]" />
              <span>or</span>
              <span className="h-px flex-1 bg-[#2B2B30]" />
            </div>

            {/* Accessible screen-reader live region */}
            {error && <span role="alert" className="sr-only">{error}</span>}

            {/* Form Body dengan Bencho LabelInput */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
              {isRegister && (
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
                  corner={16}
                />
              )}

              <LabelInput
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                corner={16}
              />

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
                corner={16}
              />

              {isRegister && (
                <PasswordStrength
                  password={password}
                  isFocused={isPasswordFocused}
                />
              )}

              {isRegister && (
                <div className="flex flex-col gap-1">
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
                    corner={16}
                  />
                  {passwordsMismatch && (
                    <span className="text-[10px] font-medium text-[#FF6B77] pl-2">
                      Passwords do not match.
                    </span>
                  )}
                </div>
              )}

              {/* Sesi "Remember Me" (Hanya pada Mode Login) */}
              {!isRegister && (
                <div className="flex items-center justify-between text-xs py-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#9AA0A8] hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(rememberMe)}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded-md border border-[#3A3A40] bg-[#141416] text-white accent-white focus:ring-0 focus:outline-none"
                    />
                    <span>Remember me</span>
                  </label>
                </div>
              )}

              {/* Cloudflare Turnstile Protection */}
              <Turnstile onVerify={setCaptchaToken} className="my-0.5" />

              {/* Action Button: Solid White Kontras Tinggi (Bencho Monochrome Style) */}
              <button
                type="submit"
                disabled={loading}
                className="mt-0.5 w-full rounded-2xl bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition-all duration-150 ease-out hover:bg-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0F0F11] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Processing…' : isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Switch Link: Sign In <-> Register */}
            <p className="mt-[clamp(6px,1.2vh,10px)] text-center text-xs text-[#9AA0A8]">
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
