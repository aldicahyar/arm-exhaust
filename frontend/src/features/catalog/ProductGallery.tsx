'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  return (
    <div
      role="group"
      aria-label={`Galeri foto ${name}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      }}
      className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF] rounded-lg"
    >
      <div className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-[#1E1E21] bg-[#101012]">
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={images[active]}
            alt={`${name}, foto ${active + 1}`}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </motion.div>

        {/* Panah navigasi */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Foto sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Foto berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Foto ${i + 1}`}
              aria-pressed={i === active}
              className={`relative w-14 sm:w-20 aspect-[4/3] rounded-md overflow-hidden border cursor-pointer transition-colors ${
                i === active ? 'border-white' : 'border-[#2B2B30] hover:border-[#3A3A42]'
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
