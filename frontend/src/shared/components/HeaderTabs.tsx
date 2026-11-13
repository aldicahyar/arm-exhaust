'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { RollUpText } from './RollUpText';

export type NavTabKey = 'home' | 'product' | 'contact';
export type LanguageKey = 'ID' | 'EN';

export interface UserRoleDetails {
  id?: string;
  name?: string;
  discount_percent?: number;
  can_access_admin?: boolean;
  can_access_b2b?: boolean;
  badge_style?: { bg?: string; border?: string; text?: string };
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role?: string;
  roleDetails?: UserRoleDetails;
  role_details?: UserRoleDetails;
  avatarUrl?: string;
  unreadNotifications?: number;
}

export interface HeaderTabsProps {
  initialLanguage?: LanguageKey;
  cartCount?: number;
  initialUser?: UserProfile | null;
  onSearchSubmit?: (query: string) => void;
  onLanguageChange?: (lang: LanguageKey) => void;
  onLogout?: () => void;
}

const TABS: { id: NavTabKey; label: string; href: string }[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'product', label: 'Product', href: '/catalog' },
  { id: 'contact', label: 'Contact', href: '/contact' },
];

function renderRoleBadge(user: UserProfile) {
  const role = user.role?.toLowerCase();
  const isAdmin = role === 'admin' || user.roleDetails?.can_access_admin || user.role_details?.can_access_admin;
  const isDistributor = role === 'distributor';
  const isReseller = role === 'reseller' || user.roleDetails?.can_access_b2b || user.role_details?.can_access_b2b;

  if (isAdmin) {
    return (
      <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wider text-zinc-300">
        ADMIN
      </span>
    );
  }
  if (isDistributor) {
    const disc = user.roleDetails?.discount_percent ?? user.role_details?.discount_percent ?? 35;
    return (
      <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wider text-zinc-300">
        DISTRIBUTOR {disc}%
      </span>
    );
  }
  if (isReseller) {
    const disc = user.roleDetails?.discount_percent ?? user.role_details?.discount_percent ?? 20;
    return (
      <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wider text-zinc-300">
        VIP RESELLER {disc}%
      </span>
    );
  }
  return null;
}

