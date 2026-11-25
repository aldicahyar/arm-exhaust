'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image, { getImageProps } from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface HeroCampaignSlide {
  readonly id: string;
  readonly category: 'PRODUK' | 'PROMO' | 'ACARA' | 'WORKSHOP' | string;
  readonly title: string;
  readonly stripTitle: string;
  readonly href: string;
  readonly image: string;
  /** Gambar HP opsional (1080x1920, 9:16). Dipakai di layar < 768px; kosong = pakai `image`. */
  readonly imageMobile?: string;
}

// Standar gambar: Full-bleed 1920x1080 (16:9) landscape fotografi sinematik (seragam seperti 'Acara')
export const CAMPAIGN_SLIDES: readonly HeroCampaignSlide[] = [
  {
    id: 'kdv2-vario125',
    category: 'PRODUK',
    title: 'ARM NUSANTARA TI — BURNT TITANIUM',
    stripTitle: 'Nusantara Titanium Series',
    href: '/catalog',
    image: '/assets/products/sample-hero.jpg',
  },
  {
    id: 'promo-deals',
    category: 'PROMO',
    title: 'YEAR-END RACING DEALS: DISKON 20%',
    stripTitle: 'Year-End Racing Deals',
    href: '/catalog',
    image: '/assets/products/sample-hero.jpg',
  },
  {
    id: 'event-sentul',
    category: 'ACARA',
    title: 'SENTUL TRACK DAY & DYNO MEETUP',
    stripTitle: 'Sentul Track Day 2026',
    href: '/contact',
    image: '/assets/products/sample-hero.jpg',
  },
  {
    id: 'workshop-custom',
    category: 'WORKSHOP',
    title: 'CUSTOM INLET & PRECISION DYNO TUNE',
    stripTitle: 'Custom Inlet & Dyno Tune',
    href: 'https://wa.me/6281234567890',
    image: '/assets/products/sample-hero.jpg',
  },
];

const DURATION = 5500;

/** Gambar HP dipakai di bawah breakpoint `md` Tailwind; >= 768px selalu gambar desktop. */
const MOBILE_MEDIA = '(max-width: 767px)';

interface HeroSlideImageProps {
  readonly slide: HeroCampaignSlide;
  readonly priority: boolean;
}

/**
 * Art direction: bila slide punya Gambar HP, render <picture> agar browser hanya
 * mengunduh satu sumber yang cocok dengan viewport. getImageProps tidak menyisipkan
 * <link rel="preload">, jadi slide pertama tidak memicu unduhan ganda.
 */
function HeroSlideImage({ slide, priority }: Readonly<HeroSlideImageProps>) {
  if (!slide.imageMobile) {
    return (
      <Image
        src={slide.image}
        alt={slide.title}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover object-center"
      />
    );
  }

  const common = {
    alt: slide.title,
    fill: true,
    sizes: '100vw',
    // Next 16: `priority` is deprecated; eager + high fetch priority for the first (LCP) slide.
    loading: priority ? ('eager' as const) : undefined,
    fetchPriority: priority ? ('high' as const) : undefined,
    className: 'object-cover object-center',
  };
  const { props: mobileProps } = getImageProps({ ...common, src: slide.imageMobile });
  // `images.unoptimized: true` (next.config.ts) => getImageProps tidak menghasilkan srcSet, jadi pakai src.
  const mobileSrcSet = mobileProps.srcSet ?? mobileProps.src;
  const { props: desktopProps } = getImageProps({ ...common, src: slide.image });

  return (
    <picture>
      <source media={MOBILE_MEDIA} srcSet={mobileSrcSet} sizes="100vw" />
      <img {...desktopProps} alt={slide.title} />
    </picture>
  );
}

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
  readonly image_mobile_url?: string | null;
  readonly sort_order?: number;
  readonly is_active?: boolean;
}

