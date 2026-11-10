'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNotice } from '@/shared/components';
import { Check, Copy, X } from 'lucide-react';
import type { GeneratedInviteResult } from '../types';

interface VipInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteCreated?: () => void;
}

const EXPIRY_OPTIONS = [
  { label: '24 Jam', hours: 24 },
  { label: '3 Hari', hours: 72 },
  { label: '7 Hari', hours: 168 },
  { label: '30 Hari', hours: 720 },
];

export function VipInviteModal({ isOpen, onClose, onInviteCreated }: VipInviteModalProps) {
  const [partnerName, setPartnerName] = useState<string>('');
  const [partnerPhone, setPartnerPhone] = useState<string>('');
  const [roleToGrant, setRoleToGrant] = useState<'reseller' | 'distributor'>('reseller');
  const [expiresInHours, setExpiresInHours] = useState<number>(72);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<GeneratedInviteResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  let notify: any = null;
  try {
    const noticeCtx = useNotice();
    notify = noticeCtx?.notify;
  } catch {}

  const handleClose = useCallback(() => {
    setPartnerName('');
    setPartnerPhone('');
    setRoleToGrant('reseller');
    setExpiresInHours(72);
    setResult(null);
    setCopied(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) {
      notify?.error('Input Diperlukan', 'Nama mitra atau toko wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/reseller-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_name: partnerName.trim(),
          partner_phone: partnerPhone.trim() || undefined,
          role_to_grant: roleToGrant,
          expires_in_hours: expiresInHours,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menerbitkan undangan VIP.');
      }

      setResult(data);
      notify?.success(
        'Undangan VIP Diterbitkan',
        `Tautan aktivasi siap dibagikan untuk mitra ${data.partnerName}.`
      );
      onInviteCreated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat menerbitkan undangan.';
      notify?.error('Gagal', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify?.success('Disalin ke Clipboard', 'Tautan aktivasi VIP berhasil disalin.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify?.error('Gagal Menyalin', 'Silakan salin teks secara manual.');
    }
  };

  const formatWhatsAppUrl = (resItem: GeneratedInviteResult) => {
    const cleanPhone = (resItem.partnerPhone || '').replace(/\D/g, '');
    const phone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const discountLabel = resItem.roleToGrant === 'distributor' ? '35%' : '20%';
    const roleTitle = resItem.roleToGrant === 'distributor' ? 'Distributor Regional' : 'Reseller VIP';

    const expiryText = resItem.expiresInHours ? `${resItem.expiresInHours} jam` : `${expiresInHours} jam`;
    const msg = `Halo ${resItem.partnerName},\n\nAnda menerima *Undangan Kemitraan ARM Exhaust (${roleTitle} - Diskon ${discountLabel})*.\n\nSilakan klik tautan aktivasi berikut untuk mendaftar:\n${resItem.inviteUrl}\n\nTautan berlaku selama ${expiryText}. Terima kasih!`;

    if (phone) {
      return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-md rounded-xl border border-[#eedec5] bg-white p-6 shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eedec5] pb-3">
          <h3 className="font-semibold text-sm text-[#1e1501]">
            {result ? 'Token VIP Berhasil Diterbitkan' : 'Terbitkan Undangan Kemitraan VIP'}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-[#786b53] hover:bg-[#fbf5ea] hover:text-[#1e1501] transition"
            title="Tutup (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        {result ? (
          <div className="mt-4 space-y-3.5 text-xs">
            <div className="rounded-lg border border-[#d6fa47] bg-[#d6fa47]/20 p-3">
              <div className="flex items-center gap-1.5 text-[#1e1501] font-semibold">
                <Check className="h-4 w-4 text-[#1e1501]" />
                <span>Token Aktivasi Siap Dibagikan</span>
              </div>
              <p className="mt-1 text-[#1e1501] text-xs leading-relaxed">
                Mitra <strong className="text-[#1e1501] font-bold">{result.partnerName}</strong> akan langsung terverifikasi sebagai{' '}
                <strong className="text-[#1e1501] font-mono font-bold uppercase">{result.roleToGrant}</strong> ({result.roleToGrant === 'distributor' ? '35%' : '20%'} Margin).
              </p>
            </div>

            <div className="rounded-lg border border-[#eedec5] bg-[#fffbf5] p-3 space-y-1.5">
              <span className="text-xs text-[#786b53] font-medium">
                Tautan Privat Onboarding
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.inviteUrl}
                  className="w-full rounded-md border border-[#eedec5] bg-white px-3 py-1.5 font-mono text-xs text-[#1e1501] select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.inviteUrl)}
                  className="shrink-0 flex items-center gap-1 rounded-md border border-[#eedec5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1e1501] hover:bg-[#fbf5ea] transition"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copied ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            <a
              href={formatWhatsAppUrl(result)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-md border border-[#d6fa47] bg-[#d6fa47]/20 hover:bg-[#d6fa47]/40 text-[#1e1501] font-semibold py-2 px-3 text-xs transition"
            >
              <span>Bagikan Langsung via WhatsApp</span>
            </a>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eedec5]">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setPartnerName('');
                  setPartnerPhone('');
                }}
                className="rounded-md border border-[#eedec5] bg-[#fffbf5] px-3 py-1.5 text-xs text-[#786b53] hover:text-[#1e1501] hover:bg-[#fbf5ea] transition"
              >
                Buat Lagi
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-[#f8a712] hover:bg-[#e09207] px-3.5 py-1.5 text-xs font-bold text-[#1e1501] transition shadow-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-medium text-[#786b53] mb-1">
                Nama Mitra / Bengkel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Contoh: Speed Garage Racing"
                className="w-full rounded-md border border-[#eedec5] bg-[#fffbf5] px-3 py-1.5 text-xs text-[#1e1501] placeholder-[#786b53]/50 focus:border-[#f8a712] focus:outline-none focus:ring-1 focus:ring-[#f8a712] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#786b53] mb-1">
                Nomor WhatsApp <span className="text-[#786b53]/60">(Opsional)</span>
              </label>
              <input
                type="text"
                value={partnerPhone}
                onChange={(e) => setPartnerPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full rounded-md border border-[#eedec5] bg-[#fffbf5] px-3 py-1.5 font-mono text-xs text-[#1e1501] placeholder-[#786b53]/50 focus:border-[#f8a712] focus:outline-none focus:ring-1 focus:ring-[#f8a712] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#786b53] mb-1">
                Tingkat Kemitraan (B2B)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoleToGrant('reseller')}
                  className={`p-3 rounded-lg border text-left transition ${
                    roleToGrant === 'reseller'
                      ? 'border-[#f8a712] bg-[#fbf5ea] text-[#1e1501] shadow-xs'
                      : 'border-[#eedec5] bg-white text-[#786b53] hover:text-[#1e1501] hover:bg-[#fbf5ea]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#1e1501]">Reseller Bengkel</span>
                    <span className="font-mono text-xs text-[#786b53] font-bold">20%</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#786b53]">Toko variasi &amp; rekanan</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleToGrant('distributor')}
                  className={`p-3 rounded-lg border text-left transition ${
                    roleToGrant === 'distributor'
                      ? 'border-[#f8a712] bg-[#fbf5ea] text-[#1e1501] shadow-xs'
                      : 'border-[#eedec5] bg-white text-[#786b53] hover:text-[#1e1501] hover:bg-[#fbf5ea]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#1e1501]">Distributor</span>
                    <span className="font-mono text-xs text-[#f8a712] font-bold">35%</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#786b53]">Mitra grosir regional</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#786b53] mb-1">
                Masa Berlaku Token
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setExpiresInHours(opt.hours)}
                    className={`py-1.5 rounded-md border text-xs transition ${
                      expiresInHours === opt.hours
                        ? 'border-[#f8a712] bg-[#fbf5ea] text-[#1e1501] font-semibold'
                        : 'border-[#eedec5] bg-white text-[#786b53] hover:text-[#1e1501] hover:bg-[#fbf5ea]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-[#eedec5]">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-[#eedec5] bg-white px-3 py-1.5 text-xs text-[#786b53] hover:text-[#1e1501] hover:bg-[#fbf5ea] transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !partnerName.trim()}
                className="rounded-md bg-[#f8a712] hover:bg-[#e09207] px-3.5 py-1.5 text-xs font-bold text-[#1e1501] transition disabled:opacity-40 shadow-xs"
              >
                {isSubmitting ? 'Memproses…' : 'Terbitkan Token'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
