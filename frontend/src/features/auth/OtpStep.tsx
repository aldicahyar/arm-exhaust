'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface OtpStepProps {
  email: string;
  onVerify: (code: string) => Promise<boolean | void> | boolean | void;
  onResend: () => Promise<boolean | void>;
  onBack: () => void;
  loading?: boolean;
  error?: string;
  initialTtlSeconds?: number;
  autoCode?: string | null;
}

export function OtpStep({
  email,
  onVerify,
  onResend,
  onBack,
  loading = false,
  error = '',
  initialTtlSeconds = 15 * 60,
  autoCode = null,
}: OtpStepProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [remainingTtl, setRemainingTtl] = useState<number>(initialTtlSeconds);
  const [resendCooldown, setResendCooldown] = useState<number>(30);
  const [resending, setResending] = useState<boolean>(false);
  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasTriggeredAutoVerifyRef = useRef<boolean>(false);

  // Auto-focus first digit on normal mount (if not autofilling)
  useEffect(() => {
    if (!autoCode) {
      inputRefs.current[0]?.focus();
    }
  }, [autoCode]);

  // Countdown timer for OTP expiration (TTL)
  useEffect(() => {
    if (remainingTtl <= 0) return;
    const interval = setInterval(() => {
      setRemainingTtl((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingTtl]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = useCallback(
    async (codeToSubmit: string) => {
      if (loading || codeToSubmit.length !== 6) return;
      try {
        const ok = await onVerify(codeToSubmit);
        if (ok !== false) {
          setVerifiedSuccess(true);
        } else {
          setVerifiedSuccess(false);
        }
      } catch {
        setVerifiedSuccess(false);
      }
    },
    [loading, onVerify]
  );

  const handleVerifyRef = useRef(handleVerify);
  useEffect(() => {
    handleVerifyRef.current = handleVerify;
  });

  // Transparent, sequential staggered typing animation when autoCode is passed from email link
  const cleanAutoCode = autoCode && /^\d{6}$/.test(autoCode.trim()) ? autoCode.trim() : null;

  useEffect(() => {
    if (!cleanAutoCode || hasTriggeredAutoVerifyRef.current) return;

    setIsAutoFilling(true);
    let isCancelled = false;
    let currentIdx = 0;
    const buffer = ['', '', '', '', '', ''];

    const timer = setInterval(() => {
      if (isCancelled) return;

      if (currentIdx < 6) {
        buffer[currentIdx] = cleanAutoCode[currentIdx];
        setDigits([...buffer]);
        currentIdx++;
      } else {
        clearInterval(timer);
        setIsAutoFilling(false);
        hasTriggeredAutoVerifyRef.current = true;
        // Small pause so the user visibly confirms all 6 digits match their email code
        setTimeout(() => {
          if (!isCancelled) {
            handleVerifyRef.current(cleanAutoCode);
          }
        }, 150);
      }
    }, 60);

    return () => {
      isCancelled = true;
      clearInterval(timer);
      if (!hasTriggeredAutoVerifyRef.current) {
        setIsAutoFilling(false);
      }
    };
  }, [cleanAutoCode]);

  const handleDigitChange = (index: number, value: string) => {
    if (isAutoFilling) return;
    const cleanValue = value.replace(/\D/g, '');
    const newDigits = [...digits];

    if (!cleanValue) {
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    const digit = cleanValue.slice(-1);
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const completeCode = newDigits.join('');
    if (completeCode.length === 6 && !newDigits.some((d) => d === '')) {
      handleVerify(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isAutoFilling) return;
    if (e.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (isAutoFilling) return;
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || '';
    }
    setDigits(newDigits);

    const nextFocusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();

    if (pasteData.length === 6) {
      handleVerify(pasteData);
    }
  };

  const handleResendClick = async () => {
    if (resendCooldown > 0 || resending || loading) return;
    setResending(true);
    try {
      const success = await onResend();
      if (success !== false) {
        setDigits(['', '', '', '', '', '']);
        setRemainingTtl(initialTtlSeconds);
        setResendCooldown(30);
        setVerifiedSuccess(false);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setResending(false);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length === 6) {
      handleVerify(code);
    }
  };

  const isComplete = digits.every((d) => d !== '') && digits.join('').length === 6;

  return (
    <div className="flex flex-col animate-in fade-in duration-200">
      {/* Precision Security Header */}
      <div className="text-center mb-[clamp(10px,1.6vh,16px)]">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#18181C] border border-[#2B2B32] mb-2 text-[#9AA0A8]">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-sm sm:text-base font-bold text-white tracking-wider uppercase">
          Verify Security Code
        </h2>
        <p className="mt-1 text-[11px] sm:text-xs text-[#9AA0A8] leading-relaxed max-w-[320px] mx-auto">
          Enter the 6-digit verification code sent to:
          <br />
          <span className="font-semibold text-white tracking-wide break-all">{email}</span>
        </p>
      </div>

      {/* Accessible screen-reader live region (visual alert surfaces via top-center DynamicIslandNotice) */}
      {error && <span role="alert" className="sr-only">{error}</span>}

      {/* 6 Digit Input Form */}
      <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-3">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete="one-time-code"
              value={digit}
              disabled={loading || isAutoFilling || remainingTtl <= 0 || verifiedSuccess}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              aria-label={`Digit ${idx + 1}`}
              className={`h-11 w-9 sm:h-12 sm:w-10 text-center font-mono text-xl font-bold rounded-md border bg-[#141416] text-white transition-all duration-150 focus:outline-none disabled:opacity-80 ${
                verifiedSuccess
                  ? 'border-[#22C55E] bg-[#22C55E]/10 text-[#4ADE80] shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                  : digit
                  ? 'border-white bg-[#17171B] shadow-[0_0_6px_rgba(255,255,255,0.15)]'
                  : 'border-[#2B2B32] hover:border-[#3E424B] focus:border-white focus:ring-1 focus:ring-white'
              }`}
            />
          ))}
        </div>

        {/* Expiration & Trust Indicator */}
        <div className="flex items-center justify-between text-[11px] text-[#9AA0A8] px-0.5">
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 text-[#5C6068]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Expires in:
          </span>
          <span
            className={`font-mono font-medium ${
              remainingTtl <= 60 ? 'text-[#FF6B77]' : 'text-[#C7CAD1]'
            }`}
          >
            {remainingTtl > 0 ? formatTimer(remainingTtl) : 'Expired'}
          </span>
        </div>

        {/* Action Button: Bencho Minimalist Monochrome Style */}
        <button
          type="submit"
          disabled={loading || isAutoFilling || !isComplete || remainingTtl <= 0 || verifiedSuccess}
          className={`w-full mt-1 rounded-2xl px-4 py-2 text-[13px] font-semibold transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F0F11] active:scale-[0.98] disabled:cursor-not-allowed ${
            verifiedSuccess
              ? 'bg-[#22C55E] text-white focus:ring-[#22C55E]'
              : 'bg-white text-black hover:bg-[#E5E5E5] focus:ring-white disabled:opacity-50'
          }`}
        >
          {verifiedSuccess ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Verified • Redirecting…
            </span>
          ) : isAutoFilling ? (
            'Loading Security Code…'
          ) : loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verifying Code…
            </span>
          ) : (
            'Verify & Complete'
          )}
        </button>
      </form>

      {/* Resend & Back actions */}
      <div className="mt-3.5 flex flex-col items-center gap-1.5 text-xs">
        <div className="text-[#9AA0A8] flex items-center gap-1.5 text-[11px]">
          <span>Didn&apos;t receive the code?</span>
          <button
            type="button"
            onClick={handleResendClick}
            disabled={resendCooldown > 0 || resending || loading || isAutoFilling}
            className="font-medium text-white hover:underline disabled:text-[#5C6068] disabled:no-underline disabled:cursor-not-allowed transition"
          >
            {resendCooldown > 0
              ? `Resend in (${resendCooldown}s)`
              : resending
              ? 'Sending…'
              : 'Resend Code'}
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          disabled={loading || isAutoFilling}
          className="text-[#71717A] hover:text-[#E4E4E7] transition text-[11px] underline mt-0.5"
        >
          Change email or back to registration
        </button>
      </div>
    </div>
  );
}
