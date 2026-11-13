'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Package,
  Users,
  Ticket,
  Percent,
  Receipt,
  ShieldCheck,
  UserPlus,
  Sliders,
  Calendar,
  ExternalLink,
  LogOut,
  CornerDownLeft,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface CommandPaletteModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelectTab: (tabId: string) => void;
  readonly userRole?: string;
  readonly onOpen?: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  category: 'Navigasi Menu' | 'Aksi Cepat';
  icon: LucideIcon;
  keywords: string[];
  superadminOnly?: boolean;
  action: () => void;
}

/**
 * CommandPaletteModal - Spotlight / Global ⌘K Command Palette for ARM Exhaust Admin
 * Provides swift keyboard-driven navigation across operational, CRM, and system modules.
 */
export function CommandPaletteModal({
  isOpen,
  onClose,
  onSelectTab,
  userRole,
  onOpen,
}: Readonly<CommandPaletteModalProps>) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isSuperadmin = userRole === 'superadmin';

  // Global Keyboard Shortcut: ⌘K or Ctrl+K to toggle, Esc to close
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else if (onOpen) {
          onOpen();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose, onOpen]);

  // Autofocus input & reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Master definition of commands
  const allCommands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      // Operational Tabs
      {
        id: 'nav-orders',
        label: 'Pesanan Masuk',
        description: 'Pantau antrean produksi, QC, estimasi kirim, dan resi knalpot',
        category: 'Navigasi Menu',
        icon: Package,
        keywords: ['pesanan', 'order', 'orders', 'produksi', 'antrean', 'resi', 'pengiriman', 'masuk', 'knalpot'],
        action: () => {
          onSelectTab('orders');
          onClose();
        },
      },
      {
        id: 'nav-customers',
        label: 'Direktori Mitra',
        description: 'Manajemen akun kemitraan B2B, bengkel rekanan, dan distributor',
        category: 'Navigasi Menu',
        icon: Users,
        keywords: ['mitra', 'pelanggan', 'customer', 'customers', 'bengkel', 'distributor', 'reseller', 'direktori'],
        action: () => {
          onSelectTab('customers');
          onClose();
        },
      },
      {
        id: 'nav-invites',
        label: 'Undangan VIP',
        description: 'Penerbitan token registrasi instan bengkel rekanan & distributor',
        category: 'Navigasi Menu',
        icon: Ticket,
        keywords: ['undangan', 'vip', 'invite', 'token', 'registrasi', 'b2b', 'klaim', 'link'],
        action: () => {
          onSelectTab('invites');
          onClose();
        },
      },
      // Web Content Tabs
      {
        id: 'nav-hero',
        label: 'Hero Carousel',
        description: 'Kelola banner visual utama beranda, urutan slide, judul, dan status tayang',
        category: 'Navigasi Menu',
        icon: Sliders,
        keywords: ['hero', 'carousel', 'banner', 'slide', 'promo', 'konten', 'beranda', 'gambar'],
        action: () => {
          onSelectTab('hero');
          onClose();
        },
      },
      {
        id: 'nav-events',
        label: 'Event & Komunitas',
        description: 'Publikasi agenda track day, gathering komunitas, sirkuit, dan registrasi',
        category: 'Navigasi Menu',
        icon: Calendar,
        keywords: ['event', 'acara', 'komunitas', 'track day', 'kopdar', 'sirkuit', 'workshop', 'agenda'],
        action: () => {
          onSelectTab('events');
          onClose();
        },
      },
      // Superadmin Gated Tabs
      {
        id: 'nav-tax',
        label: 'Pengaturan Pajak',
        description: 'Konfigurasi tarif PPN (11%), NPWP perusahaan, dan faktur pajak B2B',
        category: 'Navigasi Menu',
        icon: Receipt,
        keywords: ['pajak', 'tax', 'ppn', 'npwp', 'faktur', 'finance', 'keuangan'],
        superadminOnly: true,
        action: () => {
          onSelectTab('tax');
          onClose();
        },
      },
      {
        id: 'nav-policies',
        label: 'Kebijakan Diskon',
        description: 'Matriks struktur margin katalog bertingkat dan proteksi harga eceran',
        category: 'Navigasi Menu',
        icon: Percent,
        keywords: ['diskon', 'discount', 'kebijakan', 'margin', 'het', 'harga', 'policies', 'pricing'],
        superadminOnly: true,
        action: () => {
          onSelectTab('policies');
          onClose();
        },
      },
      {
        id: 'nav-security',
        label: 'Keamanan RBAC',
        description: 'Sistem proteksi brute force, durasi kunci akun, dan parameter OTP',
        category: 'Navigasi Menu',
        icon: ShieldCheck,
        keywords: ['keamanan', 'rbac', 'security', 'otp', 'brute force', 'role', 'akses', 'sistem'],
        superadminOnly: true,
        action: () => {
          onSelectTab('security');
          onClose();
        },
      },
      // Quick Actions
      {
        id: 'act-new-invite',
        label: 'Buat Undangan VIP Baru',
        description: 'Buka generator token registrasi mitra baru (diskon 20% / 35%)',
        category: 'Aksi Cepat',
        icon: UserPlus,
        keywords: ['buat', 'tambah', 'undangan', 'invite', 'token', 'bengkel', 'distributor', 'baru'],
        action: () => {
          onSelectTab('invites');
          onClose();
        },
      },
      {
        id: 'act-storefront',
        label: 'Lihat Toko Publik',
        description: 'Buka etalase katalog publik ARM Exhaust di tab baru',
        category: 'Aksi Cepat',
        icon: ExternalLink,
        keywords: ['toko', 'katalog', 'publik', 'storefront', 'etalase', 'website', 'lihat'],
        action: () => {
          window.open('/', '_blank');
          onClose();
        },
      },
      {
        id: 'act-logout',
        label: 'Logout Sesi',
        description: 'Keluar dengan aman dari sesi Admin Console ARM Exhaust',
        category: 'Aksi Cepat',
        icon: LogOut,
        keywords: ['logout', 'keluar', 'exit', 'sign out', 'sesi'],
        action: async () => {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch {
            // ignore
          }
          window.location.href = '/login';
        },
      },
    ];

    // Filter by Superadmin permission
    return items.filter((item) => !item.superadminOnly || isSuperadmin);
  }, [isSuperadmin, onSelectTab, onClose]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return allCommands;

    return allCommands.filter((cmd) => {
      const matchLabel = cmd.label.toLowerCase().includes(clean);
      const matchDesc = cmd.description.toLowerCase().includes(clean);
      const matchKey = cmd.keywords.some((k) => k.toLowerCase().includes(clean));
      return matchLabel || matchDesc || matchKey;
    });
  }, [allCommands, query]);

  // Auto adjust selected index if it exceeds list length
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(0);
    }
  }, [filteredCommands.length, selectedIndex]);

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredCommands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      scrollItemIntoView((selectedIndex + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      scrollItemIntoView((selectedIndex - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredCommands[selectedIndex];
      if (current) {
        current.action();
      }
    }
  };

  const scrollItemIntoView = (index: number) => {
    const itemEl = listRef.current?.querySelector(`[data-command-index="${index}"]`);
    if (itemEl) {
      itemEl.scrollIntoView({ block: 'nearest' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-default"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette Pencarian (⌘K)"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950/95',
              'text-zinc-100 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 overflow-hidden z-10'
            )}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/50">
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ketik perintah, nama menu, atau aksi..."
                className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedIndex(0);
                    inputRef.current?.focus();
                  }}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="max-h-[340px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 divide-y divide-zinc-900/50"
            >
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  <Search className="h-8 w-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-zinc-300">Tidak ada menu atau aksi yang cocok</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Coba kata kunci lain seperti &quot;Pesanan&quot;, &quot;Mitra&quot;, atau &quot;Pajak&quot;.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, idx) => {
                    const isSelected = idx === selectedIndex;
                    const Icon = cmd.icon;

                    return (
                      <button
                        type="button"
                        key={cmd.id}
                        data-command-index={idx}
                        onClick={() => cmd.action()}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-left cursor-pointer transition-all',
                          isSelected
                            ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-xs'
                            : 'text-zinc-300 hover:bg-zinc-900/80 border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors',
                              isSelected
                                ? 'bg-zinc-800 text-white border-zinc-700'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold truncate text-zinc-100">
                                {cmd.label}
                              </span>
                              {cmd.superadminOnly && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                                  Superadmin
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {cmd.description}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 shrink-0">
                            <CornerDownLeft className="h-3 w-3" />
                            <span className="hidden sm:inline">Pilih</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/40 px-3.5 py-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-zinc-800 border border-zinc-700 rounded px-1 text-[10px]">↑</kbd>
                  <kbd className="font-mono bg-zinc-800 border border-zinc-700 rounded px-1 text-[10px]">↓</kbd>
                  <span className="ml-0.5">Navigasi</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-zinc-800 border border-zinc-700 rounded px-1 text-[10px]">↵</kbd>
                  <span className="ml-0.5">Pilih</span>
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <kbd className="font-mono bg-zinc-800 border border-zinc-700 rounded px-1 text-[10px]">ESC</kbd>
                  <span className="ml-0.5">Tutup</span>
                </span>
              </div>

              <span className="font-mono text-[10px] text-zinc-500">
                ARM Command Console
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
