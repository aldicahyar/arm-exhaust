'use client';

import React from 'react';
import { Search, Download, RotateCw, X } from 'lucide-react';

interface CrmToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenInviteModal: () => void;
  onExportCsv?: () => void;
  totalCount?: number;
}

/**
 * CrmToolbar
 * Linear-style high-utility toolbar:
 * - Direct, desaturated segmented pills
 * - Clean monospace search input with clear trigger
 * - Integrated export & refresh actions
 */
export function CrmToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  onRefresh,
  isRefreshing = false,
  onExportCsv,
  totalCount = 0,
}: CrmToolbarProps) {
  const filterTabs = [
    { id: 'all', label: 'Semua Mitra', count: totalCount > 0 ? totalCount : undefined },
    { id: 'reseller', label: 'Reseller' },
    { id: 'distributor', label: 'Distributor' },
    { id: 'customer', label: 'Ritel' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 rounded-xl border border-[#eedec5] bg-white p-3 sm:p-3.5 shadow-xs">
      {/* 1. Left: Segmented Filter Tabs */}
      <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#fffbf5] p-1.5 border border-[#eedec5] shrink-0 overflow-x-auto scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = roleFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onRoleFilterChange(tab.id)}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#f8a712] text-[#1e1501] font-bold shadow-xs'
                  : 'text-[#786b53] hover:text-[#1e1501] hover:bg-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums font-mono font-bold ${
                    isActive ? 'bg-[#1e1501]/15 text-[#1e1501]' : 'bg-[#fbf5ea] text-[#786b53]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Right: Search & Table Operations */}
      <div className="flex items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 sm:w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#786b53]/60">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama, email, WhatsApp..."
            className="w-full rounded-lg border border-[#eedec5] bg-[#fffbf5] py-2 pl-9 pr-8 text-xs text-[#1e1501] placeholder-[#786b53]/60 focus:border-[#f8a712] focus:outline-none transition font-sans"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#786b53] hover:text-[#1e1501]"
              title="Reset pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Refresh Table */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#eedec5] bg-white text-[#786b53] hover:text-[#1e1501] hover:bg-[#fbf5ea] transition disabled:opacity-40 shrink-0 shadow-xs"
          title="Segarkan data direktori"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#f8a712]' : ''}`} />
        </button>

        {/* Export CSV */}
        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-[#eedec5] bg-white px-3.5 py-2 text-xs font-semibold text-[#786b53] hover:bg-[#fbf5ea] hover:text-[#1e1501] transition shrink-0 shadow-xs"
            title="Ekspor baris tabel ke format CSV"
          >
            <Download className="h-3.5 w-3.5 text-[#786b53]" />
            <span className="hidden md:inline">Ekspor CSV</span>
          </button>
        )}
      </div>
    </div>
  );
}
