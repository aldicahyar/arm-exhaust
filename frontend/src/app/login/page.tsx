import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth';

export const metadata: Metadata = {
  description: 'Access your ARM Exhaust customer account and enjoy exclusive racing exhaust offers.',
};

/**
 * Centralized auth page (/login).
 * No header & footer (see AppChrome) for a focused, distraction-free UX.
 */
export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-6 sm:py-8">
      <Link
        href="/"
        aria-label="Back to home"
        className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#2B2B30] bg-[#0F0F11]/80 text-[#9AA0A8] backdrop-blur transition hover:border-white hover:text-white sm:left-6 sm:top-6"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </Link>
      <AuthCard initialMode="login" />
    </main>
  );
}
