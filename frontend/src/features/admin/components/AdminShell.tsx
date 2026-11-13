'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { useOptionalNotice } from '@/shared/components/notice/NoticeContext';
import type { NoticeItem } from '@/shared/components/notice/types';
import {
  Users,
  Ticket,
  Percent,
  ShieldCheck,
  Package,
  Receipt,
  ExternalLink,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sliders,
  Settings,
} from 'lucide-react';
import {
  AnimatedSidebarProvider,
  AnimatedSidebar,
  AnimatedSidebarHeader,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuItem,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuSub,
  AnimatedSidebarMenuSubItem,
  AnimatedSidebarMenuSubButton,
  AnimatedSidebarTrigger,
} from './ui/Sidebar';
import { UserManagementTable } from './UserManagementTable';
import { VipInviteGenerator } from './VipInviteGenerator';
import { DiscountPoliciesPanel } from './DiscountPoliciesPanel';
import { SecurityConfigPanel } from '../SecurityConfigPanel';
import { SidebarSearch } from './SidebarSearch';
import {
  SidebarNotification,
  DEFAULT_ADMIN_NOTIFICATIONS,
  type NotificationItem,
} from './SidebarNotification';
import { CommandPaletteModal } from './CommandPaletteModal';
import { OrdersTable } from './OrdersTable';
import { TaxConfigPanel } from './TaxConfigPanel';
import { HeroManagementPanel } from './HeroManagementPanel';
import { EventManagementPanel } from './EventManagementPanel';
import type { AdminShellTab } from '../types';

export type { AdminShellTab };

const TAB_INFERENCE_RULES: readonly {
  readonly tab: AdminShellTab;
  readonly keywords: readonly string[];
}[] = [
  { tab: 'hero', keywords: ['hero', 'slide', 'carousel', 'banner'] },
  { tab: 'events', keywords: ['event', 'komunitas', 'community'] },
  { tab: 'security', keywords: ['security', 'keamanan', 'otp', 'rbac', 'brute'] },
  { tab: 'invites', keywords: ['invite', 'undangan', 'vip', 'token'] },
  { tab: 'customers', keywords: ['customer', 'user', 'mitra', 'partner', 'pelanggan', 'role'] },
  { tab: 'tax', keywords: ['tax', 'pajak', 'faktur', 'ppn'] },
  { tab: 'policies', keywords: ['policy', 'policies', 'diskon', 'discount', 'margin'] },
  { tab: 'orders', keywords: ['order', 'pesanan', 'dispatch', 'sla'] },
];

function formatTraceTime(timestamp: number): string {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return '--:--:--';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '--:--:--';
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function inferTargetTab(source?: string, action?: string): AdminShellTab | undefined {
  const combined = `${source ?? ''} ${action ?? ''}`.toLowerCase().trim();
  if (!combined) {
    return undefined;
  }
  for (const rule of TAB_INFERENCE_RULES) {
    if (rule.keywords.some((kw) => combined.includes(kw))) {
      return rule.tab;
    }
  }
  return undefined;
}

export function mapNoticeHistoryToNotificationItems(
  history: readonly NoticeItem[]
): NotificationItem[] {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  return history.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? '',
    time: formatTraceTime(item.timestamp),
    category: 'trace',
    unread: !item.read,
    targetTab: inferTargetTab(item.source, item.action),
    traceId: item.traceId,
    noticeType: item.type,
    source: item.source,
    action: item.action,
    detail: item.detail,
    timestamp: item.timestamp,
  }));
}

interface AdminShellProps {
  readonly user: {
    readonly name: string;
    readonly email: string;
    readonly role: string;
  };
}

