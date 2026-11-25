'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function VerifyNotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const [inputSerial, setInputSerial] = useState('');

  // Extract attempted serial from URL pathname (e.g. /verify/ARM-FAKE-1234 -> ARM-FAKE-1234)
  const attemptedSerial = pathname?.startsWith('/verify/')
    ? decodeURIComponent(pathname.replace('/verify/', '')).split('?')[0].split('/')[0].trim().toUpperCase()
    : '';

  const handleReVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSerial.trim()) return;
    router.push(`/verify/${encodeURIComponent(inputSerial.trim().toUpperCase())}`);
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans antialiased py-16 md:py-24 px-4 md:px-8 selection:bg-white selection:text-black">
      <div className="max-w-4xl mx-auto w-full">
        {/* Top Registry Telemetry Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-12">
          <Link
            href="/catalog"
            className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            ← Return to Showroom
          </Link>
          <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
            Audit Log // 404 Unverified
          </div>
        </header>

        {/* Hero Narrative Section - Monolithic, No Cards */}
        <section className="mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 block mb-3">
            Registry Audit Failure
          </span>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-6 [text-wrap:balance]">
            No fabrication entry found in official ledger
          </h1>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="font-mono text-lg md:text-xl text-white font-medium px-3 py-1 bg-zinc-900 border border-zinc-800">
              {attemptedSerial || 'UNKNOWN-SERIAL'}
            </span>
            <span className="bg-white text-black text-xs font-semibold uppercase tracking-wider px-2.5 py-1">
              UNVERIFIED
            </span>
          </div>
          <p className="text-base text-zinc-400 leading-relaxed max-w-2xl [text-wrap:pretty]">
            This serial number does not match any authenticated exhaust system fabricated by ARM. Genuine units undergo laser micro-etching on the muffler collar prior to final certification.
          </p>
        </section>

        {/* Inspection Breakdown - Structured Technical Rows, Zero Cards */}
        <section className="border-t border-zinc-800 pt-8 mb-12">
          <div className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-6">
            Inspection Breakdown
          </div>
          <div className="divide-y divide-zinc-900 border-y border-zinc-900">
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Query Status
              </span>
              <span className="text-sm text-zinc-200 font-mono">
                0 records matched across production database
              </span>
            </div>
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Physical Marking
              </span>
              <span className="text-sm text-zinc-200">
                Check the laser-etched badge on muffler collar or header inlet
              </span>
            </div>
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Secondary Market
              </span>
              <span className="text-sm text-zinc-200">
                Request the physical QR certificate card with security key from seller
              </span>
            </div>
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Material Standard
              </span>
              <span className="text-sm text-zinc-200">
                Grade 1 Japanese Titanium with signature handmade TIG weld beads
              </span>
            </div>
          </div>
        </section>

        {/* Re-Verify Prompt Bar - Integrated Single Row */}
        <section className="border-t border-zinc-800 pt-8 mb-12">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 block mb-2">
              Re-Run Query
            </span>
            <h2 className="text-lg font-medium text-white mb-2 [text-wrap:balance]">
              Verify another serial code
            </h2>
            <p className="text-sm text-zinc-400 mb-6 [text-wrap:pretty]">
              Enter the complete alphanumeric serial number exactly as engraved on your system.
            </p>
            <form onSubmit={handleReVerify} className="flex flex-col sm:flex-row border border-zinc-800 focus-within:border-white transition-colors">
              <div className="flex items-center px-4 py-3 bg-zinc-950 text-zinc-500 font-mono text-xs uppercase tracking-wider shrink-0 border-b sm:border-b-0 sm:border-r border-zinc-800">
                Serial
              </div>
              <input
                type="text"
                value={inputSerial}
                onChange={(e) => setInputSerial(e.target.value)}
                placeholder="e.g. ARM-NMAX-2026-0882"
                className="flex-1 bg-black text-white px-4 py-3 text-sm font-mono outline-none placeholder:text-zinc-600"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-colors shrink-0"
              >
                Verify Serial →
              </button>
            </form>
          </div>
        </section>

        {/* Action Resolution Bar */}
        <footer className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-zinc-800">
          <Link
            href="/catalog"
            className="w-full sm:w-auto px-6 py-3 border border-white text-white hover:bg-white hover:text-black font-semibold text-sm transition-colors text-center"
          >
            Explore Official ARM Catalog →
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/contact"
              className="text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
            >
              Report counterfeit or contact support
            </Link>
            <span className="text-zinc-800">•</span>
            <Link
              href="/"
              className="text-zinc-500 hover:text-white transition-colors"
            >
              Home
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
