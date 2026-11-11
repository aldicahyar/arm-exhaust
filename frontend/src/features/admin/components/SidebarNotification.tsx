'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Package,
  Users,
  ShieldAlert,
  CheckCircle2,
  X,
  ChevronRight,
  Clock,
  Sparkles,
  Inbox,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  category: 'order' | 'partner' | 'security';
  unread?: boolean;
  targetTab?: string;
}

export interface SidebarNotificationProps {
  isCollapsed: boolean;
  userRole?: string;
  notifications?: NotificationItem[];
  onSelectTab?: (tab: string) => void;
  className?: string;
}

export const DEFAULT_ADMIN_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Pesanan Baru',
    description: '#ARM-8821 — Knalpot ZX-25R Carbon Full System (Menunggu Konfirmasi)',
    time: '5 menit lalu',
    category: 'order',
    unread: true,
    targetTab: 'orders',
  },
  {
    id: 'notif-2',
    title: 'Pendaftaran Kemitraan',
    description: 'Bengkel Sentosa Motor mendaftar via link VIP (Reseller 20%)',
    time: '25 menit lalu',
    category: 'partner',
    unread: true,
    targetTab: 'customers',
  },
  {
    id: 'notif-3',
    title: 'Keamanan Sistem',
    description: 'Parameter brute-force OTP aktif & tersinkronisasi',
    time: '1 jam lalu',
    category: 'security',
    unread: true,
    targetTab: 'security',
  },
];

type FilterCategory = 'all' | 'order' | 'partner' | 'security';

/**
 * SidebarNotification - Flyout Drawer / Notification Center for ARM Exhaust Admin Sidebar
 * Stealth Luxe styling with live unread counter, interactive category filters, and tab navigation.
 */
