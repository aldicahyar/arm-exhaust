'use client';

import React from 'react';
import { Users, Store, Building2, Ticket } from 'lucide-react';
import type { CrmMetrics } from '../types';

interface CrmMetricsRibbonProps {
  metrics: CrmMetrics;
  loading?: boolean;
}

/**
 * CrmMetricsRibbon
 * Modern Modular Cards (shadcn App-1 & Dribbble 25741427 Pattern):
 * - 4 individual elevated cards with ample spacing
 * - Subtle icon in header right
 * - High-clarity typography with tabular lining figures
 */
export function CrmMetricsRibbon({ metrics, loading = false }: CrmMetricsRibbonProps) {
  const resellerRatio =
    metrics.totalUsers > 0
      ? ((metrics.resellerCount / metrics.totalUsers) * 100).toFixed(0)
      : '0';

  const stats = [
    {
      id: 'total-users',
      label: 'Total Direktori Mitra',
      value: metrics.totalUsers,
      subtext: 'Basis akun aktif',
      icon: Users,
    },
    {
      id: 'reseller-count',
      label: 'Reseller Bengkel',
      value: metrics.resellerCount,
      subtext: `${resellerRatio}% porsi (Margin 20%)`,
      icon: Store,
    },
    {
      id: 'distributor-count',
      label: 'Distributor Regional',
      value: metrics.distributorCount,
      subtext: 'Grosir Tier 1 (Margin 35%)',
      icon: Building2,
    },
    {
      id: 'pending-invites',
      label: 'Undangan VIP Aktif',
      value: metrics.pendingInvites,
      subtext: 'Token siap klaim',
      icon: Ticket,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className="rounded-xl border border-[#eedec5] bg-white p-5 shadow-xs transition hover:border-[#f8a712]/60 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#786b53]">{stat.label}</span>
              <Icon className="h-4 w-4 text-[#f8a712]" />
            </div>

            <div className="mt-4">
              <p className="text-2xl font-bold tracking-tight text-[#1e1501] tabular-nums">
                {loading ? (
                  <span className="inline-block h-7 w-14 rounded-md bg-[#fbf5ea] animate-pulse" />
                ) : (
                  stat.value.toLocaleString('id-ID')
                )}
              </p>
              <p className="mt-1 text-xs text-[#786b53]/80">{stat.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
