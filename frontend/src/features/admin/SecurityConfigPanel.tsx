'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';

interface ConfigItem {
  key: string;
  value: number;
  label: string;
  min: number;
  max: number;
  default: number;
}

interface ApiResponse {
  config?: Record<string, number>;
  items?: ConfigItem[];
  error?: string;
}

const PARAM_META: Record<
  string,
  { shortName: string; unit: string; description: string }
> = {
  'otp.ttl_minutes': {
    shortName: 'Masa Berlaku Kode OTP',
    unit: 'Menit',
    description: 'Batas waktu kode OTP aktif sejak dikirim sebelum otomatis kedaluwarsa.',
  },
  'otp.max_attempts': {
    shortName: 'Maksimum Percobaan Salah',
    unit: 'Percobaan',
    description: 'Toleransi kesalahan kode OTP sebelum sesi otentikasi dikunci otomatis.',
  },
  'otp.lock_minutes': {
    shortName: 'Durasi Penguncian Akun',
    unit: 'Menit',
    description: 'Waktu tunggu wajib bagi nomor/email yang melampaui batas percobaan.',
  },
  'ratelimit.max_requests': {
    shortName: 'Batas Request per IP',
    unit: 'Req',
    description: 'Volume permintaan API tertinggi yang diizinkan dalam satu jendela observasi.',
  },
  'ratelimit.window_minutes': {
    shortName: 'Jendela Observasi IP',
    unit: 'Menit',
    description: 'Interval waktu hitung akumulasi request sebelum counter di-reset.',
  },
  'ratelimit.block_minutes': {
    shortName: 'Blokir Pelanggaran Awal',
    unit: 'Menit',
    description: 'Durasi pemblokiran sementara untuk IP yang melampaui batas request pertama kali.',
  },
  'ratelimit.repeat_window_minutes': {
    shortName: 'Jendela Deteksi Berulang',
    unit: 'Menit',
    description: 'Rentang waktu penelusuran riwayat pelanggaran beruntun dari IP yang sama.',
  },
  'ratelimit.repeat_block_minutes': {
    shortName: 'Blokir Pelanggaran Berulang',
    unit: 'Menit',
    description: 'Masa karantina panjang bagi IP yang terdeteksi melakukan brute force berkelanjutan.',
  },
};

