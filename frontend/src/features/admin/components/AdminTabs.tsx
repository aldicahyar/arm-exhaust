'use client';

import React, { useState } from 'react';
import { SecurityConfigPanel } from '../SecurityConfigPanel';
import { UserManagementTable } from './UserManagementTable';
import { VipInviteGenerator } from './VipInviteGenerator';

export type AdminTabId = 'users' | 'invites' | 'security';

interface TabItem {
  id: AdminTabId;
  label: string;
  badge?: string;
  icon: (active: boolean) => React.ReactNode;
}

export function AdminTabs() {
  const [activeTab, setActiveTab] = useState<AdminTabId>('users');

  const tabs: TabItem[] = [
    {
      id: 'users',
      label: 'CRM & Pengguna',
      badge: 'Mitra',
      icon: (active) => (
        <svg
          className={`h-4 w-4 transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      id: 'invites',
      label: 'Daftar Undangan VIP',
      badge: 'B2B',
      icon: (active) => (
        <svg
          className={`h-4 w-4 transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
          />
        </svg>
      ),
    },
    {
      id: 'security',
      label: 'Sistem & Keamanan',
      badge: 'RBAC',
      icon: (active) => (
        <svg
          className={`h-4 w-4 transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Warm Minimalist Craft Tab Bar */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xs min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition duration-150 ease-out ${
                  isActive
                    ? 'bg-[#141416] text-white font-semibold shadow-xs'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                {tab.icon(isActive)}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="transition-all duration-200">
        {activeTab === 'users' && <UserManagementTable />}
        {activeTab === 'invites' && <VipInviteGenerator />}
        {activeTab === 'security' && <SecurityConfigPanel />}
      </div>
    </div>
  );
}
