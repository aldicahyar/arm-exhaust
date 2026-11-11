'use client';

import React, { useId, useState, useRef, useLayoutEffect, useEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface LabelInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'password';
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  corner?: number;
  error?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}

const CLAMP = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
const HEIGHT = 42;
const SCALE_LABEL = 0.78;
const STROKE_OFFSET = 0.75;

/**
 * Komponen LabelInput (Gaya Bencho.dev)
 * Menggunakan dynamic SVG ring dengan outline cut-out gap terukur presisi,
 * animasi floating label dengan micro-interaction letter-hop bertingkat,
 * serta tombol toggle password terintegrasi.
 */
export function LabelInput({
  label,
  value,
  onChange,
  type = 'text',
  name,
  id: customId,
  required = false,
  disabled = false,
  autoComplete,
  minLength,
  maxLength,
  corner = 14,
  error = false,
  onFocus,
  onBlur,
  className = '',
}: LabelInputProps) {
  const generatedId = useId().replace(/:/g, '');
  const inputId = customId || `lbi-${generatedId}`;
  const isPassword = type === 'password';

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [flipCount, setFlipCount] = useState<number | null>(null);
  const [labelWidth, setLabelWidth] = useState(40);
  const [boxWidth, setBoxWidth] = useState(320);

  const boxRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const measureSpanRef = useRef<HTMLSpanElement>(null);

  // Ukur lebar teks label untuk menghitung celah cut-out gap
  useIsomorphicLayoutEffect(() => {
    if (measureSpanRef.current) {
      setLabelWidth(measureSpanRef.current.offsetWidth || 40);
    }
  }, [label]);

  // Ukur lebar kontainer secara responsif (ResizeObserver)
  useIsomorphicLayoutEffect(() => {
    if (!boxRef.current) return;
    const updateSize = () => {
      if (boxRef.current) {
        setBoxWidth(boxRef.current.offsetWidth || 320);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle password toggle
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
    setFlipCount((prev) => (prev === null ? 1 : prev + 1));
  };

  const isUp = isFocused || (value && value.length > 0);

  // SVG Path Calculations
  const radius = CLAMP(corner, 0, HEIGHT / 2);
  const labelStartX = Math.max(radius + 4, 18);
  const gapStartX = Math.max(radius, labelStartX - 4);
  const gapEndX = labelStartX + labelWidth * SCALE_LABEL + 4;
  const arcRadius = radius - STROKE_OFFSET;
  const maxX = boxWidth - 0.75;
  const maxY = HEIGHT - 0.75;
  const midX = boxWidth / 2;
  const midGapX = (gapStartX + gapEndX) / 2;

  // Path potongan atas (garis gap dinamis)
  const pathGapLeft = `M${midGapX},${STROKE_OFFSET} L${gapStartX},${STROKE_OFFSET}`;
  const pathGapRight = `M${midGapX},${STROKE_OFFSET} L${gapEndX},${STROKE_OFFSET}`;

  // Path border kanan (dari akhir gap, lengkungan kanan atas, sisi kanan, lengkungan kanan bawah, ke tengah bawah)
  const pathRight = radius > 0
    ? `M${gapEndX},${STROKE_OFFSET} L${boxWidth - radius},${STROKE_OFFSET} A${arcRadius},${arcRadius} 0 0 1 ${maxX},${radius} L${maxX},${HEIGHT - radius} A${arcRadius},${arcRadius} 0 0 1 ${boxWidth - radius},${maxY} L${midX},${maxY}`
    : `M${gapEndX},${STROKE_OFFSET} L${maxX},${STROKE_OFFSET} L${maxX},${maxY} L${midX},${maxY}`;

  // Path border kiri (dari awal gap, lengkungan kiri atas, sisi kiri, lengkungan kiri bawah, ke tengah bawah)
  const pathLeft = radius > 0
    ? `M${gapStartX},${STROKE_OFFSET} L${radius},${STROKE_OFFSET} A${arcRadius},${arcRadius} 0 0 0 ${STROKE_OFFSET},${radius} L${STROKE_OFFSET},${HEIGHT - radius} A${arcRadius},${arcRadius} 0 0 0 ${radius},${maxY} L${midX},${maxY}`
    : `M${gapStartX},${STROKE_OFFSET} L${STROKE_OFFSET},${STROKE_OFFSET} L${STROKE_OFFSET},${maxY} L${midX},${maxY}`;

  return (
    <div
      className={`lbi ${className}`}
      data-up={Boolean(isUp)}
      data-focus={Boolean(isFocused)}
      data-filled={Boolean(value && value.length > 0)}
      data-error={Boolean(error)}
    >
      {/* Hidden measuring span untuk menghitung pixel width label */}
      <span
        ref={measureSpanRef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] -top-[9999px] text-[13px] font-normal tracking-[-0.01em] opacity-0"
      >
        {label}
      </span>

      <div
        ref={boxRef}
        className="lbi-box"
        style={{
          height: HEIGHT,
          borderRadius: radius,
          ['--lbi-x' as string]: `${labelStartX}px`,
        }}
      >
        {/* Dynamic SVG Ring Border */}
        <svg
          className="lbi-ring"
          width="100%"
          height={HEIGHT}
          viewBox={`0 0 ${boxWidth} ${HEIGHT}`}
          aria-hidden="true"
        >
          <path d={pathRight} />
          <path d={pathLeft} />
          <path className="lbi-gap" d={pathGapLeft} pathLength={1} />
          <path className="lbi-gap" d={pathGapRight} pathLength={1} />
        </svg>

        {/* Floating Animated Staggered Label */}
        <label
          ref={labelRef}
          htmlFor={inputId}
          className="lbi-label"
        >
          {[...label].map((char, i) => (
            <span
              key={i}
              style={{ ['--i' as string]: i } as React.CSSProperties}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </label>

        {/* Transparent Input Field */}
        <input
          id={inputId}
          name={name}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          data-flip={flipCount !== null ? flipCount % 2 : undefined}
          className="lbi-field"
          style={{
            paddingRight: isPassword ? 48 : labelStartX,
          }}
        />

        {/* Password Eye Toggle Morph */}
        {isPassword && (
          <button
            type="button"
            className="lbi-eye"
            data-show={Boolean(showPassword)}
            tabIndex={-1}
            onPointerDown={(e) => e.preventDefault()}
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-controls={inputId}
          >
            {/* Eye Icon (Open) */}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <circle cx="12" cy="12" r="3" />
            </svg>

            {/* Eye Off Icon (Slashed) */}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
