'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

// Smooth scroll global berbasis Lenis (momentum/lerp)
let lenisInstance: Lenis | null = null;

export function SmoothScroll() {
  useEffect(() => {
    // Hormati preferensi reduksi gerak — biarkan scroll native
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ autoRaf: true });
    lenisInstance = lenis;
    return () => {
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return null;
}

export function scrollToTop() {
  if (lenisInstance) lenisInstance.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}
