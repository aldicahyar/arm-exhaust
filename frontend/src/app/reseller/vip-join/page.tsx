'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { VipJoinCard, InviteInfo } from '@/features/reseller';

function VipJoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);

  useEffect(() => {
    if (!token || !token.trim()) {
      setError('Token undangan tidak disertakan dalam tautan.');
      setLoading(false);
      return;
    }

    const fetchInviteInfo = async () => {
      try {
        const res = await fetch(`/api/reseller/invite-info?token=${encodeURIComponent(token.trim())}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || 'Token undangan tidak valid, telah kedaluwarsa, atau sudah pernah digunakan.');
        }

        setInviteInfo(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memvalidasi token undangan.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchInviteInfo();
  }, [token]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#2B2B32] bg-[#141416] p-10 text-center shadow-2xl">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#F59E0B] border-t-transparent" />
        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-[#9AA0A8]">
          Memverifikasi Token VIP ARM Exhaust…
        </p>
      </div>
    );
  }

  if (error || !inviteInfo) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#7F1D1D] bg-[#141416] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1C0D0F] border border-[#7F1D1D]">
          <svg className="h-6 w-6 text-[#E81828]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <span className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-[#E81828]">
          STATUS: AKSES DITOLAK
        </span>

        <h1 className="mt-2 text-xl font-extrabold uppercase tracking-wide text-white">
          Tautan Undangan Tidak Valid
        </h1>

        <p className="mt-2 text-xs text-[#9AA0A8] leading-relaxed">
          {error || 'Token undangan tidak dapat diverifikasi oleh sistem. Kemungkinan tautan telah kedaluwarsa, telah diklaim sebelumnya, atau dibatalkan oleh administrator.'}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto rounded-lg border border-[#2B2B32] bg-[#0F0F11] px-5 py-2.5 text-xs font-semibold text-white hover:border-[#E81828] transition"
          >
            ← Kembali ke Beranda
          </Link>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20ARM%20Exhaust,%20saya%20mengalami%20kendala%20saat%20mengklaim%20undangan%20VIP%20Reseller"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto rounded-lg bg-[#E81828] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#FF2B3C] transition"
          >
            Hubungi Admin ARM
          </a>
        </div>
      </div>
    );
  }

  return <VipJoinCard token={token!} inviteInfo={inviteInfo} />;
}

export default function VipJoinPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] px-4 py-16 sm:px-6 lg:px-8 flex flex-col justify-center">
      {/* Brand Watermark / Header */}
      <div className="mx-auto mb-8 flex flex-col items-center">
        <Link href="/" className="transition hover:opacity-80">
          <Image
            src="/assets/Logo ARM no BG.png"
            alt="ARM Exhaust Official"
            width={180}
            height={60}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="mx-auto max-w-md rounded-2xl border border-[#2B2B32] bg-[#141416] p-10 text-center shadow-2xl">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#F59E0B] border-t-transparent" />
            <p className="mt-4 font-mono text-xs uppercase tracking-wider text-[#9AA0A8]">
              Memuat sesi VIP…
            </p>
          </div>
        }
      >
        <VipJoinContent />
      </Suspense>
    </main>
  );
}
