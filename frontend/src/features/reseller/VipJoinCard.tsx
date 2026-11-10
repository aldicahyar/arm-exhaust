'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGoogleButton } from '@/features/auth/AuthGoogleButton';
import { useNotice } from '@/shared/components';

export interface InviteInfo {
  valid: boolean;
  partnerName: string;
  expiresAt: string;
  roleToGrant: string;
}

export interface VipJoinCardProps {
  token: string;
  inviteInfo: InviteInfo;
}

export function VipJoinCard({ token, inviteInfo }: VipJoinCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimedUser, setClaimedUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  let notify: any = null;
  try {
    const noticeCtx = useNotice();
    notify = noticeCtx?.notify;
  } catch {}

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(inviteInfo.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [inviteInfo.expiresAt]);

  const handleClaimSuccess = (userData: any) => {
    setClaimedUser(userData);

    // Broadcast across tabs
    if (typeof window !== 'undefined') {
      try {
        const channel = new BroadcastChannel('arm_auth_sync');
        channel.postMessage({
          type: 'AUTH_SUCCESS',
          user: userData,
          role: userData?.role,
        });
        channel.close();
      } catch {}

      try {
        localStorage.setItem(
          'arm_auth_event',
          JSON.stringify({ type: 'AUTH_SUCCESS', user: userData, timestamp: Date.now() })
        );
      } catch {}
    }

    notify?.success(
      'Akses VIP Reseller Aktif!',
      `Selamat datang ${userData?.name || inviteInfo.partnerName}. Diskon 20% aktif.`
    );
  };

  const handleClaimGoogle = async (credential: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/reseller/claim-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          credential,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengklaim undangan VIP via Google.');
      }

      handleClaimSuccess(data.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat klaim undangan.';
      setError(msg);
      notify?.error('Gagal Klaim Undangan', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/reseller/claim-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Email atau password tidak sesuai, atau undangan tidak valid.');
      }

      handleClaimSuccess(data.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memverifikasi akun.';
      setError(msg);
      notify?.error('Gagal Verifikasi', msg);
    } finally {
      setLoading(false);
    }
  };

  // If token expired
  if (timeLeft.isExpired) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#7F1D1D] bg-[#141416] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1C0D0F] border border-[#7F1D1D]">
          <svg className="h-6 w-6 text-[#E81828]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-extrabold uppercase tracking-wide text-white">
          Undangan VIP Telah Kedaluwarsa
        </h2>
        <p className="mt-2 text-xs text-[#9AA0A8] leading-relaxed">
          Tautan undangan kemitraan untuk <strong className="text-white">{inviteInfo.partnerName}</strong> telah melewati batas waktu masa berlaku.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto rounded-lg border border-[#2B2B32] bg-[#0F0F11] px-5 py-2.5 text-xs font-semibold text-white hover:border-[#E81828] transition"
          >
            Kembali ke Beranda
          </Link>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20ARM%20Exhaust,%20undangan%20VIP%20Reseller%20saya%20telah%20kedaluwarsa"
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

  // If Claim Success Celebration Card
  if (claimedUser) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#B45309] bg-[#141416] p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1C180A] border-2 border-[#B45309] shadow-lg shadow-amber-500/20">
            <svg className="h-8 w-8 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#B45309] bg-[#1C180A] px-3.5 py-1 font-mono text-xs font-bold tracking-wider text-[#F59E0B]">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
            AKSES VIP RESELLER AKTIF (DISKON 20%)
          </span>

          <h2 className="mt-3 text-2xl font-black uppercase tracking-wide text-white">
            Selamat Datang, Mitra Resmi ARM Exhaust!
          </h2>

          <p className="mt-2 text-xs text-[#9AA0A8] max-w-md leading-relaxed">
            Status kemitraan B2B untuk <strong className="text-white">{inviteInfo.partnerName}</strong> telah berhasil diaktivasi pada akun Anda. Hak akses harga grosir resmi kini langsung berlaku di seluruh katalog.
          </p>

          <div className="mt-6 w-full rounded-xl border border-[#2B2B32] bg-[#0F0F11] p-4 text-left font-mono text-xs space-y-2">
            <div className="flex justify-between items-center border-b border-[#2B2B32] pb-2">
              <span className="text-[#8A8F98]">Nama Akun</span>
              <span className="font-bold text-white">{claimedUser.name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#2B2B32] pb-2">
              <span className="text-[#8A8F98]">Email Terverifikasi</span>
              <span className="text-[#C7CAD1]">{claimedUser.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8A8F98]">Tingkat Peran</span>
              <span className="text-[#F59E0B] font-bold">RESELLER OFFICIAL (20% OFF)</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row w-full gap-3">
            <Link
              href="/catalog"
              className="flex-1 rounded-xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] py-3 text-center text-xs font-extrabold uppercase tracking-wider text-black shadow-lg shadow-amber-500/20 hover:from-[#F59E0B] hover:to-[#FBBF24] transition duration-150 active:scale-95"
            >
              Masuk ke Katalog Grosir B2B →
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#2B2B32] bg-[#0F0F11] px-6 py-3 text-center text-xs font-semibold text-[#C7CAD1] hover:text-white transition"
            >
              Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[#2B2B32] bg-[#141416] p-6 sm:p-8 shadow-2xl relative">
      {/* Gold Telemetry Badge */}
      <div className="flex items-center justify-between border-b border-[#2B2B32] pb-4">
        <span className="inline-flex items-center gap-1.5 rounded border border-[#B45309] bg-[#1C180A] px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-[#F59E0B]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] animate-ping" />
          OFFICIAL ARM EXHAUST B2B INVITATION
        </span>

        {/* Live Expiry Countdown */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8A8F98]" title="Sisa Waktu Undangan">
          <svg className="h-3.5 w-3.5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-white font-bold">
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Greeting & Partner Context */}
      <div className="mt-5 text-center">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
          Aktivasi Kemitraan VIP Bengkel
        </h1>
        <div className="mt-2 inline-block rounded-lg border border-[#B45309]/50 bg-[#1C180A] px-3 py-1 font-mono text-xs font-bold text-[#F59E0B]">
          Mitra: {inviteInfo.partnerName}
        </div>
        <p className="mt-2 text-xs text-[#9AA0A8] leading-relaxed">
          Tautan ini memberikan hak akses harga grosir B2B (Diskon 20%) untuk pemesanan knalpot racing ARM Exhaust secara langsung.
        </p>
      </div>

      {/* Security Re-Authentication Notice */}
      <div className="mt-5 rounded-xl border border-[#2B2B32] bg-[#0F0F11] p-3.5 text-xs text-[#C7CAD1] leading-relaxed flex items-start gap-2.5">
        <svg className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <strong className="text-white block font-semibold mb-0.5">Wajib Verifikasi Akun:</strong>
          Untuk mengamankan akses B2B eksklusif Anda, silakan masuk atau daftar ulang menggunakan akun Google atau Email &amp; Password bengkel Anda.
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="mt-4 rounded-xl border border-[#7F1D1D] bg-[#1C0D0F] p-3 text-xs text-[#E81828] flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Pathway A: 1-Click Google SSO */}
      <div className="mt-6">
        <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8A8F98] mb-2 text-center">
          Opsi Cepat: Verifikasi 1-Klik Google
        </label>
        <AuthGoogleButton
          disabled={loading}
          onCredential={handleClaimGoogle}
        />
      </div>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2B2B32]" />
        </div>
        <span className="relative bg-[#141416] px-3 font-mono text-[10px] uppercase tracking-widest text-[#8A8F98]">
          Atau Gunakan Email &amp; Password
        </span>
      </div>

      {/* Pathway B: Email & Password */}
      <form onSubmit={handleClaimCredentials} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8A8F98] mb-1">
            Email Terdaftar Bengkel
          </label>
          <input
            type="email"
            required
            placeholder="bengkel@speedshop.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-[#2B2B32] bg-[#0F0F11] px-3.5 py-2.5 text-xs text-white placeholder-[#8A8F98] focus:border-[#F59E0B] focus:outline-none transition disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8A8F98] mb-1">
            Password Akun
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-[#2B2B32] bg-[#0F0F11] px-3.5 py-2.5 text-xs text-white placeholder-[#8A8F98] focus:border-[#F59E0B] focus:outline-none transition disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full rounded-lg bg-gradient-to-r from-[#D97706] to-[#F59E0B] py-3 text-xs font-bold uppercase tracking-wider text-black hover:from-[#F59E0B] hover:to-[#FBBF24] transition duration-150 ease-out shadow-lg shadow-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              <span>Memverifikasi Akses…</span>
            </>
          ) : (
            <span>Klaim &amp; Aktivasi Status Reseller</span>
          )}
        </button>
      </form>
    </div>
  );
}
