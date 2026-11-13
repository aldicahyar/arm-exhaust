'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNotice } from '@/shared/components';
import { Check, Copy, Send, RefreshCw, Plus } from 'lucide-react';
import type { VipInviteItem, GeneratedInviteResult } from '../types';

const DURATION_OPTIONS = [
  { label: '24 Jam', hours: 24 },
  { label: '3 Hari', hours: 72 },
  { label: '7 Hari', hours: 168 },
  { label: '30 Hari', hours: 720 },
];

export function VipInviteGenerator() {
  const [invites, setInvites] = useState<VipInviteItem[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Form states
  const [partnerName, setPartnerName] = useState<string>('');
  const [partnerPhone, setPartnerPhone] = useState<string>('');
  const [roleToGrant, setRoleToGrant] = useState<string>('reseller');
  const [expiresInHours, setExpiresInHours] = useState<number>(72);

  // Newly generated invite result
  const [newInvite, setNewInvite] = useState<GeneratedInviteResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  let notify: any = null;
  try {
    const noticeCtx = useNotice();
    notify = noticeCtx?.notify;
  } catch {}

  const fetchInvites = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/admin/reseller-invites');
      if (!res.ok) {
        throw new Error('Gagal memuat riwayat token undangan VIP.');
      }
      const data = await res.json();
      setInvites(data.invites || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar token.';
      notify?.error('Error', msg);
    } finally {
      setLoadingList(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) {
      notify?.error('Validasi Gagal', 'Nama mitra atau bengkel wajib diisi.');
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
        throw new Error(data.message || 'Gagal menerbitkan token undangan VIP.');
      }

      setNewInvite(data);
      notify?.success('Token VIP Diterbitkan', `Undangan untuk ${data.partnerName} siap dibagikan.`);

      setPartnerName('');
      setPartnerPhone('');
      fetchInvites();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server.';
      notify?.error('Gagal', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (inviteId: string, pName: string) => {
    if (!confirm(`Batalkan token VIP untuk "${pName}"? Token tidak akan dapat diklaim lagi.`)) {
      return;
    }

    setRevokingId(inviteId);
    try {
      const res = await fetch(`/api/admin/reseller-invites/${inviteId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal membatalkan token.');
      }

      notify?.success('Token Dibatalkan', `Token untuk ${pName} telah dinonaktifkan.`);
      fetchInvites();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membatalkan token.';
      notify?.error('Error', msg);
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify?.success('Disalin ke Clipboard', 'Tautan VIP berhasil disalin.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify?.error('Gagal Menyalin', 'Silakan salin teks secara manual.');
    }
  };

  const getWhatsAppShareUrl = (item: {
    partnerName?: string;
    partner_name?: string;
    partnerPhone?: string | null;
    partner_phone?: string | null;
    inviteUrl?: string;
    invite_url?: string;
  }) => {
    const pName = item.partnerName || item.partner_name || 'Mitra';
    const pUrl = item.inviteUrl || item.invite_url || '';
    const phone = item.partnerPhone || item.partner_phone || '';

    const message = `Halo *${pName}*,\n\nAnda menerima *Undangan Kemitraan Resmi ARM Exhaust* (Akses Kemitraan B2B & Harga Grosir Khusus Bengkel).\n\nSilakan verifikasi akun Anda melalui tautan resmi berikut:\n${pUrl}\n\n_Catatan: Tautan ini bersifat privat dan hanya berlaku 1x verifikasi._`;

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let target = cleanPhone;
    if (target.startsWith('0')) {
      target = '62' + target.slice(1);
    }

    if (target) {
      return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const getStatusBadge = (status: VipInviteItem['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-md border border-zinc-900 bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">
            Aktif
          </span>
        );
      case 'claimed':
        return (
          <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
            Terklaim
          </span>
        );
      case 'revoked':
        return (
          <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            Dibatalkan
          </span>
        );
      case 'expired':
      default:
        return (
          <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-400">
            Kedaluwarsa
          </span>
        );
    }
  };

  const activeCount = invites.filter((i) => i.status === 'active').length;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Generator Control Box */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold tracking-tight text-zinc-950">
              Penerbitan Undangan Kemitraan VIP
            </h2>
            <p className="text-xs text-zinc-500">
              Buat token onboarding berbatas waktu untuk calon bengkel rekanan (Reseller 20%) atau distributor regional (35%).
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500">
            <span>Aktif: <strong className="text-zinc-950 tabular-nums font-bold">{activeCount}</strong></span>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Partner Name */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Nama Mitra / Bengkel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Contoh: Speed Motorsport"
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
            />
          </div>

          {/* WhatsApp Phone */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              value={partnerPhone}
              onChange={(e) => setPartnerPhone(e.target.value)}
              placeholder="08123456789"
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-950 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
            />
          </div>

          {/* Role Target */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Tingkat Margin
            </label>
            <select
              value={roleToGrant}
              onChange={(e) => setRoleToGrant(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-950 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
            >
              <option value="reseller">Reseller (20%)</option>
              <option value="distributor">Distributor (35%)</option>
            </select>
          </div>

          {/* Expiration Segment */}
          <div className="lg:col-span-3 flex flex-col justify-end">
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Masa Berlaku
            </label>
            <div className="grid grid-cols-4 gap-1">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setExpiresInHours(opt.hours)}
                  className={`rounded-md border py-1.5 text-xs transition text-center ${
                    expiresInHours === opt.hours
                      ? 'border-zinc-900 bg-zinc-100 text-zinc-950 font-semibold'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2 lg:col-span-12 mt-1 flex justify-end">
            <button
              type="submit"
              disabled={!partnerName.trim() || isSubmitting}
              className="w-full sm:w-auto rounded-md bg-[#141416] hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Menerbitkan Token…</span>
                </>
              ) : (
                <span>Terbitkan Token VIP</span>
              )}
            </button>
          </div>
        </form>

        {/* Success Snippet Card */}
        {newInvite && (
          <div className="mt-4 rounded-lg border border-zinc-300 bg-zinc-50 p-3 text-xs transition-all animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <span className="font-semibold text-zinc-950">
                Token VIP Siap: <strong className="text-zinc-950 font-bold">{newInvite.partnerName}</strong> ({newInvite.roleToGrant.toUpperCase()})
              </span>
              <button
                type="button"
                onClick={() => setNewInvite(null)}
                className="text-xs text-zinc-500 hover:text-zinc-950"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="mt-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={newInvite.inviteUrl}
                className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-mono text-xs text-zinc-950 select-all focus:outline-none"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(newInvite.inviteUrl)}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 transition"
                >
                  {copied ? 'Disalin' : 'Salin'}
                </button>
                <a
                  href={getWhatsAppShareUrl(newInvite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 transition"
                >
                  Kirim WA
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Token Registry / Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-950">
            Buku Registri Token Kemitraan
          </span>
          <button
            type="button"
            onClick={fetchInvites}
            disabled={loadingList}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 transition disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingList ? 'animate-spin text-zinc-950' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Calon Mitra</th>
                <th className="px-4 py-3 font-medium">Target Peran</th>
                <th className="px-4 py-3 font-medium">Status Token</th>
                <th className="px-4 py-3 font-medium">Masa Berlaku</th>
                <th className="px-4 py-3 font-medium">Klaim Akun</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 text-zinc-950">
              {loadingList && invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-500">
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
                    <p className="mt-2 text-xs text-zinc-500">Memuat riwayat token…</p>
                  </td>
                </tr>
              ) : invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-500 text-xs">
                    Belum ada token undangan VIP yang diterbitkan.
                  </td>
                </tr>
              ) : (
                invites.map((inv) => {
                  const pName = inv.partnerName || inv.partner_name;
                  const phone = inv.partnerPhone || inv.partner_phone;
                  const expDate = new Date(inv.expiresAt || inv.expires_at);
                  const isRevoking = revokingId === inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-zinc-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-950">{pName}</div>
                        {phone && (
                          <div className="font-mono text-xs text-zinc-500">{phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-mono font-bold border border-zinc-200 bg-zinc-100 text-zinc-900">
                          {(inv.roleToGrant || inv.role_to_grant).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap tabular-nums">
                        {expDate.toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {inv.claimed_by_email ? (
                          <div className="text-zinc-950">{inv.claimed_by_email}</div>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status === 'active' && (
                            <>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(inv.inviteUrl)}
                                className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-950 hover:bg-white transition"
                              >
                                Salin
                              </button>
                              <a
                                href={getWhatsAppShareUrl(inv)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-950 hover:bg-zinc-100 transition"
                              >
                                WA
                              </a>
                              <button
                                type="button"
                                disabled={isRevoking}
                                onClick={() => handleRevoke(inv.id, pName)}
                                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-40"
                              >
                                {isRevoking ? '…' : 'Batal'}
                              </button>
                            </>
                          )}
                          {inv.status !== 'active' && (
                            <span className="text-zinc-300 text-xs">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
