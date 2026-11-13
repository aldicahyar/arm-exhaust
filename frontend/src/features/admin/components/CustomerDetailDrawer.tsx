'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, X } from 'lucide-react';
import type { AdminUser, MasterRole } from '../types';

interface CustomerDetailDrawerProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onRoleUpdated: (userId: string, newRole: string) => Promise<void>;
  roles?: MasterRole[];
}

export function CustomerDetailDrawer({
  user,
  isOpen,
  onClose,
  onRoleUpdated,
  roles = [],
}: CustomerDetailDrawerProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      setWhatsappPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const roleDetails = user.roleDetails || user.role_details;

  const getCleanName = (rawName?: string, email?: string) => {
    const raw = rawName || email || 'Mitra';
    try {
      return decodeURIComponent(raw).replace(/\+/g, ' ');
    } catch {
      return raw;
    }
  };

  const cleanName = getCleanName(user.name, user.email);

  const getInitials = (name: string, email: string) => {
    const clean = getCleanName(name, email).trim();
    if (!clean) return '??';
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  const handleSaveRole = async () => {
    if (!user || selectedRole === user.role || isUpdating) return;
    setIsUpdating(true);
    try {
      await onRoleUpdated(user.id, selectedRole);
    } finally {
      setIsUpdating(false);
    }
  };

  const cleanPhone = whatsappPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
  const waShareUrl = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
        `Halo ${cleanName},\nSaya dari Admin ARM Exhaust Performance. Ada yang bisa kami bantu terkait akun kemitraan Anda?`
      )}`
    : `https://wa.me/?text=${encodeURIComponent(
        `Halo ${cleanName},\nSaya dari Admin ARM Exhaust Performance.`
      )}`;

  const roleList: MasterRole[] =
    roles.length > 0
      ? roles
      : [
          {
            id: 'customer',
            name: 'Customer Ritel',
            description: 'Pembeli ritel umum (0% diskon katalog)',
            discount_percent: 0,
            can_access_admin: false,
            can_access_b2b: false,
          },
          {
            id: 'reseller',
            name: 'Reseller Bengkel Resmi',
            description: 'Bengkel rekanan VIP (diskon grosir 20%)',
            discount_percent: 20,
            can_access_admin: false,
            can_access_b2b: true,
          },
          {
            id: 'distributor',
            name: 'Distributor Regional',
            description: 'Distributor tier 1 regional (diskon 35%)',
            discount_percent: 35,
            can_access_admin: false,
            can_access_b2b: true,
          },
          {
            id: 'admin',
            name: 'Administrator Sistem',
            description: 'Akses penuh operasional & inventori',
            discount_percent: 0,
            can_access_admin: true,
            can_access_b2b: true,
          },
        ];

  const getEffectiveDiscount = (roleId: string) => {
    if (roleId === 'distributor') return 35;
    if (roleId === 'reseller') return 20;
    return 0;
  };

  const currentDiscount =
    roleDetails?.discount_percent ?? getEffectiveDiscount(user.role);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Sheet (Clean Inspector Drawer) */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200 bg-[#FAFAFA] p-5 sm:p-6 overflow-y-auto animate-in slide-in-from-right duration-200 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <h2 className="text-sm font-bold text-zinc-950">
            Detail Informasi Mitra
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition"
            title="Tutup (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Customer Identity Banner */}
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-950">
              {getInitials(user.name, user.email)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="truncate text-sm font-bold text-zinc-950">{cleanName}</h3>
              <div className="truncate text-xs text-zinc-500 mt-0.5">{user.email}</div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
            <span>UUID Akun:</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="flex items-center gap-1.5 text-zinc-950 hover:text-zinc-600 transition font-mono font-medium"
              title="Salin ID Lengkap"
            >
              <span>#{user.id.slice(0, 12)}…</span>
              {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Current Commercial Status Strip */}
        <div className="mt-3.5 rounded-lg border border-zinc-200 bg-white p-3.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              Margin Katalog Aktif
            </span>
            <span className="font-bold text-zinc-950 tabular-nums">
              {currentDiscount}% Margin
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-200">
            <span className="text-zinc-500">Akses Grosir B2B:</span>
            <span className={currentDiscount > 0 ? 'text-zinc-950 font-bold' : 'text-zinc-400'}>
              {currentDiscount > 0 ? 'Diotorisasi' : 'Akses Ritel Reguler'}
            </span>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="mt-3.5 rounded-lg border border-zinc-200 bg-white p-4 shadow-xs">
          <label className="block text-xs font-semibold text-zinc-600 mb-2.5">
            Pilih Hak Akses &amp; Peran Akun
          </label>
          <div className="space-y-1.5">
            {roleList.map((r) => {
              const isSelected = selectedRole === r.id;
              const isCurrent = user.role === r.id;
              const disc = Number(r.discount_percent ?? getEffectiveDiscount(r.id));

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`w-full text-left p-3 rounded-md border transition ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-100 text-zinc-950 font-semibold shadow-xs'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-white hover:text-zinc-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{r.name}</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      {disc > 0 && (
                        <span className="text-zinc-950 font-bold">{disc}% Diskon</span>
                      )}
                      {isCurrent && (
                        <span className="text-zinc-400 text-[11px]">(Aktif)</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500 truncate">{r.description}</p>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={selectedRole === user.role || isUpdating}
            onClick={handleSaveRole}
            className="mt-3.5 w-full rounded-md bg-[#141416] hover:bg-zinc-800 text-white font-semibold py-2 px-3 text-xs transition disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-xs"
          >
            {isUpdating ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Menyimpan Perubahan…</span>
              </>
            ) : (
              <span>Simpan Perubahan Peran</span>
            )}
          </button>
        </div>

        {/* WhatsApp Communication */}
        <div className="mt-3.5 rounded-lg border border-zinc-200 bg-white p-4 shadow-xs">
          <label className="block text-xs font-semibold text-zinc-600 mb-2">
            Nomor Kontak WhatsApp
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="08123456789"
              className="flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-950 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none"
            />
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 transition shrink-0 shadow-xs"
            >
              <span>Hubungi WA</span>
            </a>
          </div>
        </div>

        {/* Account Metadata */}
        <div className="mt-3.5 rounded-lg border border-zinc-200 bg-white p-4 text-xs space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-zinc-600 block pb-1 border-b border-zinc-200">
            Riwayat Akun
          </span>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Tanggal Terdaftar:</span>
            <span className="text-zinc-950 font-medium">
              {new Date(user.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Metode Verifikasi:</span>
            <span className="text-zinc-950 font-medium">OTP Email / OAuth</span>
          </div>
        </div>
      </div>
    </>
  );
}
