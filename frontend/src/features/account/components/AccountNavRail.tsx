import React from 'react';
import Link from 'next/link';
import type { AccountNavKey } from '../types';

interface NavItem {
  readonly key: AccountNavKey;
  readonly label: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'services', label: 'Services' },
  { key: 'orders', label: 'Orders' },
  { key: 'documents', label: 'Documents' },
  { key: 'community', label: 'Community' },
  { key: 'account', label: 'Account' },
  { key: 'signout', label: 'Sign out' },
];

interface AccountNavRailProps {
  readonly activeKey: AccountNavKey;
  readonly onSelect: (key: AccountNavKey) => void;
  readonly onSignOut?: () => void;
}

export function AccountNavRail({
  activeKey,
  onSelect,
  onSignOut,
}: Readonly<AccountNavRailProps>) {
  const handleClick = (key: AccountNavKey) => {
    if (key === 'signout') {
      onSignOut?.();
      return;
    }
    onSelect(key);
  };

  return (
    <nav aria-label="Portal Navigation" className="flex flex-col w-full md:w-[200px] shrink-0">
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleClick(item.key)}
            className={`w-full text-left py-3.5 border-b border-[#1E1E21] text-[14px] transition-colors ${
              isActive
                ? 'font-semibold text-white'
                : 'font-normal text-[#8A8F98] hover:text-white'
            }`}
          >
            {item.label}
          </button>
        );
      })}

      <Link
        href="/catalog"
        className="w-full text-left py-3.5 border-b border-[#1E1E21] text-[13px] text-[#8A8F98] hover:text-white transition-colors block mt-6"
      >
        ← Kembali ke Toko
      </Link>
    </nav>
  );
}
