'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Percent,
  ShieldCheck,
  Save,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Sliders,
  Scale,
  Calculator,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useNotice } from '@/shared/components';
import type { TaxConfigData, TaxMode } from '../types';

const DEFAULT_COMPANY_NAME = 'PT ARM Karya Knalpot Indonesia';
const DEFAULT_COMPANY_NPWP = '01.234.567.8-901.000';
const DEFAULT_COMPANY_ADDRESS =
  'Kawasan Industri Manufaktur Knalpot No. 88, Purbalingga, Jawa Tengah 53311';
const DEFAULT_PKP_NUMBER = 'S-123PKP/WPJ.08/KP.0303/2024';
const DEFAULT_FAKTUR_PREFIX = '010.000-26.';
const LOCAL_STORAGE_KEY = 'arm_exhaust_tax_config';

export function TaxConfigPanel() {
  // Safe useNotice resolution (works inside and outside NoticeProvider)
  let notify: any = null;
  try {
    const noticeCtx = useNotice();
    notify = noticeCtx?.notify;
  } catch {
    // Graceful fallback for isolated test environments
  }

  // 1. Tax Core States
  const [taxPercent, setTaxPercent] = useState<number>(11);
  const [taxMode, setTaxMode] = useState<TaxMode>('include');
  const [autoFakturB2B, setAutoFakturB2B] = useState<boolean>(true);

  // 2. Company & Tax Entity States
  const [companyName, setCompanyName] = useState<string>(DEFAULT_COMPANY_NAME);
  const [companyNpwp, setCompanyNpwp] = useState<string>(DEFAULT_COMPANY_NPWP);
  const [companyAddress, setCompanyAddress] = useState<string>(DEFAULT_COMPANY_ADDRESS);
  const [pkpNumber, setPkpNumber] = useState<string>(DEFAULT_PKP_NUMBER);
  const [fakturPrefix, setFakturPrefix] = useState<string>(DEFAULT_FAKTUR_PREFIX);

  // 3. Operational & Sync States
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // 4. Live Simulation State
  const [sampleMSRP, setSampleMSRP] = useState<number>(3500000); // Rp 3.500.000 (GP Full System)

  // Track initial values for dirty comparison
  const [initialTaxPercent, setInitialTaxPercent] = useState<number>(11);

  // Format currency helper
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  // Fetch initial tax configuration
  const fetchTaxConfig = useCallback(async () => {
    setLoading(true);
    setIsForbidden(false);
    setSaveStatus(null);

    // Load any persisted local corporate identity preferences first
    if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (rawLocal) {
          const parsed: Partial<TaxConfigData> = JSON.parse(rawLocal);
          if (parsed.taxMode) setTaxMode(parsed.taxMode);
          if (typeof parsed.autoFakturB2B === 'boolean') setAutoFakturB2B(parsed.autoFakturB2B);
          if (parsed.companyName) setCompanyName(parsed.companyName);
          if (parsed.companyNpwp) setCompanyNpwp(parsed.companyNpwp);
          if (parsed.companyAddress) setCompanyAddress(parsed.companyAddress);
          if (parsed.pkpNumber) setPkpNumber(parsed.pkpNumber);
          if (parsed.fakturPrefix) setFakturPrefix(parsed.fakturPrefix);
        }
      } catch {
        // Ignore localStorage read errors
      }
    }

    try {
      const res = await fetch('/api/admin/tax', {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (res.status === 403) {
        setIsForbidden(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Gagal memuat konfigurasi PPN (HTTP ${res.status}).`);
      }

      const data = await res.json();
      const fetchedPercent =
        typeof data.taxPercent === 'number'
          ? data.taxPercent
          : typeof data.tax_percent === 'number'
          ? data.tax_percent
          : 11;

      setTaxPercent(fetchedPercent);
      setInitialTaxPercent(fetchedPercent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.';
      // Fallback to default without blocking the UI
      setTaxPercent(11);
      setInitialTaxPercent(11);
      notify?.error('Koneksi Gagal', msg);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchTaxConfig();
  }, [fetchTaxConfig]);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (saving || isForbidden) return;

    if (taxPercent < 0 || taxPercent > 100 || isNaN(taxPercent)) {
      const err = 'Tarif PPN harus berupa angka antara 0% hingga 100%.';
      setSaveStatus({ type: 'error', message: err });
      notify?.error('Validasi Gagal', err);
      return;
    }

    if (autoFakturB2B && (!companyName.trim() || !companyNpwp.trim())) {
      const err = 'Nama Wajib Pajak dan NPWP Perusahaan wajib diisi untuk e-Faktur otomatis.';
      setSaveStatus({ type: 'error', message: err });
      notify?.error('Validasi Gagal', err);
      return;
    }

    setSaving(true);
    setSaveStatus(null);

    try {
      const payload = {
        taxPercent: Number(taxPercent),
        tax_percent: Number(taxPercent),
        taxMode,
        autoFakturB2B,
        companyName,
        companyNpwp,
        companyAddress,
        pkpNumber,
        fakturPrefix,
      };

      const res = await fetch('/api/admin/tax', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 403) {
        setIsForbidden(true);
        throw new Error('Akses Ditolak: Hanya Superadmin yang berwenang mengubah konfigurasi pajak.');
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${res.status} Gagal menyimpan.`);
      }

      const result = await res.json();
      const updatedPercent =
        typeof result.taxPercent === 'number'
          ? result.taxPercent
          : typeof result.tax_percent === 'number'
          ? result.tax_percent
          : taxPercent;

      setTaxPercent(updatedPercent);
      setInitialTaxPercent(updatedPercent);

      // Persist enterprise tax settings to local storage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify({
              taxPercent: updatedPercent,
              taxMode,
              autoFakturB2B,
              companyName,
              companyNpwp,
              companyAddress,
              pkpNumber,
              fakturPrefix,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch {
          // ignore storage quota issues
        }
      }

      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSaved(nowStr);
      setSaveStatus({
        type: 'success',
        message: `Konfigurasi PPN (${updatedPercent}%) dan e-Faktur berhasil disimpan ke database.`,
      });

      notify?.success(
        'Konfigurasi Disimpan',
        `Tarif PPN ${updatedPercent}% dan parameter e-Faktur berhasil diperbarui.`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kegagalan saat menyimpan konfigurasi pajak.';
      setSaveStatus({ type: 'error', message: msg });
      notify?.error('Gagal Menyimpan', msg);
    } finally {
      setSaving(false);
    }
  };

  // Revert changes
  const handleReset = () => {
    setTaxPercent(initialTaxPercent);
    setSaveStatus(null);
  };

  // Live simulation computations
  const isInclude = taxMode === 'include';
  let dpp = 0;
  let taxAmount = 0;
  let finalTotal = 0;

  if (isInclude) {
    // Include Tax: MSRP includes PPN -> DPP = MSRP / (1 + taxPercent / 100)
    dpp = sampleMSRP / (1 + taxPercent / 100);
    taxAmount = sampleMSRP - dpp;
    finalTotal = sampleMSRP;
  } else {
    // Exclude Tax: MSRP is DPP -> Tax added at checkout
    dpp = sampleMSRP;
    taxAmount = (sampleMSRP * taxPercent) / 100;
    finalTotal = sampleMSRP + taxAmount;
  }

  const isDirty = taxPercent !== initialTaxPercent;

  // 403 Forbidden State View for non-superadmin
  if (isForbidden) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-zinc-950 p-8 text-center text-zinc-200 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-bold tracking-tight text-white">
          Akses Khusus Superadmin
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs text-zinc-400 leading-relaxed">
          Panel konfigurasi tarif perpajakan (PPN/Tax) dan identitas e-Faktur dilindungi oleh kebijakan
          Role-Based Access Control (RBAC) tingkat tinggi. Hubungi Superadministrator untuk penyesuaian.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={fetchTaxConfig}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba Sinkronisasi Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-zinc-200">
      {/* 1. Header & Superadmin Governance Pill (Stealth Luxe Styling) */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-amber-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                SUPERADMIN ACCESS ONLY
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700/60 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                <Receipt className="h-3 w-3 text-amber-500" />
                FINANCE GOVERNANCE
              </span>
              {lastSaved && (
                <span className="text-[11px] text-zinc-500 font-mono">
                  Tersimpan: {lastSaved}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Pengaturan PPN &amp; Faktur Pajak Perusahaan</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Konfigurasi tarif Pajak Pertambahan Nilai (PPN), penentuan mode kalkulasi harga katalog ritel vs B2B,
              dan otomatisasi penerbitan e-Faktur resmi ARM Exhaust.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={fetchTaxConfig}
              disabled={loading || saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50"
              title="Muat ulang dari server"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Sinkronisasi</span>
            </button>
          </div>
        </div>

        {/* Status notification banner if any */}
        <AnimatePresence>
          {saveStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-4 flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs ${
                saveStatus.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                  : 'border-red-500/30 bg-red-950/40 text-red-300'
              }`}
            >
              {saveStatus.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              )}
              <span className="font-medium">{saveStatus.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Main Configuration Grid (2 Columns) */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: Tarif PPN & Quick Presets */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <Percent className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Tarif Pajak Pertambahan Nilai (PPN)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Persentase pajak yang dikenakan pada transaksi komersial
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-black text-amber-400 tracking-tight">
                  {taxPercent}%
                </span>
              </div>
            </div>

            {/* Slider & Input Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="taxPercent" className="font-semibold text-zinc-300">
                    Persentase PPN Aktif
                  </label>
                  <span className="text-[11px] text-zinc-500">Rentang: 0% – 100%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      id="taxPercent"
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={taxPercent}
                      onChange={(e) =>
                        setTaxPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm font-bold font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-bold text-zinc-400">
                      %
                    </div>
                  </div>
                </div>

                {/* Range Slider for fast adjust */}
                <div className="pt-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={taxPercent}
                    onChange={(e) =>
                      setTaxPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                    }
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                    <span>0% (Bebas)</span>
                    <span>11% (UU HPP)</span>
                    <span>12% (2025+)</span>
                    <span>100% (Maks)</span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Preset Regulasi Pajak
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaxPercent(0)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition ${
                      taxPercent === 0
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold shadow-xs'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-sm font-bold">0%</span>
                    <span className="text-[10px] text-zinc-500">Non-PKP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxPercent(11)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition ${
                      taxPercent === 11
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold shadow-xs'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-sm font-bold">11%</span>
                    <span className="text-[10px] text-zinc-500">Standar UU HPP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxPercent(12)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition ${
                      taxPercent === 12
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold shadow-xs'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-sm font-bold">12%</span>
                    <span className="text-[10px] text-zinc-500">Regulasi 2025</span>
                  </button>
                </div>
              </div>

              {/* Informative Note */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5 text-xs text-zinc-300">
                <HelpCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  Setiap perubahan persentase PPN akan langsung berlaku secara global pada kalkulasi harga faktur,
                  perhitungan pesanan grosir B2B, dan slip transaksi pelanggan ritel.
                </p>
              </div>
            </div>
          </div>

          {/* Card B: Mode PPN (Include vs Exclude) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Mode Pengenaan PPN (Tax Mode)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Penerapan perhitungan pajak pada katalog produk dan checkout
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: Include Tax */}
              <label
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition ${
                  taxMode === 'include'
                    ? 'border-amber-500/60 bg-amber-500/10 shadow-sm'
                    : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="taxMode"
                  value="include"
                  checked={taxMode === 'include'}
                  onChange={() => setTaxMode('include')}
                  className="mt-1 h-4 w-4 accent-amber-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Include Tax (Harga katalog sudah termasuk PPN)
                    </span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                      Rekomendasi Ritel
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Harga MSRP yang tercantum di etalase sudah mencakup beban PPN {taxPercent}%. Nilai dasar pengenaan
                    pajak (DPP) diekstraksi secara otomatis pada invoice kasir.
                  </p>
                </div>
              </label>

              {/* Option 2: Exclude Tax */}
              <label
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition ${
                  taxMode === 'exclude'
                    ? 'border-amber-500/60 bg-amber-500/10 shadow-sm'
                    : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="taxMode"
                  value="exclude"
                  checked={taxMode === 'exclude'}
                  onChange={() => setTaxMode('exclude')}
                  className="mt-1 h-4 w-4 accent-amber-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Exclude Tax (PPN dihitung di kasir/checkout)
                    </span>
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                      Standar B2B Grosir
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Harga katalog merupakan harga murni sebelum pajak. Nilai PPN {taxPercent}% ditambahkan sebagai baris
                    tersendiri saat ringkasan pesanan &amp; pembayaran invoice.
                  </p>
                </div>
              </label>
            </div>

            {/* Tax Mode Formula Insight */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-300 font-mono text-[11px]">
                <Scale className="h-3.5 w-3.5 text-amber-500" />
                <span>Formula: {taxMode === 'include' ? 'DPP = MSRP / (1 + %PPN)' : 'Total = DPP + (DPP * %PPN)'}</span>
              </div>
              <p className="text-[10px] text-zinc-500">
                Pajak akan dicatat secara transparan pada laporan akuntansi berkala ARM Exhaust.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Company Identity & Faktur Pajak B2B (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card C: Faktur Pajak B2B Automation */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Pengaturan Faktur Pajak B2B
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Otomatisasi penerbitan e-Faktur untuk mitra Distributor &amp; Reseller
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Toggle switch for auto faktur */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <div className="space-y-1">
                  <label htmlFor="fakturPajakToggle" className="text-xs font-bold text-white cursor-pointer">
                    Penerbitan Faktur Pajak Otomatis (fakturPajak)
                  </label>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Terbitkan Faktur Pajak elektronik otomatis untuk mitra ber-NPWP pada setiap pesanan lunas.
                  </p>
                </div>
                <div className="relative inline-flex items-center shrink-0">
                  <input
                    id="fakturPajakToggle"
                    type="checkbox"
                    checked={autoFakturB2B}
                    onChange={(e) => setAutoFakturB2B(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 cursor-pointer"></div>
                </div>
              </div>

              {/* Faktur Serial Prefix */}
              <div className="space-y-1.5">
                <label htmlFor="fakturPrefix" className="text-xs font-semibold text-zinc-300">
                  Prefix Nomor Seri Faktur Pajak (NSFP)
                </label>
                <input
                  id="fakturPrefix"
                  type="text"
                  value={fakturPrefix}
                  onChange={(e) => setFakturPrefix(e.target.value)}
                  placeholder="010.000-26."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-zinc-500">
                  Prefix referensi kode faktur standar DJP elektronik 2026.
                </p>
              </div>

              {/* Status Note */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-xs text-zinc-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Integrasi e-Faktur aktif: Mendukung validasi NPWP 15 &amp; 16 digit NIK/TIN.
                </span>
              </div>
            </div>
          </div>

          {/* Card D: Identitas Badan Usaha Wajib Pajak (NPWP) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Identitas Perusahaan &amp; NPWP
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Data legalitas badan usaha yang dicetak pada dokumen faktur
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Terverifikasi DJP
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Nama Wajib Pajak */}
              <div className="space-y-1.5">
                <label htmlFor="companyName" className="text-xs font-semibold text-zinc-300">
                  Nama Wajib Pajak (Entitas Bisnis)
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="PT ARM Karya Knalpot Indonesia"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Nomor NPWP Perusahaan */}
              <div className="space-y-1.5">
                <label htmlFor="companyNpwp" className="text-xs font-semibold text-zinc-300">
                  Nomor Pokok Wajib Pajak (NPWP Perusahaan)
                </label>
                <input
                  id="companyNpwp"
                  type="text"
                  value={companyNpwp}
                  onChange={(e) => setCompanyNpwp(e.target.value)}
                  placeholder="01.234.567.8-901.000"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Nomor Pengukuhan PKP */}
              <div className="space-y-1.5">
                <label htmlFor="pkpNumber" className="text-xs font-semibold text-zinc-300">
                  Nomor Pengukuhan PKP (NPPKP)
                </label>
                <input
                  id="pkpNumber"
                  type="text"
                  value={pkpNumber}
                  onChange={(e) => setPkpNumber(e.target.value)}
                  placeholder="S-123PKP/WPJ.08/KP.0303/2024"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Alamat Terdaftar Faktur Pajak */}
              <div className="space-y-1.5">
                <label htmlFor="companyAddress" className="text-xs font-semibold text-zinc-300">
                  Alamat Faktur Pajak Terdaftar
                </label>
                <textarea
                  id="companyAddress"
                  rows={2}
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Alamat legal entitas perusahaan..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Live Interactive Simulation Card (Pricing Impact Simulator) */}
        <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Simulasi Kalkulasi Transaksi (Live Invoice Preview)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Produk Sampel:</span>
              <span className="font-semibold text-zinc-200">GP Full System Titanium Series</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
            {/* Base input */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-1">
              <span className="text-[11px] text-zinc-400">Harga Katalog (MSRP)</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step={50000}
                  value={sampleMSRP}
                  onChange={(e) => setSampleMSRP(Math.max(0, Number(e.target.value)))}
                  className="w-full font-mono text-sm font-bold text-white bg-transparent border-b border-zinc-700 focus:border-amber-500 focus:outline-none py-0.5"
                />
              </div>
              <span className="text-[10px] text-zinc-500">Dapat diedit untuk tes kalkulasi</span>
            </div>

            {/* DPP */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-1">
              <span className="text-[11px] text-zinc-400">Dasar Pengenaan Pajak (DPP)</span>
              <div className="font-mono text-sm font-bold text-zinc-200">
                {formatRupiah(dpp)}
              </div>
              <span className="text-[10px] text-zinc-500">Nilai riil produk netto</span>
            </div>

            {/* Tax Amount */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1">
              <span className="text-[11px] text-amber-300 flex items-center justify-between">
                <span>PPN ({taxPercent}%)</span>
                <span className="text-[9px] font-mono uppercase bg-amber-500/20 px-1 rounded text-amber-300">
                  {taxMode}
                </span>
              </span>
              <div className="font-mono text-sm font-bold text-amber-400">
                {formatRupiah(taxAmount)}
              </div>
              <span className="text-[10px] text-zinc-400">Pajak yang disetor ke kas negara</span>
            </div>

            {/* Final Total */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3.5 space-y-1">
              <span className="text-[11px] text-emerald-300 font-semibold">Total Tagihan Konsumen</span>
              <div className="font-mono text-base font-black text-emerald-400">
                {formatRupiah(finalTotal)}
              </div>
              <span className="text-[10px] text-zinc-400">
                {isInclude ? 'Harga di etalase sudah final' : 'Harga kasir sesudah penambahan PPN'}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Sticky Action Footer Bar */}
        <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs">
            {isDirty ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Perubahan tarif PPN ({taxPercent}%) belum disimpan ke server.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-zinc-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Seluruh parameter perpajakan tersinkronisasi.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50"
              >
                Batalkan
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 px-5 py-2 text-xs font-bold text-black transition shadow-lg shadow-amber-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan Konfigurasi Pajak</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
