'use client';

import { motion, useReducedMotion } from 'framer-motion';

// Template remount tiap navigasi route — memberi animasi fade-up saat pindah halaman.
// Header & footer tidak ikut (mereka di layout), hanya konten halaman yang beranimasi.
export default function Template({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