export function AdminShell({ user }: Readonly<AdminShellProps>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminShellTab>('orders');
  const [isContentMenuOpen, setIsContentMenuOpen] = useState<boolean>(
    activeTab === 'hero' || activeTab === 'events'
  );
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState<boolean>(
    activeTab === 'tax' || activeTab === 'policies' || activeTab === 'security'
  );
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const noticeCtx = useOptionalNotice();

  const mergedNotifications = useMemo(() => {
    const traceItems = mapNoticeHistoryToNotificationItems(noticeCtx?.history ?? []);
    return [...traceItems, ...DEFAULT_ADMIN_NOTIFICATIONS];
  }, [noticeCtx?.history]);

  const isSuperadmin = user.role === 'superadmin';

  // Option A Clean Gating Safety: Non-superadmin cannot access configuration tabs
  useEffect(() => {
    if (!isSuperadmin && (activeTab === 'tax' || activeTab === 'policies' || activeTab === 'security')) {
      setActiveTab('orders');
    }
  }, [isSuperadmin, activeTab]);

  // Auto-expand menus when their child tabs are active
  useEffect(() => {
    if (activeTab === 'hero' || activeTab === 'events') {
      setIsContentMenuOpen(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'tax' || activeTab === 'policies' || activeTab === 'security') {
      setIsConfigMenuOpen(true);
    }
  }, [activeTab]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    setIsScrolled(false);
  }, [activeTab]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrolled = e.currentTarget.scrollTop > 10;
    if (scrolled !== isScrolled) {
      setIsScrolled(scrolled);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const getInitials = (name: string, email: string) => {
    const clean = (name || email || '').trim();
    if (!clean) return 'AD';
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

  const tabMeta: Record<AdminShellTab, { title: string; subtitle: string; category: string }> = {
    orders: {
      title: 'Pesanan Masuk & Manufaktur',
      subtitle: 'Monitoring alur pesanan knalpot custom & ready stock, target dispatch SLA, dan status pelunasan B2B.',
      category: 'Operasional',
    },
    customers: {
      title: 'Direktori Mitra & Pelanggan',
      subtitle: 'Manajemen akun kemitraan B2B, verifikasi bengkel, dan penetapan margin grosir.',
      category: 'Operasional',
    },
    invites: {
      title: 'Undangan VIP B2B',
      subtitle: 'Penerbitan token registrasi instan untuk bengkel rekanan (20%) dan distributor regional (35%).',
      category: 'Operasional',
    },
    hero: {
      title: 'Manajemen Hero Carousel',
      subtitle: 'Kelola banner visual utama storefront, urutan slide, headline, CTA, dan status tayang.',
      category: 'Konten Web',
    },
    events: {
      title: 'Event & Komunitas',
      subtitle: 'Publikasi agenda track day, gathering komunitas, lokasi sirkuit, dan registrasi peserta.',
      category: 'Konten Web',
    },
    tax: {
      title: 'Pengaturan Pajak & Faktur',
      subtitle: 'Konfigurasi tarif PPN (0%, 11%, 12%), mode harga include/exclude, dan profil PKP perusahaan.',
      category: 'Konfigurasi Sistem',
    },
    policies: {
      title: 'Matriks Kebijakan Diskon',
      subtitle: 'Struktur margin katalog bertingkat, proteksi harga eceran terendah, dan simulasi laba grosir.',
      category: 'Konfigurasi Sistem',
    },
    security: {
      title: 'Sistem & Keamanan OTP',
      subtitle: 'Kendali parameter proteksi brute force, durasi kunci akun, dan batas frekuensi request real-time.',
      category: 'Konfigurasi Sistem',
    },
  };

  const currentMeta = tabMeta[activeTab] || tabMeta.orders;

  return (
    <AnimatedSidebarProvider open={open} onOpenChange={setOpen}>
      <div className="flex h-screen w-full bg-[#FAFAFA] text-zinc-950 overflow-hidden font-sans antialiased selection:bg-zinc-900 selection:text-white">
        {/* 1. Left Animated Sidebar (starc007 / beui.dev pattern) */}
        <AnimatedSidebar collapsible="icon" variant="sidebar">
          {/* Header */}
          <AnimatedSidebarHeader>
            <div className="flex items-center justify-between gap-2.5">
              <Link href="/" className="flex items-center gap-2.5 group shrink-0 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 p-1 shadow-xs overflow-hidden">
                  <Image
                    src="/assets/Logo ARM no BG.png"
                    alt="ARM Exhaust"
                    width={28}
                    height={28}
                    priority
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col min-w-0 group-data-[state=collapsed]/sidebar:hidden">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-white truncate">
                    <span>ARM Exhaust</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Admin Console
                  </div>
                </div>
              </Link>
            </div>
          </AnimatedSidebarHeader>

          {/* Interactive Search & Notifications directly under Header */}
          <SidebarSearch
            isCollapsed={!open}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
          <SidebarNotification
            isCollapsed={!open}
            userRole={user.role}
            notifications={mergedNotifications}
            onSelectTab={(tabId) => setActiveTab(tabId as AdminShellTab)}
            onMarkAllRead={noticeCtx?.markAllHistoryRead}
            onClearTraces={noticeCtx?.clearHistory}
          />

          {/* Content with Flat Stream & Collapsible Submenus */}
          <AnimatedSidebarContent>
            <AnimatedSidebarGroup>
              <AnimatedSidebarGroupContent>
                <AnimatedSidebarMenu>
                  {/* Group 1: Operasional (Flat 3 items) */}
                  <AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuButton
                      icon={<Package className="h-4 w-4" />}
                      badge="5"
                      isActive={activeTab === 'orders'}
                      onSelect={() => setActiveTab('orders')}
                    >
                      Pesanan Masuk
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuButton
                      icon={<Users className="h-4 w-4" />}
                      badge="14"
                      isActive={activeTab === 'customers'}
                      onSelect={() => setActiveTab('customers')}
                    >
                      Direktori Mitra
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuButton
                      icon={<Ticket className="h-4 w-4" />}
                      badge="3"
                      isActive={activeTab === 'invites'}
                      onSelect={() => setActiveTab('invites')}
                    >
                      Undangan VIP
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>

                  {/* Group 2: Collapsible Konten Web */}
                  <AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuButton
                      icon={<Sliders className="h-4 w-4" />}
                      ariaExpanded={isContentMenuOpen}
                      onSelect={() => setIsContentMenuOpen((prev) => !prev)}
                    >
                      Konten Web
                    </AnimatedSidebarMenuButton>
                    <AnimatedSidebarMenuSub open={isContentMenuOpen}>
                      <AnimatedSidebarMenuSubItem>
                        <AnimatedSidebarMenuSubButton
                          isActive={activeTab === 'hero'}
                          onSelect={() => setActiveTab('hero')}
                        >
                          Hero Carousel
                        </AnimatedSidebarMenuSubButton>
                      </AnimatedSidebarMenuSubItem>
                      <AnimatedSidebarMenuSubItem>
                        <AnimatedSidebarMenuSubButton
                          isActive={activeTab === 'events'}
                          onSelect={() => setActiveTab('events')}
                        >
                          Event & Komunitas
                        </AnimatedSidebarMenuSubButton>
                      </AnimatedSidebarMenuSubItem>
                    </AnimatedSidebarMenuSub>
                  </AnimatedSidebarMenuItem>

                  {/* Group 3: Collapsible Konfigurasi Sistem (Superadmin Only) */}
                  {user.role === 'superadmin' && (
                    <AnimatedSidebarMenuItem>
                      <AnimatedSidebarMenuButton
                        icon={<Settings className="h-4 w-4" />}
                        ariaExpanded={isConfigMenuOpen}
                        onSelect={() => setIsConfigMenuOpen((prev) => !prev)}
                      >
                        Konfigurasi Sistem
                      </AnimatedSidebarMenuButton>
                      <AnimatedSidebarMenuSub open={isConfigMenuOpen}>
                        <AnimatedSidebarMenuSubItem>
                          <AnimatedSidebarMenuSubButton
                            icon={<Receipt className="h-3.5 w-3.5" />}
                            isActive={activeTab === 'tax'}
                            onSelect={() => setActiveTab('tax')}
                          >
                            Pengaturan Pajak
                          </AnimatedSidebarMenuSubButton>
                        </AnimatedSidebarMenuSubItem>
                        <AnimatedSidebarMenuSubItem>
                          <AnimatedSidebarMenuSubButton
                            icon={<Percent className="h-3.5 w-3.5" />}
                            isActive={activeTab === 'policies'}
                            onSelect={() => setActiveTab('policies')}
                          >
                            Matriks Diskon
                          </AnimatedSidebarMenuSubButton>
                        </AnimatedSidebarMenuSubItem>
                        <AnimatedSidebarMenuSubItem>
                          <AnimatedSidebarMenuSubButton
                            icon={<ShieldCheck className="h-3.5 w-3.5" />}
                            isActive={activeTab === 'security'}
                            onSelect={() => setActiveTab('security')}
                          >
                            Keamanan & RBAC
                          </AnimatedSidebarMenuSubButton>
                        </AnimatedSidebarMenuSubItem>
                      </AnimatedSidebarMenuSub>
                    </AnimatedSidebarMenuItem>
                  )}

                  {/* Navigasi Publik */}
                  <AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuButton
                      icon={<ExternalLink className="h-4 w-4" />}
                      href="/"
                      target="_blank"
                    >
                      Katalog Storefront
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                </AnimatedSidebarMenu>
              </AnimatedSidebarGroupContent>
            </AnimatedSidebarGroup>
          </AnimatedSidebarContent>

          {/* Bottom Profile Footer */}
          <AnimatedSidebarFooter>
            {/* Expanded Profile Card */}
            <div className="hidden group-data-[state=expanded]/sidebar:flex items-center justify-between gap-2 rounded-xl bg-[#141417] border border-[#27272a] p-2 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#27272a] border border-zinc-700 text-xs font-semibold text-white">
                  {getInitials(user.name, user.email)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-white">
                    {user.name || 'Admin'}
                  </div>
                  <div className="truncate text-[10px] text-zinc-400">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition shrink-0"
                title="Keluar dari sesi admin"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Collapsed Compact Profile & Logout Button (1-Click Accessibility) */}
            <div className="hidden group-data-[state=collapsed]/sidebar:flex flex-col items-center gap-2 py-1">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#27272a] border border-zinc-700 text-xs font-semibold text-white shadow-xs"
                title={`${user.name || 'Admin'} (${user.email})`}
              >
                {getInitials(user.name, user.email)}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="group/logout relative flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                aria-label="Keluar dari sesi admin"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 hidden rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-200 shadow-xl group-hover/logout:block whitespace-nowrap">
                  Keluar
                </span>
              </button>
            </div>
          </AnimatedSidebarFooter>
        </AnimatedSidebar>

        {/* 2. Main Workspace Canvas */}
        <div 
          ref={scrollContainerRef}
          data-lenis-prevent="true"
          onScroll={handleScroll}
          className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#FAFAFA] scrollbar-none overscroll-y-contain"
        >
          {/* Topbar Header */}
          <header className={cn(
            "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 px-4 sm:px-6 transition-all duration-200 border-b",
            isScrolled
              ? "bg-white/90 backdrop-blur-md border-zinc-200 shadow-xs"
              : "bg-[#FAFAFA]/80 backdrop-blur-xs border-transparent"
          )}>
            {/* Left: Sidebar Toggle & Clean Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <AnimatedSidebarTrigger className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition shadow-xs">
                {open ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </AnimatedSidebarTrigger>

              <nav className="flex items-center gap-2 text-xs text-zinc-500 min-w-0">
                <span className="text-zinc-500 shrink-0">ARM</span>
                <span className="text-zinc-300 shrink-0">/</span>
                <span className="text-zinc-500 shrink-0 hidden xs:inline">{currentMeta.category}</span>
                <span className="text-zinc-300 shrink-0 hidden xs:inline">/</span>
                <span className="text-zinc-950 font-semibold truncate max-w-[130px] sm:max-w-none">{currentMeta.title}</span>
              </nav>
            </div>
          </header>

          {/* Content Body Canvas */}
          <main className="flex-1 p-5 sm:p-7 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {/* Clean Contextual Section Header */}
            <div className="pb-4 border-b border-zinc-200">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                {currentMeta.title}
              </h1>
              <p className="mt-1 text-xs text-zinc-500">
                {currentMeta.subtitle}
              </p>
            </div>

            {/* Active Tab Panel */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'orders' && <OrdersTable />}
              {activeTab === 'customers' && <UserManagementTable />}
              {activeTab === 'invites' && <VipInviteGenerator />}
              {activeTab === 'hero' && (
                <div data-testid="panel-hero">
                  <HeroManagementPanel />
                </div>
              )}
              {activeTab === 'events' && (
                <div data-testid="panel-events">
                  <EventManagementPanel />
                </div>
              )}
              {user.role === 'superadmin' && activeTab === 'tax' && <TaxConfigPanel />}
              {user.role === 'superadmin' && activeTab === 'policies' && <DiscountPoliciesPanel />}
              {user.role === 'superadmin' && activeTab === 'security' && <SecurityConfigPanel />}
            </motion.div>
          </main>
        </div>

        {/* Global ⌘K Command Palette Modal */}
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onOpen={() => setIsCommandPaletteOpen(true)}
          onSelectTab={(tabId) => setActiveTab(tabId as AdminShellTab)}
          userRole={user.role}
        />
      </div>
    </AnimatedSidebarProvider>
  );
}
