'use client';

import React, { useState } from 'react';

interface TierPolicy {
  id: string;
  role: string;
  name: string;
  tier: string;
  discountPercent: number;
  description: string;
  minOrder: string;
  badgeStyle: string;
  leadTime: string;
  allocationPriority: string;
  paymentTerm: string;
}

export function DiscountPoliciesPanel() {
  const [basePrice, setBasePrice] = useState<number>(3500000); // Rp 3.500.000 (Exhaust GP Full System)

  const policies: TierPolicy[] = [
    {
      id: 'distributor',
      role: 'distributor',
      name: 'Distributor Regional',
      tier: 'Tier 1 B2B',
      discountPercent: 35,
      description: 'Mitra distribusi grosir skala provinsi dengan komitmen kuota bulanan.',
      minOrder: '10 Unit / Order',
      badgeStyle: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300',
      leadTime: 'Prioritas Pabrik (1-2 hari)',
      allocationPriority: 'Tingkat 1 (Paling Tinggi)',
      paymentTerm: 'Termin B2B / Invoice 14 Hari',
    },
    {
      id: 'reseller',
      role: 'reseller',
      name: 'Reseller Bengkel Resmi',
      tier: 'Tier 2 B2B',
      discountPercent: 20,
      description: 'Bengkel rekanan, modifikator, dan toko variasi rekanan ARM Exhaust.',
      minOrder: '2 Unit / Order',
      badgeStyle: 'border-amber-500/30 bg-amber-950/40 text-amber-300',
      leadTime: 'Reguler Pabrik (2-4 hari)',
      allocationPriority: 'Tingkat 2 (Reguler)',
      paymentTerm: 'Transfer Langsung / QRIS B2B',
    },
    {
      id: 'customer',
      role: 'customer',
      name: 'Customer Ritel Publik',
      tier: 'Publik MSRP',
      discountPercent: 0,
      description: 'Pembeli retail akhir dan pemilik sepeda motor perorangan.',
      minOrder: '1 Unit (Tanpa Min.)',
      badgeStyle: 'border-white/[0.08] bg-white/[0.02] text-zinc-400',
      leadTime: 'Pengiriman Kurir Standar',
      allocationPriority: 'Tingkat 3 (Stok Toko)',
      paymentTerm: 'Instant Payment Gateway',
    },
  ];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Overview & Live MSRP Controller */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold tracking-tight text-zinc-950">
              Matriks Kebijakan Margin &amp; Komersial Kemitraan
            </h2>
            <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
              Aturan harga dihitung secara deterministik oleh backend database berdasarkan peran terverifikasi akun mitra.
              Melindungi margin keuntungan bengkel rekanan dan mencegah perang harga eceran.
            </p>
          </div>

          {/* Quick Benchmark */}
          <div className="flex items-center gap-3 self-start lg:self-auto rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs shadow-xs">
            <div className="text-right px-2">
              <div className="text-[11px] text-zinc-500">Distributor</div>
              <div className="text-sm font-bold text-zinc-950 tabular-nums">35% Margin</div>
            </div>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="px-2">
              <div className="text-[11px] text-zinc-500">Reseller</div>
              <div className="text-sm font-bold text-zinc-700 tabular-nums">20% Margin</div>
            </div>
          </div>
        </div>

        {/* Real-time MSRP Simulator Bar */}
        <div className="mt-4 pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <label htmlFor="base-price-input" className="text-xs text-zinc-600 font-semibold">
            Simulasi Harga Acuan Katalog (MSRP):
          </label>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-44">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 font-mono text-xs text-zinc-400">
                Rp
              </span>
              <input
                id="base-price-input"
                type="number"
                step="50000"
                min="100000"
                value={basePrice}
                onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-1.5 pl-8 pr-2 font-mono text-xs text-zinc-950 focus:border-zinc-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {[1800000, 2500000, 3500000, 4800000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBasePrice(preset)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold border transition ${
                    basePrice === preset
                      ? 'border-zinc-900 bg-zinc-100 text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
                  }`}
                >
                  {(preset / 1000000).toFixed(1)}Jt
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Structured Commercial Matrix Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xs">
        <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-950">
            Komparasi Struktur Margin Kemitraan
          </span>
          <span className="text-xs text-zinc-500">
            Katalog Acuan: <strong className="text-zinc-950 font-bold tabular-nums">{formatRupiah(basePrice)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Tingkat Mitra</th>
                <th className="px-4 py-3 font-medium">Margin Diskon</th>
                <th className="px-4 py-3 font-medium">Harga Bersih Mitra</th>
                <th className="px-4 py-3 font-medium">Laba Mitra / Unit</th>
                <th className="px-4 py-3 font-medium">Syarat Order (MOQ)</th>
                <th className="px-4 py-3 font-medium">Alokasi Pabrik</th>
                <th className="px-4 py-3 font-medium">Ketentuan Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 text-zinc-950">
              {policies.map((p) => {
                const discountAmt = (basePrice * p.discountPercent) / 100;
                const netPrice = basePrice - discountAmt;

                return (
                  <tr key={p.id} className="hover:bg-zinc-50 transition">
                    {/* Role & Name */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-zinc-950">{p.name}</div>
                      <div className="mt-0.5 text-xs text-zinc-500">{p.description}</div>
                    </td>

                    {/* Discount Margin */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${
                        p.discountPercent === 35
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : p.discountPercent === 20
                          ? 'border-zinc-300 bg-zinc-100 text-zinc-900'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                      }`}>
                        {p.discountPercent}% OFF
                      </span>
                    </td>

                    {/* Net Price */}
                    <td className="px-4 py-3 font-mono text-xs font-bold text-zinc-950 whitespace-nowrap tabular-nums">
                      {formatRupiah(netPrice)}
                    </td>

                    {/* Partner Profit / Savings */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.discountPercent > 0 ? (
                        <div className="font-mono text-xs text-zinc-950 font-bold tabular-nums">
                          + {formatRupiah(discountAmt)}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>

                    {/* MOQ */}
                    <td className="px-4 py-3 text-xs text-zinc-950 whitespace-nowrap">
                      {p.minOrder}
                    </td>

                    {/* Lead time & Allocation */}
                    <td className="px-4 py-3 text-xs text-zinc-950 whitespace-nowrap">
                      {p.leadTime}
                    </td>

                    {/* Payment Term */}
                    <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                      {p.paymentTerm}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Visual Margin Allocation Breakdown */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs">
        <h3 className="text-xs font-bold text-zinc-950">
          Distribusi Nilai Transaksi per Unit ({formatRupiah(basePrice)})
        </h3>

        <div className="mt-3.5 space-y-3 text-xs">
          {/* Distributor Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-600">Distributor Regional (35% Laba Mitra / 65% Pabrik)</span>
              <span className="text-zinc-950 font-bold tabular-nums font-mono">{formatRupiah((basePrice * 35) / 100)} Net Margin</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden flex border border-zinc-200">
              <div className="bg-zinc-950 h-full" style={{ width: '35%' }} />
              <div className="bg-zinc-200 h-full" style={{ width: '65%' }} />
            </div>
          </div>

          {/* Reseller Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-600">Reseller Bengkel (20% Laba Bengkel / 80% Pabrik)</span>
              <span className="text-zinc-700 font-bold tabular-nums font-mono">{formatRupiah((basePrice * 20) / 100)} Net Margin</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden flex border border-zinc-200">
              <div className="bg-zinc-600 h-full" style={{ width: '20%' }} />
              <div className="bg-zinc-200 h-full" style={{ width: '80%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