export function SecurityConfigPanel() {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [formValues, setFormValues] = useState<Record<string, number>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/config', {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Gagal memuat konfigurasi (HTTP ${res.status}).`);
      }

      const data: ApiResponse = await res.json();
      if (data.items && Array.isArray(data.items)) {
        setItems(data.items);
        const map: Record<string, number> = {};
        data.items.forEach((item) => {
          map[item.key] = item.value;
        });
        setFormValues(map);
        setOriginalValues(map);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan jaringan saat memuat konfigurasi.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleChange = (key: string, rawVal: string) => {
    const num = rawVal === '' ? NaN : Number(rawVal);
    setFormValues((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleResetToDefault = (item: ConfigItem) => {
    setFormValues((prev) => ({
      ...prev,
      [item.key]: item.default,
    }));
  };

  const handleResetAllToDefaults = () => {
    const defaults: Record<string, number> = {};
    items.forEach((item) => {
      defaults[item.key] = item.default;
    });
    setFormValues(defaults);
  };

  const handleResetAllChanges = () => {
    setFormValues({ ...originalValues });
    setStatus(null);
  };

  const validationErrors = items.reduce<Record<string, string>>((acc, item) => {
    const val = formValues[item.key];
    if (isNaN(val) || val === undefined || val === null) {
      acc[item.key] = 'Angka wajib.';
    } else if (val < item.min) {
      acc[item.key] = `Min ${item.min}`;
    } else if (val > item.max) {
      acc[item.key] = `Maks ${item.max}`;
    }
    return acc;
  }, {});

  const hasErrors = Object.keys(validationErrors).length > 0;
  const isDirty = items.some((item) => formValues[item.key] !== originalValues[item.key]);
  const dirtyCount = items.filter((item) => formValues[item.key] !== originalValues[item.key]).length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors || !isDirty || saving) return;

    setSaving(true);
    setStatus(null);

    const payload: Record<string, number> = {};
    items.forEach((item) => {
      payload[item.key] = Number(formValues[item.key]);
    });

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || `Gagal menyimpan konfigurasi (HTTP ${res.status}).`);
      }

      setOriginalValues({ ...formValues });
      setStatus({
        type: 'success',
        message: 'Konfigurasi keamanan tersimpan. Parameter aktif otomatis pada cluster (sinkronisasi ≤ 30s).',
      });
      setTimeout(() => setStatus(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan konfigurasi.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const otpItems = items.filter((item) => item.key.startsWith('otp.'));
  const rateLimitItems = items.filter((item) => item.key.startsWith('ratelimit.'));

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
        <p className="mt-3 text-xs text-zinc-500">Sinkronisasi parameter keamanan runtime…</p>
      </div>
    );
  }

  const renderParameterTable = (sectionItems: ConfigItem[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Parameter &amp; Deskripsi</th>
            <th className="px-4 py-3 font-medium">Rentang Aman</th>
            <th className="px-4 py-3 font-medium">Default</th>
            <th className="px-4 py-3 font-medium text-right">Nilai Dikonfigurasi</th>
            <th className="w-16 px-4 py-3 text-right font-medium">Reset</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200/70 text-zinc-950">
          {sectionItems.map((item) => {
            const meta = PARAM_META[item.key] || {
              shortName: item.label,
              unit: '',
              description: '',
            };
            const currentVal = formValues[item.key];
            const isChanged = currentVal !== originalValues[item.key];
            const hasErr = validationErrors[item.key];

            return (
              <tr key={item.key} className="hover:bg-zinc-50 transition">
                {/* Name & Key */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-950">{meta.shortName}</span>
                    <code className="text-xs font-mono text-zinc-500 border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 rounded">
                      {item.key}
                    </code>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed max-w-lg">
                    {meta.description}
                  </p>
                </td>

                {/* Safe Range */}
                <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap tabular-nums">
                  {item.min} – {item.max} {meta.unit}
                </td>

                {/* Default */}
                <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap tabular-nums">
                  {item.default} {meta.unit}
                </td>

                {/* Input value */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5">
                    <div className="relative w-28">
                      <input
                        type="number"
                        min={item.min}
                        max={item.max}
                        value={isNaN(currentVal) ? '' : currentVal}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        disabled={saving}
                        className={`w-full rounded-md border bg-zinc-50 px-2.5 py-1.5 text-right font-mono text-xs text-zinc-950 focus:outline-none transition tabular-nums ${
                          hasErr
                            ? 'border-red-500 focus:border-red-500'
                            : isChanged
                            ? 'border-zinc-900 bg-zinc-100 text-zinc-950 font-semibold'
                            : 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900'
                        }`}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-10 text-left">
                      {meta.unit}
                    </span>
                  </div>
                  {hasErr && (
                    <div className="text-[11px] text-red-600 font-mono mt-0.5 text-right">
                      {hasErr}
                    </div>
                  )}
                </td>

                {/* Reset button */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleResetToDefault(item)}
                    disabled={saving || currentVal === item.default}
                    title="Kembalikan ke baseline default pabrik"
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 1. Header Overview & Control */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold tracking-tight text-zinc-950">
              Konfigurasi Keamanan &amp; Pertahanan OTP
            </h2>
            <p className="text-xs text-zinc-500">
              Parameter dinamis untuk mitigasi serangan brute force, pencurian token, dan perlindungan endpoint OTP ARM Exhaust.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleResetAllToDefaults}
              disabled={saving}
              className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition"
            >
              Reset ke Default
            </button>
            <button
              type="button"
              onClick={fetchConfig}
              className="rounded-md border border-zinc-200 bg-zinc-50 p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition"
              title="Muat ulang dari server"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Status Toast / Inline Alert */}
        {status && (
          <div
            className={`mt-3.5 rounded-md border px-3 py-2 text-xs flex items-center gap-2 ${
              status.type === 'success'
                ? 'border-zinc-900 bg-zinc-900 text-white font-medium'
                : 'border-red-200 bg-red-50 text-red-700 font-medium'
            }`}
          >
            <span>{status.message}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* 2. Group 1: OTP Parameters */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
          <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
            <h3 className="text-xs font-semibold text-zinc-950">
              1. Parameter Kebijakan Kode OTP
            </h3>
          </div>
          {renderParameterTable(otpItems)}
        </div>

        {/* 3. Group 2: Rate Limiting & Anti-Brute Force */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
          <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
            <h3 className="text-xs font-semibold text-zinc-950">
              2. Parameter Batas Akses IP (Rate Limiter)
            </h3>
          </div>
          {renderParameterTable(rateLimitItems)}
        </div>

        {/* 4. Floating Action Bar for Unsaved Changes */}
        {isDirty && (
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/95 px-5 py-3 text-xs shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <span className="text-zinc-950">
                <strong className="text-zinc-950 tabular-nums font-mono font-bold">{dirtyCount}</strong> parameter dimodifikasi.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetAllChanges}
                disabled={saving}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || hasErrors}
                className="rounded-md bg-[#141416] hover:bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40 shadow-xs"
              >
                {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
