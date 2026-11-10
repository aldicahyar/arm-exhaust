'use client';

import React from 'react';
import { getPasswordStrength } from './useAuthForm';

export interface PasswordStrengthProps {
  password: string;
  isFocused?: boolean;
}

const LEVELS = {
  empty: { filled: 0, color: 'bg-[#2B2B30]', label: '', textColor: 'text-[#8A8F98]' },
  weak: { filled: 1, color: 'bg-[#E81828]', label: 'Weak', textColor: 'text-[#E81828]' },
  medium: { filled: 2, color: 'bg-[#F5A623]', label: 'Medium', textColor: 'text-[#F5A623]' },
  strong: { filled: 3, color: 'bg-[#22C55E]', label: 'Strong', textColor: 'text-[#22C55E]' },
} as const;

/**
 * Visual password strength indicator (Hybrid: Option 1 + Option 3):
 * - Micro progress bar (3 dynamic segments)
 * - 2x2 Interactive Criteria Grid (Min 8 chars, Upper & lowercase, Number, Special symbol)
 * - Smart Collapse:
 *   - Expands when focused or typing
 *   - Auto-collapses to a single clean green line when all criteria are met and field loses focus
 *   - Space-efficient, zero layout jank, fully calibrated for zoom 80% - 110%
 */
export function PasswordStrength({ password, isFocused = false }: PasswordStrengthProps) {
  const criteria = {
    minLength: password.length >= 8,
    upperAndLower: /[A-Z]/.test(password) && /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const metCount = [
    criteria.minLength,
    criteria.upperAndLower,
    criteria.hasNumber,
    criteria.hasSpecial,
  ].filter(Boolean).length;

  const allMet = metCount === 4;
  const strengthLevel = getPasswordStrength(password);
  const level = LEVELS[strengthLevel];

  // Smart Collapse logic (Option A):
  // 1. Show full checklist if focused OR if user has typed characters but criteria are incomplete.
  // 2. If 100% satisfied and blurred (e.g. moved to Confirm Password), smart collapse to 1 clean line.
  // 3. If empty and not focused, hide completely.
  const showFullChecklist = isFocused || (password.length > 0 && !allMet);
  const showSuccessSummary = !isFocused && allMet;

  if (password.length === 0 && !isFocused) {
    return null;
  }

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-out"
      role="status"
      aria-label={`Password strength: ${level.label || 'empty'}, ${metCount} of 4 criteria met`}
    >
      {showSuccessSummary ? (
        <div className="flex items-center gap-1.5 py-0.5 text-[11px] font-medium text-[#22C55E]">
          <svg
            className="h-3.5 w-3.5 flex-shrink-0 text-[#22C55E]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Password meets all security criteria</span>
        </div>
      ) : showFullChecklist ? (
        <div className="flex flex-col gap-1.5 py-0.5">
          {/* Micro Progress Bar & Status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-[3px] flex-1 rounded-full transition-colors duration-200 ${
                    i < level.filled ? level.color : 'bg-[#2B2B30]'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold">
              <span className={level.textColor}>{level.label || 'Incomplete'}</span>
              <span className="text-[#6B7280]">({metCount}/4)</span>
            </div>
          </div>

          {/* 2x2 Interactive Criteria Grid */}
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 text-[10px] sm:text-[10.5px]">
            {/* Criterion 1: Min 8 Characters */}
            <div
              className={`flex items-center gap-1.5 transition-colors duration-150 ${
                criteria.minLength ? 'text-[#E4E4E7]' : 'text-[#71717A]'
              }`}
            >
              {criteria.minLength ? (
                <svg
                  className="h-3 w-3 flex-shrink-0 text-[#22C55E]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="h-1.5 w-1.5 mx-[3px] rounded-full bg-[#52525B] flex-shrink-0" />
              )}
              <span>Min. 8 characters</span>
            </div>

            {/* Criterion 2: Uppercase & Lowercase */}
            <div
              className={`flex items-center gap-1.5 transition-colors duration-150 ${
                criteria.upperAndLower ? 'text-[#E4E4E7]' : 'text-[#71717A]'
              }`}
            >
              {criteria.upperAndLower ? (
                <svg
                  className="h-3 w-3 flex-shrink-0 text-[#22C55E]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="h-1.5 w-1.5 mx-[3px] rounded-full bg-[#52525B] flex-shrink-0" />
              )}
              <span>Uppercase & lowercase</span>
            </div>

            {/* Criterion 3: Number */}
            <div
              className={`flex items-center gap-1.5 transition-colors duration-150 ${
                criteria.hasNumber ? 'text-[#E4E4E7]' : 'text-[#71717A]'
              }`}
            >
              {criteria.hasNumber ? (
                <svg
                  className="h-3 w-3 flex-shrink-0 text-[#22C55E]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="h-1.5 w-1.5 mx-[3px] rounded-full bg-[#52525B] flex-shrink-0" />
              )}
              <span>At least 1 number</span>
            </div>

            {/* Criterion 4: Special Symbol */}
            <div
              className={`flex items-center gap-1.5 transition-colors duration-150 ${
                criteria.hasSpecial ? 'text-[#E4E4E7]' : 'text-[#71717A]'
              }`}
            >
              {criteria.hasSpecial ? (
                <svg
                  className="h-3 w-3 flex-shrink-0 text-[#22C55E]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="h-1.5 w-1.5 mx-[3px] rounded-full bg-[#52525B] flex-shrink-0" />
              )}
              <span>Special symbol (!@#$...)</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
