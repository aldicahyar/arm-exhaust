'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import Image from 'next/image';
import type { PromoSlide } from './types';

export const DEFAULT_PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'promo-1',
    tag: 'PROMO',
    title: 'Full System — Save Rp300K',
    description: 'Valid until the end of this month for all bike models.',
    imageSrc: '/assets/auth/auth-slide-1.jpg',
    altText: 'ARM Exhaust Full System titanium racing exhaust',
  },
  {
    id: 'promo-2',
    tag: 'NEW RELEASE',
    title: 'DB Killer Kondoman V2',
    description: 'Deep, weighty sound with better daily performance. In stock now.',
    imageSrc: '/assets/auth/auth-slide-2.jpg',
    altText: 'DB Killer Kondoman V2 ARM Exhaust high airflow',
  },
  {
    id: 'promo-3',
    tag: 'HIGH PERFORMANCE',
    title: 'Crafted by Specialists',
    description: 'Selected stainless 304 & titanium. Dyno-tested QC.',
    imageSrc: '/assets/auth/auth-slide-3.jpg',
    altText: 'Race bike with dyno-tested ARM Exhaust',
  },
];

export interface AuthSliderProps {
  slides?: PromoSlide[];
  intervalMs?: number;
  autoPlay?: boolean;
}

/**
 * Komponen Slider Presentasi Auth
 * Mengikuti referensi 21st.dev/image-slider:
 * - Siklus rotasi gambar otomatis (default: 4000ms)
 * - Pembersihan timer otomatis (memory leak prevention)
 * - Indikator dots & tombol navigasi dengan aria-label
 * - Aspect ratio terjaga rasio portrait 2:3 dengan overlay gradasi anti-AI-slop
 */
export function AuthSlider({
  slides = DEFAULT_PROMO_SLIDES,
  intervalMs = 4000,
  autoPlay = true,
}: AuthSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const instanceId = useId();

  const total = slides.length;

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      setCurrentIndex((index + total) % total);
    },
    [total]
  );

  const nextSlide = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const prevSlide = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  useEffect(() => {
    if (!autoPlay || isPaused || total <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, intervalMs, total]);

  if (total === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="ARM Exhaust promos and product highlights"
      className="relative hidden h-full w-full overflow-hidden bg-[#000000] md:block select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {slides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} dari ${total}: ${slide.title}`}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Foto referensi 2:3 portrait dengan Next.js fill Image optimizer */}
            <Image
              src={slide.imageSrc}
              alt={slide.altText}
              fill
              priority={idx === 0}
              sizes="(max-width: 920px) 50vw, 460px"
              className="object-cover object-center"
            />

            {/* Gradasi kontras tinggi untuk teks overlay: gelap di bawah, transparan di atas */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/95 via-[#0A0A0B]/40 to-transparent"
              aria-hidden="true"
            />

            {/* Teks promo */}
            <div className="absolute bottom-11 left-6 right-6 z-20">
              <span className="inline-block rounded bg-[#E81828] px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase text-white shadow-sm">
                {slide.tag}
              </span>
              <h2 className="mt-1.5 text-lg font-bold leading-tight tracking-tight text-white sm:text-[19px]">
                {slide.title}
              </h2>
              <p className="mt-1 text-xs text-[#C7CAD1] leading-relaxed">
                {slide.description}
              </p>
            </div>
          </div>
        );
      })}

      {/* Navigasi panah kiri/kanan */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous promo slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[#0A0A0B]/60 text-white transition hover:bg-[#E81828] hover:border-[#E81828] focus:outline-none focus:ring-2 focus:ring-[#E81828]"
      >
        <span aria-hidden="true" className="text-xs">&#10094;</span>
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next promo slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[#0A0A0B]/60 text-white transition hover:bg-[#E81828] hover:border-[#E81828] focus:outline-none focus:ring-2 focus:ring-[#E81828]"
      >
        <span aria-hidden="true" className="text-xs">&#10095;</span>
      </button>

      {/* Indikator dots navigasi */}
      <div
        role="tablist"
        aria-label="Select promo slide"
        className="absolute bottom-4 left-6 z-30 flex items-center gap-1.5"
      >
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={`${instanceId}-dot-${slide.id}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-label={`View slide ${idx + 1}: ${slide.title}`}
              onClick={() => goTo(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-white ${
                isActive ? 'w-5 bg-[#E81828]' : 'w-1.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
