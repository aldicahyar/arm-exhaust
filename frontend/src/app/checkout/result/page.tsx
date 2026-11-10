'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ResultContent() {
  const status = useSearchParams().get('status');

  if (status === 'success') {
    return (
      <div className="text-center">
        <p className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase">Order received</p>
        <h1 className="font-['Space_Grotesk'] text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">
          Payment successful. Thank you!
        </h1>
        <p className="text-sm text-[#9AA0A8] mt-4 max-w-md mx-auto">
          Your order is being processed. The ARM Exhaust team will contact you via email/WhatsApp
          to confirm shipping.
        </p>
        <Link
          href="/catalog"
          className="inline-block mt-8 px-6 py-3 rounded-md bg-white text-[#0A0A0B] text-sm font-semibold hover:bg-[#E8E8EC] transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase">Checkout cancelled</p>
      <h1 className="font-['Space_Grotesk'] text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">
        Payment not completed.
      </h1>
      <p className="text-sm text-[#9AA0A8] mt-4 max-w-md mx-auto">
        You have not been charged. Please try again or contact us if you run into any issues.
      </p>
      <Link
        href="/catalog"
        className="inline-block mt-8 px-6 py-3 rounded-md border border-[#3A3A42] text-sm font-semibold text-white hover:bg-[#1E1E21] transition-colors"
      >
        Back to Catalog
      </Link>
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#2E6BFF] selection:text-white">
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 min-h-[calc(100svh-128px)] flex flex-col justify-center">
        <Suspense fallback={<p className="text-sm text-[#8A8F98] text-center">Memuat…</p>}>
          <ResultContent />
        </Suspense>
      </section>
    </main>
  );
}
