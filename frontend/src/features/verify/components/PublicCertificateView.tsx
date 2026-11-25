'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicCertificateData } from '@/features/account/types';

interface PublicCertificateViewProps {
  readonly certificate: PublicCertificateData | null;
  readonly serialNumber: string;
  readonly token?: string;
}

export function PublicCertificateView({
  certificate,
  serialNumber,
  token,
}: Readonly<PublicCertificateViewProps>) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [inputToken, setInputToken] = useState(token ?? '');

  const handleCopy = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    router.push(`/verify/${encodeURIComponent(serialNumber)}?token=${encodeURIComponent(inputToken.trim())}`);
  };

  // State 1: Non-existent / Unverified Serial
  if (!certificate || !certificate.isAuthentic) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center px-4 py-16 font-sans">
        <div className="w-full max-w-xl border border-[#1E1E21] bg-[#0E0E10] p-8 md:p-12 text-center rounded-none shadow-2xl">
          <div className="inline-flex items-center gap-2 bg-[#2B2B30] text-[#E4E4E7] px-3 py-1 text-[11px] font-mono tracking-widest uppercase mb-6">
            <span>UNVERIFIED SERIAL NUMBER</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-normal text-white mb-3 tracking-tight">
            No Official Registry Record Found
          </h1>

          <p className="text-[14px] text-[#8A8F98] leading-relaxed mb-6">
            The serial number <span className="font-mono text-white font-medium">{serialNumber}</span> does not match any authenticated exhaust system fabricated by ARM Exhaust workshop.
          </p>

          <div className="p-4 bg-[#141416] border border-[#1E1E21] text-[12px] text-[#8A8F98] leading-relaxed text-left mb-8">
            <span className="font-semibold text-white block mb-1">Notice for Buyers & Enthusiasts:</span>
            Unverified exhaust systems may be counterfeit or unauthorized replicas. Genuine ARM exhausts are laser-engraved with verifiable serial codes and registered before dispatch.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[13px]">
            <Link
              href="/catalog"
              className="w-full sm:w-auto px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors"
            >
              Explore Official ARM Catalog →
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 text-[#8A8F98] hover:text-white underline underline-offset-4 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Protected Authenticity Record (Token required or invalid)
  if (certificate.isProtected) {
    const isTokenRejected = Boolean(token && !certificate.tokenValid);

    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white font-sans antialiased py-12 md:py-20 px-4 md:px-8">
        <div className="max-w-[720px] mx-auto">
          {/* Top Minimal Nav */}
          <div className="flex items-center justify-between border-b border-[#1E1E21] pb-6 mb-10">
            <Link
              href="/catalog"
              className="text-[13px] text-[#8A8F98] hover:text-white transition-colors flex items-center gap-2"
            >
              ← Back to Store
            </Link>
            <div className="text-[11px] font-mono tracking-widest text-[#8A8F98] uppercase">
              Official Verification Registry
            </div>
          </div>

          <div className="border border-[#2B2B30] bg-[#0E0E10] p-6 md:p-10 shadow-2xl relative">
            <div className="inline-flex items-center gap-2 bg-[#1C180A] border border-[#B45309] text-[#F59E0B] px-3 py-1 text-[11px] font-mono font-bold tracking-widest uppercase mb-6">
              <span>PROTECTED AUTHENTICITY RECORD</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-normal text-white mb-2 tracking-tight">
              Official Exhaust Registered
            </h1>

            <p className="text-[14px] text-[#8A8F98] leading-relaxed mb-6">
              Nomor seri <span className="font-mono text-white font-medium">{serialNumber}</span> terdaftar resmi pada database fabrikasi ARM Exhaust untuk model <span className="text-white font-medium">{certificate.modelName}</span> ({certificate.vehicleMatch}).
            </p>

            <div className="p-5 bg-[#141416] border border-[#1E1E21] text-[13px] text-[#8A8F98] leading-relaxed mb-6">
              <span className="font-semibold text-white block mb-1">Proteksi Keamanan Anti-Scraping:</span>
              Untuk melindungi kerahasiaan data pemilik dan mencegah pemalsuan nomor seri, data lengkap sertifikat otentikasi hanya dapat dibuka melalui <strong className="text-white font-medium">Scan QR Code resmi</strong> pada kartu garansi fisik atau dengan memasukkan <strong className="text-white font-medium">Token Keamanan</strong> di bawah ini.
            </div>

            {isTokenRejected && (
              <div className="p-3.5 mb-6 bg-[#2B1113] border border-[#DC2626] text-[#F87171] text-[13px] leading-relaxed">
                Token keamanan tidak cocok atau salah. Silakan periksa kembali token yang tertera pada kartu garansi fisik ARM Anda.
              </div>
            )}

            <form onSubmit={handleUnlock} className="flex flex-col sm:flex-row gap-3 mb-8">
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Masukkan Token Keamanan (contoh: v_k9m2xLq1p...)"
                className="flex-1 bg-[#141416] border border-[#2B2B30] focus:border-white text-white px-4 py-3 text-[13px] font-mono outline-none transition-colors"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-black text-[13px] font-medium hover:bg-[#E4E4E7] transition-colors"
              >
                Buka Sertifikat →
              </button>
            </form>

            <div className="text-[12px] text-[#8A8F98] border-t border-[#1E1E21] pt-6 flex flex-col sm:flex-row justify-between gap-4">
              <span>Kartu garansi hilang atau butuh bantuan?</span>
              <Link href="/catalog" className="text-white hover:underline">
                Hubungi ARM Concierge Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Verified Authentic Certificate (Unlocked via Valid Token)
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans antialiased py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-[880px] mx-auto">
        
        {/* Top Minimal Nav */}
        <div className="flex items-center justify-between border-b border-[#1E1E21] pb-6 mb-10">
          <Link
            href="/catalog"
            className="text-[13px] text-[#8A8F98] hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Store
          </Link>
          <div className="text-[11px] font-mono tracking-widest text-[#8A8F98] uppercase">
            Official Verification Registry
          </div>
        </div>

        {/* Certificate Card Master Container */}
        <article className="border border-[#1E1E21] bg-[#0E0E10] p-6 md:p-12 shadow-2xl relative">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-[#1E1E21]">
            <div>
              <div className="inline-flex items-center gap-2 bg-white text-black px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest mb-4">
                <span>VERIFIED AUTHENTIC EXHAUST SYSTEM</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-normal text-white tracking-tight">
                {certificate.modelName}
              </h1>
              <div className="text-[14px] text-[#8A8F98] mt-1">
                Custom fabricated for <span className="text-white">{certificate.vehicleMatch}</span>
              </div>
            </div>

            <div className="text-left md:text-right shrink-0">
              <div className="text-[11px] font-mono text-[#8A8F98] uppercase">Official Serial</div>
              <div className="text-[20px] font-mono font-medium text-white tracking-wider mt-0.5">
                {certificate.serialNumber}
              </div>
              <div className="text-[11px] font-mono text-[#8A8F98] mt-1">
                Verified {certificate.verificationCount} times
              </div>
            </div>
          </div>

          {/* 2-Column High-Signal Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-10 border-b border-[#1E1E21]">
            
            {/* COLUMN 1: TECHNICAL SPECIFICATIONS */}
            <div>
              <h2 className="text-[12px] font-mono tracking-widest text-[#8A8F98] uppercase mb-4">
                Technical Specifications
              </h2>
              <dl className="space-y-3.5 text-[14px]">
                <div className="flex justify-between py-1 border-b border-[#141416]">
                  <dt className="text-[#8A8F98]">Material Grade</dt>
                  <dd className="text-white font-medium text-right">{certificate.materialGrade}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-[#141416]">
                  <dt className="text-[#8A8F98]">Motorcycle Match</dt>
                  <dd className="text-white text-right">{certificate.vehicleMatch}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-[#141416]">
                  <dt className="text-[#8A8F98]">Fabrication Date</dt>
                  <dd className="text-white text-right">{certificate.fabricationDate}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-[#141416]">
                  <dt className="text-[#8A8F98]">Welder / Inspector</dt>
                  <dd className="text-white text-right">{certificate.welderSignature}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-[#8A8F98]">Acoustic Certification</dt>
                  <dd className="text-white text-right">Pass • dB Validated</dd>
                </div>
              </dl>
            </div>

            {/* COLUMN 2: PROVENANCE & WARRANTY STATUS */}
            <div>
              <h2 className="text-[12px] font-mono tracking-widest text-[#8A8F98] uppercase mb-4">
                Ownership & Provenance
              </h2>
              <dl className="space-y-3.5 text-[14px]">
                <div className="flex justify-between py-1 border-b border-[#141416]">
                  <dt className="text-[#8A8F98]">Registered Owner</dt>
                  <dd className="text-white font-medium text-right font-mono">{certificate.ownerMasked}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-[#141416]">
                  <dt className="text-[#8A8F98]">Registered City</dt>
                  <dd className="text-white text-right">{certificate.cityOrigin}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-[#141416]">
                  <dt className="text-[#8A8F98]">Warranty Status</dt>
                  <dd className="text-white font-medium text-right">
                    <span className="text-white">Active</span> • {certificate.warrantyType}
                  </dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-[#8A8F98]">Registry Status</dt>
                  <dd className="text-white text-right font-mono">AUTHENTIC / SECURED</dd>
                </div>
              </dl>
            </div>

          </div>

          {/* Action Footer */}
          <div className="pt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-5 text-[13px] border border-white text-white hover:bg-white hover:text-black transition-colors"
              >
                {copied ? '✓ Link Copied' : 'Share Verification Link'}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-5 text-[13px] border border-[#2B2B30] text-[#8A8F98] hover:text-white hover:border-white transition-colors"
              >
                Print Official Spec Sheet ↗
              </button>
            </div>

            <Link
              href="/catalog"
              className="text-[13px] text-[#8A8F98] hover:text-white underline underline-offset-4 text-center sm:text-right transition-colors"
            >
              Browse ARM Exhaust Systems →
            </Link>
          </div>

        </article>

      </div>
    </div>
  );
}
