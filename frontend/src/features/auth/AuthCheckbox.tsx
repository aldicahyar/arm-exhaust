'use client';

import React, { useId } from 'react';

export interface AuthCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Komponen AuthCheckbox (Gaya Tactile Bencho Minimalist)
 * Menggunakan hidden native input `sr-only` untuk aksesibilitas keyboard (Tab + Space)
 * dan render kotak kustom monokromatik (16x16px, rounded-[5px]) dengan micro-spring checkmark.
 */
export function AuthCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  id: customId,
  className = '',
}: AuthCheckboxProps) {
  const generatedId = useId().replace(/:/g, '');
  const inputId = customId || `chk-${generatedId}`;

  return (
    <label
      htmlFor={inputId}
      className={`group inline-flex items-center gap-2 cursor-pointer select-none py-0.5 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Hidden native input for full screen-reader and keyboard accessibility */}
      <input
        type="checkbox"
        id={inputId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
        aria-checked={checked}
      />

      {/* Tactile indicator box */}
      <span
        aria-hidden="true"
        className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-all duration-200 ease-out ${
          checked
            ? 'bg-white border-white text-black shadow-sm scale-100'
            : 'border-[#3A3A40] bg-[#141416]/90 group-hover:border-[#52525A]'
        }`}
      >
        {checked && (
          <svg
            className="h-2.5 w-2.5 stroke-black"
            viewBox="0 0 12 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1.5 5 4.5 8 10.5 2" />
          </svg>
        )}
      </span>

      {/* Label text */}
      <span className="text-[11.5px] font-normal text-[#9AA0A8] transition-colors duration-150 group-hover:text-white">
        {label}
      </span>
    </label>
  );
}
