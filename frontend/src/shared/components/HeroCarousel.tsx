'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface HeroCampaignSlide {
  readonly id: string;
  readonly category: 'PRODUK' | 'PROMO' | 'ACARA' | 'WORKSHOP' | string;
  readonly tag: string;
  readonly title: string;
  readonly stripTitle: string;
  readonly href: string;
  readonly image: string;
}

// Standar gambar: Full-bleed 1920x1080 (16:9) landscape fotografi sinematik (seragam seperti 'Acara')
export const CAMPAIGN_SLIDES: readonly HeroCampaignSlide[] = [
  {
    id: 'kdv2-vario125',
    category: 'PRODUK',
    tag: '01 / NEW ARRIVAL',
    title: 'ARM ZX-25R TITANIUM FULL SYSTEM',
    stripTitle: 'ZX-25R Titanium Series',
    href: '/catalog',
    image: '/assets/products/sample-hero.jpg',
  },
  {
    id: 'promo-deals',
    category: 'PROMO',
    tag: '02 / SPECIAL PROMO',
    title: 'YEAR-END RACING DEALS: DISKON 20%',
    stripTitle: 'Year-End Racing Deals',
    href: '/catalog',
    image: '/assets/products/sample-hero.jpg',
  },
  {
    id: 'event-sentul',
    category: 'ACARA',
    tag: '03 / TRACK EVENT',
    title: 'SENTUL TRACK DAY & DYNO MEETUP',
    stripTitle: 'Sentul Track Day 2026',
    href: '/contact',
    image: '/assets/products/sample-hero.jpg',
  },
  {
    id: 'workshop-custom',
    category: 'WORKSHOP',
    tag: '04 / IN-HOUSE WORKSHOP',
    title: 'CUSTOM INLET & PRECISION DYNO TUNE',
    stripTitle: 'Custom Inlet & Dyno Tune',
    href: 'https://wa.me/6281234567890',
    image: '/assets/products/sample-hero.jpg',
  },
];

const DURATION = 5500;

interface RawApiSlide {
  readonly id?: string;
  readonly category?: string;
  readonly tag?: string;
  readonly title?: string;
  readonly strip_title?: string;
  readonly stripTitle?: string;
  readonly href?: string;
  readonly image_url?: string;
  readonly image?: string;
  readonly sort_order?: number;
  readonly is_active?: boolean;
}

export function HeroCarousel() {
  const [slides, setSlides] = useState<readonly HeroCampaignSlide[]>(CAMPAIGN_SLIDES);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const startRef = useRef<number>(Date.now());
  const elapsed = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Fetch active slides from /api/public/campaign-slides on mount
  useEffect(() => {
    let isMounted = true;

    void fetch('/api/public/campaign-slides', {
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: unknown) => {
        if (!isMounted || !Array.isArray(data) || data.length === 0) return;
        const validSlides: HeroCampaignSlide[] = data.map((item: RawApiSlide, idx: number) => ({
          id: item.id ?? `slide-${idx}`,
          category: item.category ?? 'PRODUK',
          tag: item.tag ?? '',
          title: item.title ?? '',
          stripTitle: item.strip_title ?? item.stripTitle ?? item.title ?? '',
          href: item.href ?? '/catalog',
          image: item.image_url ?? item.image ?? '/assets/products/sample-hero.jpg',
        }));
        if (validSlides.length > 0) {
          setSlides(validSlides);
        }
      })
      .catch(() => {
        // Fallback gracefully to existing CAMPAIGN_SLIDES without layout shift
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    setProgress(0);
    elapsed.current = 0;
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (paused || slides.length === 0) return;

    const tick = () => {
      const total = elapsed.current + (Date.now() - startRef.current);
      const pct = Math.min((total / DURATION) * 100, 100);
      setProgress(pct);
      if (total >= DURATION) {
        elapsed.current = 0;
        startRef.current = Date.now();
        setActive((p) => (p + 1) % slides.length);
        setProgress(0);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, paused, slides.length]);

  const pause = () => {
    elapsed.current += Date.now() - startRef.current;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPaused(true);
  };

  const resume = () => {
    startRef.current = Date.now();
    setPaused(false);
  };

  const handlePanel = (idx: number) => {
    if (idx === active) {
      if (paused) {
        resume();
      } else {
        pause();
      }
    } else {
      goTo(idx);
      setPaused(false);
    }
  };

  const slideIndex = active >= slides.length ? 0 : active;
  const slide = slides[slideIndex] ?? CAMPAIGN_SLIDES[0];

  return (
    <section
      className="relative flex w-full flex-col justify-between overflow-hidden bg-[#0E0E10]"
      style={{ height: 'calc(100svh - 129px)', minHeight: '460px' }}
      aria-label="ARM Exhaust featured campaigns and products"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* ── Slide Area: Fleksibel Mengisi Seluruh Ruang Tersedia (Flex-1) ── */}
      <div className="relative flex flex-1 flex-col justify-end overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={slideIndex === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dual Ambient Dark Gradient Blending Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0A0A0B] via-transparent to-[#0A0A0B]/75"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#0A0A0B]/85 via-[#0A0A0B]/25 to-transparent"
        />

        {/* Content Layer Over Image (Responsive, Clutter-Free, Anti-Overflow) */}
        <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="max-w-2xl"
            >
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-zinc-400">
                <span className="h-px w-3.5 bg-zinc-500" aria-hidden="true" />
                <span>{slide.tag}</span>
              </div>
              <h1 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-white drop-shadow-md sm:text-3xl md:text-4xl lg:text-[40px] leading-[1.14]">
                <Link
                  href={slide.href}
                  className="group inline transition-colors duration-200 hover:text-zinc-300"
                >
                  <span>{slide.title}</span>
                  <span
                    className="inline-block ml-2.5 text-zinc-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:text-white align-middle"
                    aria-hidden="true"
                  >
                    <svg
                      className="inline h-5 w-5 sm:h-6 sm:w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </span>
                </Link>
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot Indicators Mobile */}
        <div className="absolute top-4 right-4 z-30 flex gap-1.5 md:hidden">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-[3px] rounded-none transition-all duration-300 ${
                i === slideIndex ? 'w-6 bg-white' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Low-Profile Strip Navigation (Desktop): Selalu Terkunci di Bawah Viewport (Shrink-0) ── */}
      <div
        className="relative z-20 hidden shrink-0 border-t border-[#1E1E21] bg-[#0A0A0B] md:grid"
        style={{ gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))` }}
      >
        {slides.map((s, i) => {
          const isActive = i === slideIndex;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handlePanel(i)}
              className={`relative p-3.5 sm:p-4 text-left transition-colors duration-150 border-r border-[#1E1E21] last:border-r-0 ${
                isActive ? 'bg-[#141418]' : 'hover:bg-[#111114]'
              }`}
            >
              {/* Progress bar line */}
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-[#1E1E21] overflow-hidden">
                {isActive && (
                  <motion.div
                    className="h-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0 }}
                  />
                )}
              </div>

              {/* Counter & Category */}
              <div className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase transition-colors">
                {`0${i + 1} • ${s.category}`}
              </div>

              {/* Strip Title */}
              <div
                className={`mt-0.5 sm:mt-1 font-['Space_Grotesk'] text-xs sm:text-sm font-bold transition-colors truncate ${
                  isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              >
                {s.stripTitle}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
