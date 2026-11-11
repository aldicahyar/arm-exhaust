'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  Plus,
} from 'lucide-react';
import {
  AnimatedSidebarProvider,
  AnimatedSidebar,
  AnimatedSidebarHeader,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarGroupContent,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuItem,
  AnimatedSidebarMenuButton,
  AnimatedSidebarTrigger,
  AnimatedSidebarRail,
} from './ui/Sidebar';
import { UserManagementTable } from './UserManagementTable';
import { VipInviteGenerator } from './VipInviteGenerator';
import { VipInviteModal } from './VipInviteModal';
import { DiscountPoliciesPanel } from './DiscountPoliciesPanel';
import { SecurityConfigPanel } from '../SecurityConfigPanel';
import { SidebarSearch } from './SidebarSearch';
import { SidebarNotification } from './SidebarNotification';
import { CommandPaletteModal } from './CommandPaletteModal';
import { OrdersTable } from './OrdersTable';
import { TaxConfigPanel } from './TaxConfigPanel';
import type { AdminShellTab } from '../types';

export type { AdminShellTab };

interface AdminShellProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function AdminShell({ user }: AdminShellProps) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminShellTab>('orders');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const router = useRouter();

  const isSuperadmin = user.role === 'superadmin';

  // Option A Clean Gating Safety: Non-superadmin cannot access configuration tabs
  useEffect(() => {
    if (!isSuperadmin && (activeTab === 'tax' || activeTab === 'policies' || activeTab === 'security')) {
      setActiveTab('orders');
    }
  }, [isSuperadmin, activeTab]);

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
      <div className="flex h-screen w-full bg-[#fffbf5] text-[#1e1501] overflow-hidden font-sans antialiased selection:bg-[#f8a712]/25 selection:text-[#1e1501]">
        {/* 1. Left Animated Sidebar (starc007 / beui.dev pattern) */}
        <AnimatedSidebar collapsible="icon" variant="sidebar">
          {/* Header */}
          <AnimatedSidebarHeader>
            <div className="flex items-center justify-between gap-2.5">
              <Link href="/" className="flex items-center gap-2.5 group shrink-0 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f59e0b] font-mono text-xs font-black text-black shadow-xs shadow-[#f59e0b]/20">
                  ARM
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
            onSelectTab={(tabId) => setActiveTab(tabId as AdminShellTab)}
          />

          {/* Content with Group Sections & Smooth Hover/Active Pill */}
          <AnimatedSidebarContent>
            {/* Grup Operasional (Selalu aktif untuk Admin & Superadmin) */}
            <AnimatedSidebarGroup>
              <AnimatedSidebarGroupLabel>Operasional</AnimatedSidebarGroupLabel>
              <AnimatedSidebarGroupContent>
                <AnimatedSidebarMenu>
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
                </AnimatedSidebarMenu>
              </AnimatedSidebarGroupContent>
            </AnimatedSidebarGroup>

            {/* Grup Konfigurasi Sistem (Superadmin Only - Opsi A: Bersih tanpa disabled clutter) */}
            {user.role === 'superadmin' && (
              <AnimatedSidebarGroup>
                <AnimatedSidebarGroupLabel>Konfigurasi Sistem</AnimatedSidebarGroupLabel>
                <AnimatedSidebarGroupContent>
                  <AnimatedSidebarMenu>
                    <AnimatedSidebarMenuItem>
                      <AnimatedSidebarMenuButton
                        icon={<Receipt className="h-4 w-4" />}
                        isActive={activeTab === 'tax'}
                        onSelect={() => setActiveTab('tax')}
                      >
                        Pengaturan Pajak
                      </AnimatedSidebarMenuButton>
                    </AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuItem>
                      <AnimatedSidebarMenuButton
                        icon={<Percent className="h-4 w-4" />}
                        isActive={activeTab === 'policies'}
                        onSelect={() => setActiveTab('policies')}
                      >
                        Matriks Diskon
                      </AnimatedSidebarMenuButton>
                    </AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuItem>
                      <AnimatedSidebarMenuButton
                        icon={<ShieldCheck className="h-4 w-4" />}
                        isActive={activeTab === 'security'}
                        onSelect={() => setActiveTab('security')}
                      >
                        Keamanan & RBAC
                      </AnimatedSidebarMenuButton>
                    </AnimatedSidebarMenuItem>
                  </AnimatedSidebarMenu>
                </AnimatedSidebarGroupContent>
              </AnimatedSidebarGroup>
            )}

            {/* Navigasi Publik */}
            <AnimatedSidebarGroup>
              <AnimatedSidebarGroupLabel>Navigasi Publik</AnimatedSidebarGroupLabel>
              <AnimatedSidebarGroupContent>
                <AnimatedSidebarMenu>
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
            <div className="flex items-center justify-between gap-2 rounded-xl bg-[#141417] border border-[#27272a] p-2 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#27272a] border border-zinc-700 text-xs font-semibold text-white">
                  {getInitials(user.name, user.email)}
                </div>
                <div className="flex flex-col min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
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
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition shrink-0 group-data-[state=collapsed]/sidebar:hidden"
                title="Keluar dari sesi admin"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </AnimatedSidebarFooter>

          {/* Interactive Rail Toggle on edge */}
          <AnimatedSidebarRail />
        </AnimatedSidebar>

        {/* 2. Main Workspace Canvas */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#fffbf5]">
          {/* Topbar Header */}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[#eedec5] bg-[#fffbf5]/95 px-4 sm:px-6 backdrop-blur-md">
            {/* Left: Sidebar Toggle & Clean Breadcrumb */}
            <div className="flex items-center gap-3">
              <AnimatedSidebarTrigger className="p-1.5 rounded-lg border border-[#eedec5] bg-white text-[#786b53] hover:text-[#1e1501] hover:bg-[#fbf5ea] transition shadow-xs">
                {open ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </AnimatedSidebarTrigger>

              <nav className="flex items-center gap-2 text-xs text-[#786b53]">
                <span className="text-[#786b53]">ARM</span>
                <span className="text-[#786b53]/40">/</span>
                <span className="text-[#786b53]">{currentMeta.category}</span>
                <span className="text-[#786b53]/40">/</span>
                <span className="text-[#1e1501] font-semibold">{currentMeta.title}</span>
              </nav>
            </div>

            {/* Right: Primary Action Button (High Contrast WCAG AAA on Golden Amber) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f8a712] hover:bg-[#e09207] px-3.5 py-2 text-xs font-bold text-[#1e1501] transition shadow-xs active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Buat Undangan VIP</span>
                <span className="sm:hidden">Undang</span>
              </button>
            </div>
          </header>

          {/* Content Body Canvas */}
          <main className="flex-1 p-5 sm:p-7 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {/* Clean Contextual Section Header */}
            <div className="pb-4 border-b border-[#eedec5]">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e1501]">
                {currentMeta.title}
              </h1>
              <p className="mt-1 text-xs text-[#786b53]">
                {currentMeta.subtitle}
              </p>
            </div>

            {/* Active Tab Panel */}
            <div className="transition-all duration-150">
              {activeTab === 'orders' && <OrdersTable />}
              {activeTab === 'customers' && <UserManagementTable />}
              {activeTab === 'invites' && <VipInviteGenerator />}
              {user.role === 'superadmin' && activeTab === 'tax' && <TaxConfigPanel />}
              {user.role === 'superadmin' && activeTab === 'policies' && <DiscountPoliciesPanel />}
              {user.role === 'superadmin' && activeTab === 'security' && <SecurityConfigPanel />}
            </div>
          </main>
        </div>

        {/* Global VIP Invite Modal */}
        <VipInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onInviteCreated={() => {
            // Handled inside
          }}
        />

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
