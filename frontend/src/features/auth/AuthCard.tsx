'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AuthSlider } from './AuthSlider';
import { AuthGoogleButton } from './AuthGoogleButton';
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
 * Mengintegrasikan form autentikasi modular dengan slider visual promosi dalam split card.
 * Mengimplementasikan:
 * - Fluid spacing via clamp() pada padding, margin, dan form input
 * - Tinggi kartu via min-height: tetap ideal di mode Masuk, membesar mengikuti
 *   konten mode Daftar (halaman dapat scroll di viewport pendek, tidak ada konten terpotong)
 * - Pergantian mulus state Masuk <-> Daftar tanpa reload
 * - Accessible form labels dan alert error
 * - Cloudflare Turnstile anti-bot protection
 * - 6-Digit OTP Step dengan countdown & auto-submission
 */
export function AuthCard({ initialMode = 'login' }: AuthCardProps) {
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      className="grid w-full max-w-[920px] grid-cols-1 overflow-hidden rounded-2xl border border-[#2B2B30] bg-[#0F0F11] shadow-2xl md:grid-cols-[1.05fr_1fr]"
      style={{
        minHeight: 'clamp(480px, 86vh, 600px)',
      }}
    >
      {/* Kolom Kiri: Slider Promosi & Aset Visual 2:3 */}
      <AuthSlider />

      {/* Kolom Kanan: Form Autentikasi Single-Card / Verifikasi OTP */}
      <div className="flex flex-col justify-center px-[clamp(20px,3vw,36px)] py-[clamp(16px,2.5vh,26px)]">
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
            {/* Brand Logo: max-width 96px, center, proporsional */}
            <div className="flex justify-center mb-[clamp(6px,1.2vh,12px)]">
              <Image
                src="/assets/Logo ARM no BG.png"
                alt="ARM Exhaust"
                width={96}
                height={48}
                priority
                className="h-auto w-auto max-w-[96px] object-contain"
              />
            </div>

            {/* Subtitle dinamis */}
            <p className="mb-[clamp(8px,1.3vh,14px)] text-center text-xs text-[#9AA0A8]">
              {isRegister
                ? 'Create an account to enjoy ARM Exhaust features.'
                : 'Welcome back to ARM Exhaust.'}
            </p>

            {/* Tombol SSO Google */}
            <div className="mb-[clamp(6px,1.1vh,12px)]">
              <AuthGoogleButton disabled={loading} onCredential={handleGoogleSuccess} />
            </div>

            {/* Divider pemisah */}
            <div className="mb-[clamp(6px,1.1vh,12px)] flex items-center gap-2.5 text-[10px] uppercase tracking-widest text-[#5C6068]">
              <span className="h-px flex-1 bg-[#2B2B30]" />
              <span>or</span>
              <span className="h-px flex-1 bg-[#2B2B30]" />
            </div>

            {/* Accessible screen-reader live region (visual alert surfaces via top-center DynamicIslandNotice) */}
            {error && <span role="alert" className="sr-only">{error}</span>}

            {/* Form Body */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[clamp(6px,1vh,9px)]">
              {isRegister && (
                <label className="flex flex-col gap-1 text-[11px] font-semibold text-[#C7CAD1]">
                  Full Name
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your name"
                    disabled={loading}
                    className="w-full rounded-lg border border-[#2B2B30] bg-[#141416] px-3 py-[clamp(6px,0.9vh,8px)] text-[13px] text-white placeholder-[#8A8F98] transition focus:border-[#E81828] focus:outline-none disabled:opacity-60"
                  />
                </label>
              )}

              <label className="flex flex-col gap-1 text-[11px] font-semibold text-[#C7CAD1]">
                Email
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="name@email.com"
                  disabled={loading}
                  className="w-full rounded-lg border border-[#2B2B30] bg-[#141416] px-3 py-[clamp(6px,0.9vh,8px)] text-[13px] text-white placeholder-[#8A8F98] transition focus:border-[#E81828] focus:outline-none disabled:opacity-60"
                />
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-semibold text-[#C7CAD1]">
                Password
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                    minLength={8}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    placeholder="Submit your password"
                    disabled={loading}
                    className="w-full rounded-lg border border-[#2B2B30] bg-[#141416] pl-3 pr-10 py-[clamp(6px,0.9vh,8px)] text-[13px] text-white placeholder-[#8A8F98] transition focus:border-[#E81828] focus:outline-none disabled:opacity-60"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8A8F98] hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              {isRegister && (
                <PasswordStrength
                  password={password}
                  isFocused={isPasswordFocused}
                />
              )}

              {isRegister && (
                <div className="flex flex-col gap-1">
                  <label className="flex flex-col gap-1 text-[11px] font-semibold text-[#C7CAD1]">
                    Confirm Password
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        disabled={loading}
                        aria-invalid={passwordsMismatch}
                        className={`w-full rounded-lg border bg-[#141416] pl-3 pr-10 py-[clamp(6px,0.9vh,8px)] text-[13px] text-white placeholder-[#8A8F98] transition focus:outline-none disabled:opacity-60 ${
                          passwordsMismatch ? 'border-[#E81828]' : 'border-[#2B2B30] focus:border-[#E81828]'
                        }`}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8A8F98] hover:text-white transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </label>
                  {passwordsMismatch && (
                    <span className="text-[10px] font-medium text-[#FF6B77]">Passwords do not match.</span>
                  )}
                </div>
              )}

              {/* Cloudflare Turnstile Protection */}
              <Turnstile onVerify={setCaptchaToken} className="my-1" />

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-lg bg-[#E81828] px-4 py-[clamp(7px,1.1vh,9px)] text-[13px] font-semibold text-white transition duration-150 ease-out hover:bg-[#FF2B3C] focus:outline-none focus:ring-2 focus:ring-[#E81828] focus:ring-offset-2 focus:ring-offset-[#0F0F11] active:scale-95 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Processing…' : isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Switch Link: Sign In <-> Register */}
            <p className="mt-[clamp(8px,1.4vh,14px)] text-center text-xs text-[#9AA0A8]">
              <span>{isRegister ? 'Already have an account? ' : "Don't have an account? "}</span>
              <button
                type="button"
                onClick={() => {
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                  toggleMode();
                }}
                className="font-semibold text-[#E81828] hover:text-[#FF2B3C] hover:underline focus:outline-none"
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
