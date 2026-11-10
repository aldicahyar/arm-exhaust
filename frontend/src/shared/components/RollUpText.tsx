'use client';

import { motion, type Variants } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

// Hover: huruf terangkat ke atas dengan stagger, duplikat muncul dari bawah (gaya solaceui footer-section-1)
// Pakai di dalam <Link>/<button> yang punya aria-label — teks di sini aria-hidden.
const letterVariants: Variants = {
  rest: { y: '0%' },
  hover: (i: number) => ({
    y: '-50%',
    transition: { duration: 0.35, delay: i * 0.035, ease: EASE },
  }),
};

export function RollUpText({ label, active }: { label: string; active?: boolean }) {
  // `active` dikontrol parent (mis. hover indicator header); tanpa `active` pakai whileHover sendiri
  const controlled = active !== undefined;
  return (
    <motion.span
      aria-hidden="true"
      className="inline-flex"
      initial="rest"
      animate={controlled ? (active ? 'hover' : 'rest') : 'rest'}
      whileHover={controlled ? undefined : 'hover'}
    >
      {label.split('').map((ch, i) => (
        <span key={i} className="inline-block h-[1.5em] overflow-hidden">
          <motion.span className="flex flex-col" variants={letterVariants} custom={i}>
            <span className="block h-[1.5em] leading-[1.5em]">{ch}</span>
            <span className="block h-[1.5em] leading-[1.5em]">{ch}</span>
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
