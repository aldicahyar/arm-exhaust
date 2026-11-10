'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Variant hero 1920x1080 dari scripts/make-hero.ps1 — produk utuh di kanvas #0E0E10
const SLIDES = [
  {
    id: 'kdv2-vario125',
    name: 'KONDOMAN V2',
    price: 'Rp 1.850.000',
    image: '/assets/products/sample-hero.jpg', // CONTOH 1920x1080 dari internet — ganti kembali ke kdv2-vario125-hero.jpg
  },
  {
    id: 'stdr-beat',
    name: 'STANDAR RACING',
    price: 'Rp 1.250.000',
    image: '/assets/products/sample-hero.jpg',
  },
  {
    id: 'dbk-vario160',
    name: 'DB KILLER',
    price: 'Rp 2.350.000',
    image: '/assets/products/sample-hero.jpg',
  },
  {
    id: 'fs-nmax-turbo',
    name: 'FULL SYSTEM',
    price: 'Rp 3.140.000',
    image: '/assets/products/sample-hero.jpg',
  },
];

const DURATION = 5000;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const startRef = useRef<number>(Date.now());
  const elapsed = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    setProgress(0);
    elapsed.current = 0;
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (paused) return;

    const tick = () => {
      const total = elapsed.current + (Date.now() - startRef.current);
      const pct = Math.min((total / DURATION) * 100, 100);
      setProgress(pct);
      if (total >= DURATION) {
        elapsed.current = 0;
        startRef.current = Date.now();
        setActive((p) => (p + 1) % SLIDES.length);
        setProgress(0);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, paused]);

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
    if (idx === active) { paused ? resume() : pause(); }
    else { goTo(idx); setPaused(false); }
  };

  const slide = SLIDES[active];

  return (
    <section
      className="relative w-full overflow-hidden"
      aria-label="ARM Exhaust featured products gallery"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* ── Slide area — murni gambar, detail ada di panel bawah ── */}
      <div className="relative w-full overflow-hidden bg-[#0E0E10]" style={{ height: 'calc(100svh - 226px)', minHeight: '340px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt={slide.name}
              fill
              priority={active === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators mobile */}
        <div className="absolute top-4 right-4 flex gap-1.5 md:hidden">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-[3px] rounded-none transition-all duration-300 ${
                i === active ? 'w-6 bg-white' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Detail panels desktop ── */}
      <div className="hidden md:grid grid-cols-4 border-t border-[#1E1E21] bg-[#0A0A0B]">
        {SLIDES.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.id}
              onClick={() => handlePanel(i)}
              className={`relative text-left p-5 border-r border-[#1E1E21] last:border-r-0 transition-colors duration-200 group ${
                isActive ? 'bg-[#111113]' : 'hover:bg-[#0e0e10]'
              }`}
            >
              {/* Progress bar — top edge */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#1E1E21]">
                {isActive && (
                  <motion.div
                    className="h-full bg-white"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0 }}
                  />
                )}
              </div>

              {/* Name — Bebas Neue */}
              <div className="flex items-start justify-between">
                <span
                  className={`leading-none transition-colors ${isActive ? 'text-white' : 'text-[#3A3A42] group-hover:text-[#8A8F98]'}`}
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '0.05em' }}
                >
                  {s.name}
                </span>
              </div>

              {/* Price */}
              <p className={`text-xs font-mono font-bold mt-2 transition-colors ${
                isActive ? 'text-white' : 'text-[#2B2B30]'
              }`}>
                {s.price}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
