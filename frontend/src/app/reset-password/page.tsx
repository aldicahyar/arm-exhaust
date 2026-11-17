import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ResetPasswordCard } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Reset Password | ARM Exhaust',
  description: 'Create a new secure password for your ARM Exhaust account.',
};

/**
 * Reset password page (/reset-password).
 * Wraps ResetPasswordCard in Suspense for Next.js App Router client-side useSearchParams.
 */
export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen sm:h-screen sm:max-h-screen w-full items-center justify-center overflow-x-hidden overflow-y-auto sm:overflow-hidden px-3 py-2 sm:px-4 sm:py-3">
      <Link
        href="/login"
        aria-label="Back to sign in"
        className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#2B2B30] bg-[#0F0F11]/80 text-[#9AA0A8] backdrop-blur transition hover:border-white hover:text-white sm:left-5 sm:top-5"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </Link>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2B2B30] border-t-white" />
          </div>
        }
      >
        <ResetPasswordCard />
      </Suspense>
    </main>
  );
}