export function HeaderTabs({
  initialLanguage = 'ID',
  cartCount = 0,
  initialUser = null,
  onSearchSubmit,
  onLanguageChange,
  onLogout,
}: HeaderTabsProps) {
  // Tab aktif diturunkan dari route — bukan state internal, supaya underline mengikuti navigasi
  const pathname = usePathname();
  const activeTab: NavTabKey = pathname.startsWith('/catalog')
    ? 'product'
    : pathname.startsWith('/contact')
      ? 'contact'
      : 'home';
  const [currentLang, setCurrentLang] = useState<LanguageKey>(initialLanguage);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialUser);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Vercel-style dynamic hover & active indicators
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState<{ left: string; width: string }>({ left: '0px', width: '0px' });
  const [activeStyle, setActiveStyle] = useState<{ left: string; width: string }>({ left: '0px', width: '0px' });
  const tabRefs = useRef<(HTMLElement | null)[]>([]);

  // Icon animation states for 21st.dev Lucide icons
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calculate sliding active underline based on activeTab
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  // Measure sliding indicators; re-measure on resize & breakpoint change (offsets are 0 while display:none below md)
  useEffect(() => {
    const measure = () => {
      const a = tabRefs.current[activeIndex >= 0 ? activeIndex : 0];
      if (a && a.offsetWidth > 0) {
        setActiveStyle({ left: `${a.offsetLeft}px`, width: `${a.offsetWidth}px` });
      }
      if (hoveredIndex !== null) {
        const h = tabRefs.current[hoveredIndex];
        if (h) setHoverStyle({ left: `${h.offsetLeft}px`, width: `${h.offsetWidth}px` });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeIndex, hoveredIndex]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setIsLangMenuOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target) &&
        isSearchExpanded &&
        !searchQuery
      ) {
        setIsSearchExpanded(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchExpanded, searchQuery]);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Sembunyikan logo header saat footer terlihat — footer sudah menampilkan logo, hindari kesan dobel
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const handleTabClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLanguageSelect = (lang: LanguageKey) => {
    setCurrentLang(lang);
    setIsLangMenuOpen(false);
    onLanguageChange?.(lang);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchSubmit?.(searchQuery);
    } else if (e.key === 'Escape') {
      setIsSearchExpanded(false);
    }
  };

  // Ambil state login dari backend saat header pertama kali dirender + cross-tab sync
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    if (typeof window === 'undefined') return;

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('arm_auth_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'AUTH_SUCCESS' && event.data?.user) {
          setCurrentUser(event.data.user);
        } else if (event.data?.type === 'AUTH_LOGOUT') {
          setCurrentUser(null);
        }
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'arm_auth_event') {
        fetch('/api/auth/me')
          .then((r) => r.json())
          .then((d) => {
            if (d?.user) setCurrentUser(d.user);
            else setCurrentUser(null);
          })
          .catch(() => {});
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleLogoutClick = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // logout lokal tetap jalan meski request gagal
    }

    if (typeof window !== 'undefined') {
      try {
        const channel = new BroadcastChannel('arm_auth_sync');
        channel.postMessage({ type: 'AUTH_LOGOUT' });
        channel.close();
      } catch {}

      try {
        localStorage.setItem(
          'arm_auth_event',
          JSON.stringify({ type: 'AUTH_LOGOUT', timestamp: Date.now() })
        );
      } catch {}
    }

    // Beri jeda transisi halus sebelum menu ditutup agar feedback visual terbaca
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Tutup menu dengan smooth exit animation
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);

    // Tunggu animasi exit selesai (180ms) baru bersihkan user state agar tidak ada lompatan visual
    setTimeout(() => {
      setCurrentUser(null);
      setIsLoggingOut(false);
      onLogout?.();
    }, 180);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2B2B30] bg-[#0A0A0B]/95 backdrop-blur-md transition-colors font-sans">
      {/* Tier 1: Brand Logo Centered — full-width divider, content capped at max-w-7xl.
          Collapse saat footer terlihat supaya logo tidak dobel. */}
      <div className={`border-b transition-all duration-300 ${isFooterVisible ? 'max-h-0 overflow-hidden border-transparent opacity-0' : 'max-h-[76px] border-[#1E1E21]'}`}>
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="ARM Exhaust"
            className="group relative flex h-14 w-36 flex-shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded"
          >
            <Image
              src="/assets/Logo ARM no BG.png"
              alt="Logo ARM Exhaust"
              width={720}
              height={468}
              priority
              className="h-auto w-[720px] object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
        </div>
      </div>

      {/* Tier 2: Burger left (mobile) + Centered Vercel Tabs (desktop) + Utilities right */}
      <div className="relative flex h-[52px] items-center justify-center px-4">
        {/* Mobile burger — only visible below md, tier stays usable on mobile */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
          className="md:hidden absolute left-4 flex h-9 w-9 items-center justify-center rounded-lg text-[#9AA0A8] hover:bg-white/[0.08] hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Centered Tab List: nav tabs + auth tab-4 (desktop only).
            Indicators live INSIDE this container so offsetLeft/offsetWidth match their position. */}
        <div className="relative hidden md:flex h-full items-center space-x-[2px]">
          {/* Sliding Hover Highlight */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[32px] transition-all duration-200 ease-out bg-white/[0.08] rounded-[6px] pointer-events-none"
            style={{ ...hoverStyle, opacity: hoveredIndex !== null ? 1 : 0 }}
          />

          {/* Sliding Active Underline — only for nav tabs 0-2, NOT auth tab */}
          <div
            className="absolute bottom-0 h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)] transition-all duration-300 ease-out pointer-events-none"
            style={activeStyle}
          />

          {TABS.map((tab, idx) => (
            <Link
              key={tab.id}
              ref={(el) => { tabRefs.current[idx] = el; }}
              href={tab.href}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              aria-label={tab.label}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`px-3.5 py-1.5 h-[32px] flex items-center justify-center text-sm font-medium transition-colors duration-200 cursor-pointer rounded-[6px] ${
                activeTab === tab.id ? 'text-white' : 'text-[#9AA0A8] hover:text-white'
              }`}
            >
              <RollUpText label={tab.label} active={hoveredIndex === idx} />
            </Link>
          ))}

          {/* Auth Tab-4: Login (guest langsung link ke /login) / Profile (user dengan dropdown menu) */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                ref={(el) => { tabRefs.current[TABS.length] = el; }}
                onMouseEnter={() => setHoveredIndex(TABS.length)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                aria-label="Profile"
                className="px-3.5 py-1.5 h-[32px] flex items-center gap-2 text-sm font-medium text-[#9AA0A8] hover:text-white transition-colors duration-200 cursor-pointer rounded-[6px]"
              >
                <RollUpText label="Profile" active={hoveredIndex === TABS.length} />
              </button>

              {/* Profile Dropdown — centered below trigger with smooth enter/exit animation */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    key="profile-dropdown"
                    role="menu"
                    aria-orientation="vertical"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-1/2 -translate-x-1/2 mt-2.5 w-60 rounded-xl border border-white/[0.08] bg-[#121214] p-1.5 shadow-2xl shadow-black/80 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2.5 border-b border-white/[0.06] mb-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                        {renderRoleBadge(currentUser)}
                      </div>
                      <p className="text-[11px] text-zinc-400 font-normal truncate mt-0.5">{currentUser.email}</p>
                    </div>
                    <div className="py-0.5 space-y-0.5">
                      {/* Admin Dashboard */}
                      {(currentUser.role === 'admin' || currentUser.roleDetails?.can_access_admin || currentUser.role_details?.can_access_admin) && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                          role="menuitem"
                        >
                          <svg className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}

                      {/* Reseller B2B Wholesale */}
                      {(currentUser.role === 'reseller' || currentUser.roleDetails?.can_access_b2b || currentUser.role_details?.can_access_b2b) && (
                        <Link
                          href="/catalog"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                          role="menuitem"
                        >
                          <span className="flex items-center gap-2.5">
                            <svg className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Katalog Grosir B2B
                          </span>
                          <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-medium text-zinc-400 group-hover:text-zinc-200 group-hover:border-white/20 transition-colors">
                            20% OFF
                          </span>
                        </Link>
                      )}

                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                        role="menuitem"
                      >
                        <svg className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account Setting
                      </Link>

                      <Link
                        href="/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                        role="menuitem"
                      >
                        <svg className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Favorites
                      </Link>

                      <Link
                        href="/notifications"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2.5">
                          <svg className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          Notification
                        </span>
                        {Boolean(currentUser.unreadNotifications) && (
                          <span className="rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 px-1.5 py-0.5 font-mono text-[9px] font-medium">
                            {currentUser.unreadNotifications}
                          </span>
                        )}
                      </Link>
                    </div>

                    <div className="my-1 border-t border-white/[0.06]" />

                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      disabled={isLoggingOut}
                      className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 ${
                        isLoggingOut
                          ? 'opacity-70 cursor-wait bg-white/[0.04] text-zinc-400'
                          : 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/[0.08]'
                      }`}
                      role="menuitem"
                    >
                      {isLoggingOut ? (
                        <svg className="h-4 w-4 animate-spin text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-zinc-400 group-hover:text-rose-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      )}
                      <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              ref={(el) => { tabRefs.current[TABS.length] = el; }}
              onMouseEnter={() => setHoveredIndex(TABS.length)}
              onMouseLeave={() => setHoveredIndex(null)}
              aria-label="Sign in to your account"
              className="px-3.5 py-1.5 h-[32px] flex items-center justify-center text-sm font-medium text-[#9AA0A8] hover:text-white transition-colors duration-200 cursor-pointer rounded-[6px]"
            >
              <RollUpText label="Login" active={hoveredIndex === TABS.length} />
            </Link>
          )}
        </div>

        {/* Right Cluster: Utilities only (Search, Cart, Language) */}
        <div className="absolute right-4 lg:right-8 flex items-center gap-1 sm:gap-2">
          {/* Vertical Separator */}
          <div className="h-4 w-[1px] bg-[#2B2B30] mx-1" />

          {/* Utility: Expandable Search Bar with 21st.dev Lucide Animated Icon */}
          <div ref={searchContainerRef} className="relative flex items-center">
            {isSearchExpanded ? (
              <div className="flex items-center rounded-lg border border-zinc-700 bg-[#141416] px-2.5 py-1 shadow-sm transition-all animate-in fade-in duration-200">
                <svg className="h-3.5 w-3.5 text-zinc-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search bike / inlet..."
                  className="w-44 bg-transparent text-xs text-white placeholder-[#8A8F98] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
                  className="text-[#9AA0A8] hover:text-white ml-1 p-0.5"
                  title="Close search"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchExpanded(true)}
                onMouseEnter={() => setIsSearchHovered(true)}
                onMouseLeave={() => setIsSearchHovered(false)}
                title="Open search"
                className="flex items-center rounded-lg px-2.5 py-1.5 text-[#9AA0A8] hover:bg-white/[0.08] hover:text-white transition-all"
              >
                <svg
                  className={`h-4 w-4 transition-transform duration-300 ${isSearchHovered ? '-translate-y-0.5 -translate-x-0.5 text-white' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            )}
          </div>

          {/* Utility: Cart with 21st.dev Lucide Animated Icon (5a2718f0) */}
          <Link
            href="/cart"
            title="Shopping Cart"
            onMouseEnter={() => setIsCartHovered(true)}
            onMouseLeave={() => setIsCartHovered(false)}
            className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[#9AA0A8] hover:bg-white/[0.08] hover:text-white transition-all group"
          >
            <div className="relative">
              {/* Animated Cart Icon from 21st.dev 5a2718f0 */}
              <svg
                className={`h-4 w-4 transition-transform duration-300 ${isCartHovered ? 'scale-110 -translate-y-0.5 text-white' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold font-mono text-zinc-950 shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
          </Link>

          {/* Utility: Language Dropdown Selector */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              aria-expanded={isLangMenuOpen}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[#9AA0A8] hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <span className="font-mono text-xs font-semibold text-white">{currentLang}</span>
              <svg
                className={`h-3 w-3 text-[#9AA0A8] transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {isLangMenuOpen && (
                <motion.div
                  key="lang-dropdown"
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-1 w-32 rounded-xl border border-white/[0.08] bg-[#121214] p-1 shadow-2xl shadow-black/80 z-50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleLanguageSelect('ID')}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      currentLang === 'ID' ? 'bg-white/[0.08] text-white font-medium' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span className="flex items-center">
                      Indonesia
                    </span>
                    {currentLang === 'ID' && <span>✓</span>}
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Segera tersedia"
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 cursor-not-allowed"
                  >
                    <span className="flex items-center">
                      English
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">soon</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Burger Menu) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#2B2B30] bg-[#141416] px-4 py-3 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center rounded-lg border border-[#2B2B30] bg-[#0A0A0B] px-3 py-2 text-xs">
            <svg className="h-4 w-4 text-[#9AA0A8] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              placeholder="Search bike / inlet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-transparent text-white placeholder-[#8A8F98] focus:outline-none"
            />
          </div>

          {/* Mobile Auth */}
          <div className="flex items-center justify-between pt-1">
            {currentUser ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-white font-semibold text-xs border border-white/10">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">{currentUser.name}</span>
                      {renderRoleBadge(currentUser)}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">{currentUser.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className={`rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isLoggingOut
                      ? 'opacity-70 cursor-wait bg-white/[0.04] text-zinc-400'
                      : 'text-zinc-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/[0.08]'
                  }`}
                >
                  {isLoggingOut && (
                    <svg className="h-3 w-3 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full rounded-lg bg-white text-black px-3 py-2 text-center text-xs font-semibold hover:bg-zinc-200 transition-colors"
              >
                Login / Register
              </Link>
            )}
          </div>

          <div className="flex flex-col pt-1">
            {/* Conditional Mobile Links: Admin Dashboard */}
            {currentUser && (currentUser.role === 'admin' || currentUser.roleDetails?.can_access_admin || currentUser.role_details?.can_access_admin) && (
              <Link
                href="/admin"
                onClick={handleTabClick}
                className="flex items-center justify-between py-2 text-xs font-medium text-zinc-300 hover:text-white border-b border-white/[0.06]"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin Dashboard
                </span>
                <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">ADMIN</span>
              </Link>
            )}

            {/* Conditional Mobile Links: B2B Wholesale Catalog */}
            {currentUser && (currentUser.role === 'reseller' || currentUser.roleDetails?.can_access_b2b || currentUser.role_details?.can_access_b2b) && (
              <Link
                href="/catalog"
                onClick={handleTabClick}
                className="flex items-center justify-between py-2 text-xs font-medium text-zinc-300 hover:text-white border-b border-white/[0.06]"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Katalog Grosir B2B
                </span>
                <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">20% OFF</span>
              </Link>
            )}

            {TABS.map((tab) => (
              <Link
              key={tab.id}
              href={tab.href}
              onClick={handleTabClick}
              aria-label={tab.label}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`flex items-center justify-between py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.id ? 'text-white bg-white/[0.08]' : 'text-[#9AA0A8] hover:text-white'
              }`}
            >
              <RollUpText label={tab.label} />
              {activeTab === tab.id && <span className="text-[10px] bg-zinc-800 border border-zinc-700/60 px-1.5 py-0.5 rounded font-mono text-zinc-200">Active</span>}
            </Link>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#2B2B30]">
            <Link
              href="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-xs text-white"
            >
              <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3" />
              </svg>
              <span>Shopping Cart ({cartCount})</span>
            </Link>

            <div className="flex items-center gap-1.5 bg-[#0A0A0B] p-1 rounded-lg border border-[#2B2B30]">
              <button
                type="button"
                onClick={() => handleLanguageSelect('ID')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  currentLang === 'ID' ? 'bg-white text-zinc-950' : 'text-[#9AA0A8]'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                disabled
                title="Segera tersedia"
                className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8F98] cursor-not-allowed"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}