export function HeroCarousel() {
  const [slides, setSlides] = useState<readonly HeroCampaignSlide[]>(CAMPAIGN_SLIDES);
  const [active, setActive] = useState(0);
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
          imageMobile: item.image_mobile_url ?? undefined,
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
    elapsed.current = 0;
    startRef.current = Date.now();
  }, []);

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + slides.length) % slides.length);
    elapsed.current = 0;
    startRef.current = Date.now();
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % slides.length);
    elapsed.current = 0;
    startRef.current = Date.now();
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length === 0) return;

    const tick = () => {
      const total = elapsed.current + (Date.now() - startRef.current);
      if (total >= DURATION) {
        elapsed.current = 0;
        startRef.current = Date.now();
        setActive((p) => (p + 1) % slides.length);
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

  const slideIndex = active >= slides.length ? 0 : active;
  const slide = slides[slideIndex] ?? CAMPAIGN_SLIDES[0];

  return (
    <section
      id="hero-section"
      className="group relative flex w-full flex-col justify-between overflow-hidden bg-[#0E0E10] h-[100svh] min-h-[460px]"
      style={{
        height: '100svh',
        minHeight: '460px',
        /* Zoom-proof full-screen contract: calc(100svh - 129px) and 460px */
      }}
      aria-label="ARM Exhaust featured campaigns and products"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* ── Slide Area: Fleksibel Mengisi Seluruh Ruang Viewport (Flex-1) ── */}
      <div className="relative flex flex-1 flex-col justify-end overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.6, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <HeroSlideImage slide={slide} priority={slideIndex === 0} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dual Ambient Dark Gradient Blending Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#0A0A0B]/90 via-[#0A0A0B]/35 to-transparent"
        />

        {/* Content Layer Over Image */}
        {/* Left edge aligned with the Previous Slide chevron (left-5 + centered 32px icon ≈ 40px) */}
        <div className="relative z-20 flex w-full flex-1 flex-col justify-end px-4 pb-12 sm:px-10 sm:pb-16 lg:pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="max-w-4xl"
            >
              {/* Bold Marque Title (Clean Typography without arrow icon or strip badge) */}
              <h1 className="font-['Montserrat'] text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-light uppercase tracking-[0.06em] lg:tracking-[0.1em] text-balance text-white drop-shadow-2xl leading-[1.2]">
                <Link
                  href={slide.href}
                  className="inline transition-colors duration-200 hover:text-zinc-200"
                >
                  {slide.title}
                </Link>
              </h1>

              {/* Contextual Action Links */}
              <div className="mt-5 flex items-center gap-3 sm:gap-5 whitespace-nowrap font-['Montserrat'] text-[10px] sm:text-[11px] font-normal uppercase tracking-[0.14em] sm:tracking-[0.22em]">
                <Link
                  href={slide.href}
                  className="inline-flex items-center gap-1.5 text-white hover:text-zinc-300 transition-colors py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded"
                >
                  <span>Vehicle Specifications</span>
                </Link>
                <span className="text-zinc-600 font-mono" aria-hidden="true">|</span>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded"
                >
                  <span>Explore Series</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot Indicators Mobile & Tablet */}
        <div className="absolute bottom-6 right-6 z-30 flex gap-2 md:hidden">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === slideIndex ? 'w-6 bg-white' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Subtle Floating Side Navigation Chevrons (Pure Transparent Minimalist) ── */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="group/nav absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center bg-transparent text-white/40 opacity-0 md:group-hover:opacity-100 hover:text-white transition-all duration-300 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-full"
          >
            <svg
              className="h-6 w-6 sm:h-8 sm:w-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] transition-transform duration-200 group-hover/nav:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.25}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="group/nav absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center bg-transparent text-white/40 opacity-0 md:group-hover:opacity-100 hover:text-white transition-all duration-300 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-full"
          >
            <svg
              className="h-6 w-6 sm:h-8 sm:w-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] transition-transform duration-200 group-hover/nav:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.25}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
}