export function SidebarNotification({
  isCollapsed,
  userRole,
  notifications: initialNotifications,
  onSelectTab,
  className,
}: SidebarNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(
    initialNotifications && initialNotifications.length > 0
      ? initialNotifications
      : DEFAULT_ADMIN_NOTIFICATIONS
  );
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  // Keep internal list in sync if props change
  useEffect(() => {
    if (initialNotifications && initialNotifications.length > 0) {
      setItems(initialNotifications);
    }
  }, [initialNotifications]);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter notifications by role: non-superadmin cannot see notifications targeting security, tax, or policies
  const roleFilteredItems = useMemo(() => {
    return items.filter((item) => {
      if (userRole !== 'superadmin') {
        if (
          item.targetTab === 'security' ||
          item.targetTab === 'tax' ||
          item.targetTab === 'policies'
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, userRole]);

  const unreadCount = useMemo(() => {
    return roleFilteredItems.filter((item) => item.unread).length;
  }, [roleFilteredItems]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return roleFilteredItems;
    return roleFilteredItems.filter((item) => item.category === activeFilter);
  }, [roleFilteredItems, activeFilter]);

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const handleItemClick = (item: NotificationItem) => {
    // Mark this item as read
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, unread: false } : i))
    );

    // If target tab is provided, route and close
    if (item.targetTab && onSelectTab) {
      onSelectTab(item.targetTab);
      setIsOpen(false);
    }
  };

  const getCategoryConfig = (category: NotificationItem['category']) => {
    switch (category) {
      case 'order':
        return {
          label: 'Pesanan',
          icon: <Package className="h-4 w-4 text-amber-400" />,
          badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        };
      case 'partner':
        return {
          label: 'Kemitraan',
          icon: <Users className="h-4 w-4 text-sky-400" />,
          badgeBg: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
        };
      case 'security':
        return {
          label: 'Sistem',
          icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
          badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
        };
      default:
        return {
          label: 'Umum',
          icon: <Bell className="h-4 w-4 text-zinc-400" />,
          badgeBg: 'bg-zinc-800 border-zinc-700 text-zinc-300',
        };
    }
  };

  return (
    <>
      {/* --- TRIGGER BUTTON --- */}
      {isCollapsed ? (
        <div className={cn('relative flex justify-center w-full px-2 py-1', className)}>
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Notifikasi"
            aria-label="Pusat Notifikasi"
            className={cn(
              'group relative flex h-9 w-9 items-center justify-center rounded-lg',
              'border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-amber-500/40',
              'text-zinc-400 hover:text-amber-400 transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50',
              isOpen && 'border-amber-500/60 bg-zinc-800 text-amber-400'
            )}
          >
            <Bell className="h-4 w-4 transition-colors" />

            {/* Notification Badge Dot for Collapsed Mode */}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 ring-1 ring-zinc-950" />
              </span>
            )}

            {/* Tooltip on Hover in Collapsed State */}
            <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 hidden rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-200 shadow-xl group-hover:block whitespace-nowrap">
              Notifikasi {unreadCount > 0 ? `(${unreadCount})` : ''}
            </span>
          </motion.button>
        </div>
      ) : (
        <div className={cn('w-full px-3 py-1', className)}>
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            whileTap={{ scale: 0.98 }}
            aria-label="Notifikasi & Order Masuk"
            className={cn(
              'group w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left',
              'bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/70 hover:border-amber-500/40',
              'text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-xs',
              'focus:outline-none focus:ring-1 focus:ring-amber-500/50',
              isOpen && 'border-amber-500/50 bg-zinc-800/90 text-zinc-100'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <Bell className="h-3.5 w-3.5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                )}
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 font-normal truncate">
                Notifikasi & Order Masuk
              </span>
            </div>

            {unreadCount > 0 ? (
              <span className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                {unreadCount}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 shrink-0">
                0
              </span>
            )}
          </motion.button>
        </div>
      )}

      {/* --- SLIDE-OVER FLYOUT DRAWER & BACKDROP --- */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex pointer-events-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: '-100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              role="dialog"
              aria-modal="true"
              aria-label="Pusat Notifikasi dan Aktivitas"
              className={cn(
                'relative z-10 flex flex-col w-full max-w-md sm:max-w-lg h-full',
                'bg-zinc-950/95 border-r border-zinc-800/90 shadow-2xl backdrop-blur-md text-zinc-100'
              )}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-zinc-100 font-sans tracking-wide">
                        Pusat Notifikasi
                      </h2>
                      {unreadCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {unreadCount} baru
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                          Terbaca semua
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Aktivitas pesanan, registrasi mitra, dan keamanan sistem
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Tutup notifikasi"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Toolbar: Filter Tabs & Tandai Semua Dibaca */}
              <div className="flex flex-col gap-2.5 px-5 py-3 border-b border-zinc-800/70 bg-zinc-900/20">
                {/* Filter Categories */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                        activeFilter === 'all'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      )}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('order')}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                        activeFilter === 'order'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      )}
                    >
                      Pesanan (Orders)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('partner')}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                        activeFilter === 'partner'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      )}
                    >
                      Kemitraan
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('security')}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                        activeFilter === 'security'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      )}
                    >
                      Sistem
                    </button>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Tandai Semua Dibaca</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Items List */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-3">
                      <Inbox className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">
                      Tidak ada notifikasi
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                      Tidak ada aktivitas baru dalam kategori ini saat ini.
                    </p>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const cfg = getCategoryConfig(item.category);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleItemClick(item)}
                        className={cn(
                          'group relative flex flex-col gap-2 p-3.5 rounded-xl border transition-all cursor-pointer text-left',
                          item.unread
                            ? 'bg-zinc-900/90 border-zinc-700/80 hover:border-amber-500/50 shadow-xs'
                            : 'bg-zinc-900/40 border-zinc-800/70 hover:bg-zinc-900/70 hover:border-zinc-700 text-zinc-400'
                        )}
                      >
                        {/* Unread Indicator Bar */}
                        {item.unread && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 bg-amber-500 rounded-r-full" />
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium tracking-wide uppercase',
                                cfg.badgeBg
                              )}
                            >
                              {cfg.icon}
                              <span>{cfg.label}</span>
                            </span>
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3" />
                              {item.time}
                            </span>
                          </div>

                          {item.unread && (
                            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 mt-1 shadow-xs shadow-amber-400/50" />
                          )}
                        </div>

                        <div>
                          <h3
                            className={cn(
                              'text-xs font-semibold tracking-wide transition-colors',
                              item.unread
                                ? 'text-zinc-100 group-hover:text-amber-400'
                                : 'text-zinc-300 group-hover:text-zinc-100'
                            )}
                          >
                            {item.title}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* Navigation Tab Jump Cue */}
                        {item.targetTab && (
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 mt-0.5">
                            <span className="text-[11px] text-zinc-400 font-mono">
                              Buka modul:{' '}
                              <span className="text-amber-400/90 font-medium">
                                {item.targetTab}
                              </span>
                            </span>
                            <span className="inline-flex items-center text-xs text-amber-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/60 text-[11px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>ARM Notification Engine</span>
                </span>
                <span className="text-zinc-400">Esc untuk menutup</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
