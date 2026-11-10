'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion';

interface ScrollRevealImageProps {
  src: string;
  alt: string;
  href: string;
}

export function ScrollRevealImage({ src, alt, href }: ScrollRevealImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    restDelta: 0.001,
  });

  // Scale: 1.6 -> 1.0; Width: 40vw -> 95vw; Border Radius: 0px -> 16px
  const scale = useTransform(smoothProgress, [0, 1], [1.6, 1.0]);
  const width = useTransform(smoothProgress, [0, 1], ['40vw', '95vw']);
  const borderRadius = useTransform(smoothProgress, [0, 1], ['0px', '16px']);

  // ponytail: prefers-reduced-motion disables scroll transforms, upgrade to static responsive sizes if needed
  if (shouldReduceMotion) {
    return (
      <div className="w-full flex justify-center px-4 py-3">
        <Link
          href={href}
          className="relative block w-[95vw] max-w-6xl h-[60vh] md:h-[500px] rounded-2xl overflow-hidden border-2 border-transparent focus-visible:border-[#2E6BFF] focus-visible:outline-none transition-colors"
        >
          <Image src={src} alt={alt} fill priority className="object-cover" sizes="95vw" />
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex justify-center items-center py-6 overflow-hidden">
      <Link
        href={href}
        className="block cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B] focus-visible:outline-none transition-shadow"
        aria-label={`View product details: ${alt}`}
      >
        <motion.div
          style={{ width, borderRadius }}
          className="relative h-[60vh] md:h-[480px] max-w-6xl overflow-hidden bg-[#141416] border border-[#2B2B30]"
        >
          <motion.div style={{ scale }} className="w-full h-full relative">
            <Image
              src={src}
              alt={alt}
              fill
              priority
              className="object-cover select-none pointer-events-none"
              sizes="(max-width: 768px) 100vw, 95vw"
            />
          </motion.div>
        </motion.div>
      </Link>
    </div>
  );
}
