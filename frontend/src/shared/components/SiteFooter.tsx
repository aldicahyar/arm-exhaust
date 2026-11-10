'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { RollUpText } from './RollUpText';
import { scrollToTop } from './SmoothScroll';

const EASE = [0.22, 1, 0.36, 1] as const;

// ponytail: route Terms/Event belum ada — arahkan ke # sampai halamannya dibuat
const NAV_LINKS = [
  { label: 'Products', href: '/catalog' },
  { label: 'About', href: '/contact' },
  { label: 'Terms', href: '#' },
  { label: 'Event', href: '#' },
];

// ponytail: URL sosmed & nomor WA placeholder — isi data riil sebelum publish
const SOCIALS = [
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M16.6 3c.4 2.1 1.8 3.6 3.9 3.9v3c-1.5 0-2.9-.5-3.9-1.3v6.6c0 3.4-2.6 5.8-5.8 5.8A5.8 5.8 0 0 1 5 15.2c0-3.2 2.6-5.8 5.8-5.8.3 0 .7 0 1 .1v3.1a2.8 2.8 0 1 0 1.9 2.6V3h2.9z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M23 12s0-3.9-.5-5.6c-.3-1-1.1-1.8-2.1-2C18.6 4 12 4 12 4s-6.6 0-8.4.4c-1 .2-1.8 1-2.1 2C1 8.1 1 12 1 12s0 3.9.5 5.6c.3 1 1.1 1.8 2.1 2 1.8.4 8.4.4 8.4.4s6.6 0 8.4-.4c-1 .2 1.8-1 2.1-2 .5-1.7.5-5.6.5-5.6zM9.8 15.5v-7l6 3.5-6 3.5z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/620000000000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4zm-3 4c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.2.2 1.8 2.8 4.4 3.9 2.2.9 2.6.7 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.5-.3-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.5-.6c.1-.2.1-.3.2-.5l-.8-2c-.2-.5-.4-.4-.6-.4H9z" />
      </svg>
    ),
  },
];

function AnimatedNavLink({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="text-sm text-[#9AA0A8] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF] rounded"
    >
      <RollUpText label={label} />
    </Link>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1E1E21]">
      <motion.div
        className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 flex min-h-[calc(100svh-128px)] flex-col items-center justify-center gap-10 text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
      >
        {/* Logo — klik untuk scroll ke atas */}
        <motion.div variants={itemVariants}>
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="flex h-14 w-36 cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF] rounded"
          >
            <Image
              src="/assets/Logo ARM no BG.png"
              alt="Logo ARM Exhaust"
              width={720}
              height={468}
              className="h-auto w-[720px] object-contain"
            />
          </button>
        </motion.div>

        {/* Nav link terpusat */}
        <motion.nav variants={itemVariants} aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {NAV_LINKS.map((link) => (
            <AnimatedNavLink key={link.label} label={link.label} href={link.href} />
          ))}
        </motion.nav>

        {/* Sosmed */}
        <motion.div variants={itemVariants} className="flex items-center gap-5">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="text-[#9AA0A8] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF] rounded"
            >
              {s.icon}
            </a>
          ))}
        </motion.div>

        {/* Copyright */}
        <motion.span
          variants={itemVariants}
          className="font-mono text-[10px] text-[#8A8F98] tracking-wider uppercase"
        >
          © 2026 ARM Exhaust
        </motion.span>
      </motion.div>
    </footer>
  );
}
