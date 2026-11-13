'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  Package,
  Users,
  ShieldAlert,
  CheckCircle2,
  X,
  ChevronRight,
  Inbox,
  Activity,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { formatNoticeTrace } from '@/shared/components/notice/NoticeContext';
import type { NoticeItem, NoticeType } from '@/shared/components/notice/types';

export interface NotificationItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly time: string;
  readonly category: 'order' | 'partner' | 'security' | 'trace';
  readonly unread?: boolean;
  readonly targetTab?: string;
  readonly traceId?: string;
  readonly noticeType?: NoticeType;
  readonly source?: string;
  readonly action?: string;
  readonly detail?: string;
  readonly timestamp?: number;
}

export interface SidebarNotificationProps {
  readonly isCollapsed: boolean;
  readonly userRole?: string;
  readonly notifications?: readonly NotificationItem[];
  readonly onSelectTab?: (tab: string) => void;
  readonly onMarkAllRead?: () => void;
  readonly onClearTraces?: () => void;
  readonly className?: string;
}

export interface TraceStatusMeta {
  readonly label: string;
  readonly badgeClass: string;
  readonly dotClass: string;
}

const TRACE_STATUS_META_MAP: Record<NoticeType, TraceStatusMeta> = {
  success: {
    label: 'Berhasil',
    badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    dotClass: 'bg-emerald-400',
  },
  error: {
    label: 'Error',
    badgeClass: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
    dotClass: 'bg-rose-400',
  },
  warning: {
    label: 'Peringatan',
    badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    dotClass: 'bg-amber-400',
  },
  info: {
    label: 'Info',
    badgeClass: 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300',
    dotClass: 'bg-zinc-400',
  },
};

export function getTraceStatusMeta(noticeType?: NoticeType | string): TraceStatusMeta {
  if (!noticeType) {
    return TRACE_STATUS_META_MAP.info;
  }
  return TRACE_STATUS_META_MAP[noticeType as NoticeType] ?? TRACE_STATUS_META_MAP.info;
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
  {
    id: 'notif-4',
    title: 'Pembayaran Diterima',
    description: '#ARM-8819 — Pembayaran Midtrans QRIS Rp 4.250.000 sukses diverifikasi',
    time: '2 jam lalu',
    category: 'order',
    unread: true,
    targetTab: 'orders',
  },
  {
    id: 'notif-5',
    title: 'Verifikasi Berkas Mitra',
    description: 'CV Berkah Knalpot mengunggah SIUP & NPWP untuk pengajuan tier Distributor',
    time: '3 jam lalu',
    category: 'partner',
    unread: true,
    targetTab: 'customers',
  },
  {
    id: 'notif-6',
    title: 'Peringatan Stok Sistem',
    description: 'Sisa stok Silencer Titanium Ninja 250 tersisa 2 unit di gudang pusat',
    time: '5 jam lalu',
    category: 'security',
    unread: true,
    targetTab: 'products',
  },
  {
    id: 'notif-7',
    title: 'Pesanan Telah Dikirim',
    description: '#ARM-8805 — Resi JNE Trucking JNE9928192 telah aktif dan dikirim ke Surabaya',
    time: '8 jam lalu',
    category: 'order',
    unread: false,
    targetTab: 'orders',
  },
  {
    id: 'notif-8',
    title: 'Aktivitas Login Baru',
    description: 'Sesi superadmin terdeteksi dari IP 180.252.112.4 (Surabaya, ID)',
    time: '12 jam lalu',
    category: 'security',
    unread: false,
    targetTab: 'security',
  },
  {
    id: 'notif-9',
    title: 'Pengajuan Diskon Kemitraan',
    description: 'Mitra Sentosa Jaya mengajukan kuota diskon tambahan 5% untuk pembelian 10 unit',
    time: '1 hari lalu',
    category: 'partner',
    unread: false,
    targetTab: 'discounts',
  },
  {
    id: 'notif-10',
    title: 'Backup Database Otomatis',
    description: 'Snapshot database PostgreSQL (transaction & master) berhasil diarsipkan ke S3',
    time: '1 hari lalu',
    category: 'security',
    unread: false,
    targetTab: 'security',
  },
];

type FilterCategory = 'all' | 'trace' | 'order' | 'partner' | 'security';

const FILTER_TABS: readonly { readonly key: FilterCategory; readonly label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'trace', label: 'Jejak Aksi' },
  { key: 'order', label: 'Pesanan' },
  { key: 'partner', label: 'Kemitraan' },
  { key: 'security', label: 'Sistem' },
];

function getCategoryConfig(category: NotificationItem['category']) {
  switch (category) {
    case 'trace':
      return {
        label: 'Jejak Aksi',
        icon: <Activity className="h-3 w-3 text-zinc-300" />,
        badgeBg: 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300',
      };
    case 'order':
      return {
        label: 'Pesanan',
        icon: <Package className="h-3 w-3 text-zinc-300" />,
        badgeBg: 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300',
      };
    case 'partner':
      return {
        label: 'Kemitraan',
        icon: <Users className="h-3 w-3 text-zinc-300" />,
        badgeBg: 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300',
      };
    case 'security':
      return {
        label: 'Sistem',
        icon: <ShieldAlert className="h-3 w-3 text-zinc-300" />,
        badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
      };
    default:
      return {
        label: 'Umum',
        icon: <Bell className="h-3 w-3 text-zinc-400" />,
        badgeBg: 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300',
      };
  }
}

function buildTracePayload(item: NotificationItem): NoticeItem {
  const safeTimestamp =
    typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)
      ? item.timestamp
      : Date.now();

  return {
    id: item.id,
    traceId: item.traceId ?? '',
    type: item.noticeType ?? 'info',
    title: item.title,
    description: item.description || undefined,
    timestamp: safeTimestamp,
    source: item.source,
    action: item.action,
    detail: item.detail,
    read: !item.unread,
  };
}

function isItemVisibleForRole(item: NotificationItem, userRole?: string): boolean {
  if (userRole === 'superadmin') {
    return true;
  }
  return (
    item.targetTab !== 'security' &&
    item.targetTab !== 'tax' &&
    item.targetTab !== 'policies'
  );
}

function useEscapeToClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}

function useTraceClipboard() {
  const [copiedTraceId, setCopiedTraceId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  const copyTrace = useCallback(async (item: NotificationItem) => {
    if (!item.traceId) {
      return;
    }
    const traceText = formatNoticeTrace(buildTracePayload(item));
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      console.warn('[SidebarNotification] Clipboard API unavailable for copying trace');
      return;
    }

    try {
      await navigator.clipboard.writeText(traceText);
      setCopiedTraceId(item.id);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedTraceId((current) => (current === item.id ? null : current));
      }, 1800);
    } catch (err) {
      console.warn('[SidebarNotification] Failed to copy notice trace to clipboard:', err);
    }
  }, []);

  return { copiedTraceId, copyTrace };
}

function useNotificationItems(
  initialNotifications: readonly NotificationItem[] | undefined,
  onMarkAllRead?: () => void,
  onClearTraces?: () => void
) {
  const locallyReadIdsRef = useRef<Set<string>>(new Set());
  const [items, setItems] = useState<readonly NotificationItem[]>(() =>
    initialNotifications && initialNotifications.length > 0
      ? initialNotifications
      : DEFAULT_ADMIN_NOTIFICATIONS
  );

  useEffect(() => {
    if (!initialNotifications) {
      return;
    }
    const sourceList =
      initialNotifications.length > 0 ? initialNotifications : DEFAULT_ADMIN_NOTIFICATIONS;
    setItems(
      sourceList.map((item) =>
        locallyReadIdsRef.current.has(item.id) ? { ...item, unread: false } : item
      )
    );
  }, [initialNotifications]);

  const markAllRead = useCallback(() => {
    setItems((prev) => {
      prev.forEach((item) => locallyReadIdsRef.current.add(item.id));
      return prev.map((item) => ({ ...item, unread: false }));
    });
    onMarkAllRead?.();
  }, [onMarkAllRead]);

  const clearTraces = useCallback(() => {
    setItems((prev) => {
      prev.forEach((item) => {
        if (item.category === 'trace') {
          locallyReadIdsRef.current.delete(item.id);
        }
      });
      return prev.filter((item) => item.category !== 'trace');
    });
    onClearTraces?.();
  }, [onClearTraces]);

  const markItemRead = useCallback((id: string) => {
    locallyReadIdsRef.current.add(id);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  }, []);

  return { items, markAllRead, clearTraces, markItemRead };
}

interface TraceCopyButtonProps {
  readonly traceId: string;
  readonly isCopied: boolean;
  readonly onCopy: () => void;
}

function TraceCopyButton({ traceId, isCopied, onCopy }: Readonly<TraceCopyButtonProps>) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCopy();
      }}
      aria-label={`Salin trace ${traceId}`}
      title="Salin Trace ID dan detail"
      className="pointer-events-auto relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/80"
    >
      {isCopied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400">Tersalin</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Salin Trace</span>
        </>
      )}
    </button>
  );
}

interface TraceMetadataChipsProps {
  readonly traceId?: string;
  readonly source?: string;
}

function TraceMetadataChips({ traceId, source }: Readonly<TraceMetadataChipsProps>) {
  if (!traceId) {
    return null;
  }
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center font-mono text-[10px] text-zinc-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
        #{traceId}
      </span>
      {source && (
        <span className="inline-flex items-center text-[10px] text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 px-1.5 py-0.5 rounded truncate max-w-[180px]">
          {source}
        </span>
      )}
    </div>
  );
}

interface NotificationRowHeaderProps {
  readonly item: NotificationItem;
  readonly isCopied: boolean;
  readonly onCopyTrace: (item: NotificationItem) => void;
}

function NotificationRowHeader({
  item,
  isCopied,
  onCopyTrace,
}: Readonly<NotificationRowHeaderProps>) {
  const cfg = getCategoryConfig(item.category);
  const traceMeta = item.traceId ? getTraceStatusMeta(item.noticeType) : null;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase border',
            cfg.badgeBg
          )}
        >
          {cfg.icon}
          <span>{cfg.label}</span>
        </span>
        {traceMeta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border',
              traceMeta.badgeClass
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', traceMeta.dotClass)} />
            <span>{traceMeta.label}</span>
          </span>
        )}
        <span className="text-[11px] text-zinc-500 font-mono">
          {item.time}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {item.traceId && (
          <TraceCopyButton
            traceId={item.traceId}
            isCopied={isCopied}
            onCopy={() => onCopyTrace(item)}
          />
        )}
        {item.unread && (
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
        )}
      </div>
    </div>
  );
}

interface NotificationRowBodyProps {
  readonly item: NotificationItem;
}

function NotificationRowBody({ item }: Readonly<NotificationRowBodyProps>) {
  return (
    <div>
      <h3
        className={cn(
          'text-xs transition-colors',
          item.unread
            ? 'font-medium text-zinc-100 group-hover:text-white'
            : 'font-normal text-zinc-300 group-hover:text-zinc-100'
        )}
      >
        {item.title}
      </h3>
      {item.description && (
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
          {item.description}
        </p>
      )}
      {item.detail && (
        <div className="mt-1.5 p-1.5 rounded bg-black/40 border border-zinc-800/80 font-mono text-[10px] text-zinc-400 break-all leading-tight">
          {item.detail}
        </div>
      )}
    </div>
  );
}

interface NotificationRowProps {
  readonly item: NotificationItem;
  readonly isCopied: boolean;
  readonly shouldReduceMotion: boolean;
  readonly onSelect: (item: NotificationItem) => void;
  readonly onCopyTrace: (item: NotificationItem) => void;
}

function NotificationRow({
  item,
  isCopied,
  shouldReduceMotion,
  onSelect,
  onCopyTrace,
}: Readonly<NotificationRowProps>) {
  const rowLabel = item.targetTab
    ? `${item.title} — Buka modul ${item.targetTab}`
    : item.title;

  return (
    <motion.div
      layout={!shouldReduceMotion}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
      className={cn(
        'group relative flex flex-col gap-2 p-3 rounded-xl border transition-all text-left',
        item.unread
          ? 'bg-zinc-900/60 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/80 shadow-xs'
          : 'bg-zinc-950/30 border-zinc-900/60 opacity-75 hover:opacity-100 hover:bg-zinc-900/40 hover:border-zinc-800 text-zinc-400'
      )}
    >
      {/* Native full-card action button (avoids <div onClick> and button-in-button nesting) */}
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-label={rowLabel}
        className="absolute inset-0 z-0 rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/80"
      />

      <div className="relative z-10 pointer-events-none flex flex-col gap-2">
        <NotificationRowHeader
          item={item}
          isCopied={isCopied}
          onCopyTrace={onCopyTrace}
        />

        <TraceMetadataChips traceId={item.traceId} source={item.source} />

        <NotificationRowBody item={item} />

        {item.targetTab && (
          <div className="flex items-center justify-between pt-1 border-t border-zinc-900/80 mt-0.5">
            <span className="text-[11px] text-zinc-500 font-mono">
              Buka modul:{' '}
              <span className="text-zinc-300 group-hover:text-white font-medium transition-colors">
                {item.targetTab}
              </span>
            </span>
            <span className="inline-flex items-center text-xs text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all">
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface NotificationTriggerButtonProps {
  readonly isCollapsed: boolean;
  readonly isOpen: boolean;
  readonly unreadCount: number;
  readonly shouldReduceMotion: boolean;
  readonly className?: string;
  readonly onOpen: () => void;
}

function NotificationTriggerButton({
  isCollapsed,
  isOpen,
  unreadCount,
  shouldReduceMotion,
  className,
  onOpen,
}: Readonly<NotificationTriggerButtonProps>) {
  if (isCollapsed) {
    return (
      <div className={cn('relative flex justify-center w-full px-2 py-1', className)}>
        <motion.button
          type="button"
          onClick={onOpen}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
          title="Notifikasi"
          aria-label="Pusat Notifikasi"
          className={cn(
            'group relative flex h-9 w-9 items-center justify-center rounded-lg',
            'border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700',
            'text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-1 focus:ring-zinc-600/50',
            isOpen && 'border-zinc-700 bg-zinc-800 text-zinc-100'
          )}
        >
          <Bell className="h-4 w-4 transition-colors" />

          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              {!shouldReduceMotion && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-60" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-300 ring-1 ring-zinc-950" />
            </span>
          )}

          <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 hidden rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-200 shadow-xl group-hover:block whitespace-nowrap">
            Notifikasi {unreadCount > 0 ? `(${unreadCount})` : ''}
          </span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className={cn('w-full px-3 py-1', className)}>
      <motion.button
        type="button"
        onClick={onOpen}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        aria-label="Notifikasi & Order Masuk"
        className={cn(
          'group w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left',
          'bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/70 hover:border-zinc-700',
          'text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-xs',
          'focus:outline-none focus:ring-1 focus:ring-zinc-600/50',
          isOpen && 'border-zinc-700 bg-zinc-800/90 text-zinc-100'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <Bell className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-zinc-300" />
            )}
          </div>
          <span className="text-xs text-zinc-400 group-hover:text-zinc-200 font-normal truncate">
            Notifikasi & Order Masuk
          </span>
        </div>

        {unreadCount > 0 ? (
          <span className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60 shrink-0">
            {unreadCount}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 shrink-0">
            0
          </span>
        )}
      </motion.button>
    </div>
  );
}

interface NotificationDrawerHeaderProps {
  readonly unreadCount: number;
  readonly hasTraceItems: boolean;
  readonly showClearTraces: boolean;
  readonly onClearTraces: () => void;
  readonly onMarkAllRead: () => void;
  readonly onClose: () => void;
}

function NotificationDrawerHeader({
  unreadCount,
  hasTraceItems,
  showClearTraces,
  onClearTraces,
  onMarkAllRead,
  onClose,
}: Readonly<NotificationDrawerHeaderProps>) {
  return (
    <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-zinc-800/60 bg-zinc-950/80">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
          <Bell className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight truncate">
              Pusat Notifikasi
            </h2>
            {unreadCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/70 shrink-0">
                {unreadCount} baru
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500 font-mono shrink-0">
                Terbaca semua
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
        {showClearTraces && hasTraceItems && (
          <button
            type="button"
            onClick={onClearTraces}
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-rose-300 hover:bg-zinc-900 px-2 py-1 rounded-md transition-colors font-medium cursor-pointer"
            title="Bersihkan Jejak"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Bersihkan Jejak</span>
          </button>
        )}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 px-2 py-1 rounded-md transition-colors font-medium cursor-pointer"
            title="Tandai Semua Dibaca"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" />
            <span>Tandai Semua Dibaca</span>
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 hover:border-zinc-700 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface NotificationFilterBarProps {
  readonly activeFilter: FilterCategory;
  readonly shouldReduceMotion: boolean;
  readonly onSelectFilter: (category: FilterCategory) => void;
}

function NotificationFilterBar({
  activeFilter,
  shouldReduceMotion,
  onSelectFilter,
}: Readonly<NotificationFilterBarProps>) {
  const pillTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : { type: 'spring' as const, bounce: 0.15, duration: 0.35 };

  return (
    <div className="px-5 py-2.5 border-b border-zinc-800/40 bg-zinc-950">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1 rounded-lg bg-zinc-900/70 border border-zinc-800/80">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectFilter(tab.key)}
              className={cn(
                'relative flex-1 shrink-0 px-2.5 py-1.5 text-xs font-medium text-center whitespace-nowrap transition-colors rounded-md cursor-pointer select-none',
                isActive ? 'text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFilterPill"
                  transition={pillTransition}
                  className="absolute inset-0 bg-zinc-800 rounded-md shadow-xs border border-zinc-700/50"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface NotificationDrawerProps {
  readonly shouldReduceMotion: boolean;
  readonly unreadCount: number;
  readonly hasTraceItems: boolean;
  readonly showClearTraces: boolean;
  readonly activeFilter: FilterCategory;
  readonly filteredItems: readonly NotificationItem[];
  readonly copiedTraceId: string | null;
  readonly onSelectFilter: (category: FilterCategory) => void;
  readonly onClearTraces: () => void;
  readonly onMarkAllRead: () => void;
  readonly onClose: () => void;
  readonly onSelectItem: (item: NotificationItem) => void;
  readonly onCopyTrace: (item: NotificationItem) => void;
}

function NotificationDrawer({
  shouldReduceMotion,
  unreadCount,
  hasTraceItems,
  showClearTraces,
  activeFilter,
  filteredItems,
  copiedTraceId,
  onSelectFilter,
  onClearTraces,
  onMarkAllRead,
  onClose,
  onSelectItem,
  onCopyTrace,
}: Readonly<NotificationDrawerProps>) {
  const drawerTransition = shouldReduceMotion
    ? { duration: 0.12 }
    : { type: 'spring' as const, damping: 30, stiffness: 320 };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex pointer-events-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          aria-hidden="true"
        />

        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { x: '-100%', opacity: 0.5 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { x: '-100%', opacity: 0 }}
          transition={drawerTransition}
          role="dialog"
          aria-modal="true"
          aria-label="Pusat Notifikasi dan Aktivitas"
          className={cn(
            'relative z-10 flex flex-col w-full max-w-md sm:max-w-lg h-full',
            'bg-zinc-950/95 border-r border-zinc-850/80 shadow-2xl backdrop-blur-md text-zinc-100'
          )}
        >
          <NotificationDrawerHeader
            unreadCount={unreadCount}
            hasTraceItems={hasTraceItems}
            showClearTraces={showClearTraces}
            onClearTraces={onClearTraces}
            onMarkAllRead={onMarkAllRead}
            onClose={onClose}
          />

          <NotificationFilterBar
            activeFilter={activeFilter}
            shouldReduceMotion={shouldReduceMotion}
            onSelectFilter={onSelectFilter}
          />

          <div
            data-lenis-prevent="true"
            className="flex-1 overflow-y-auto overscroll-y-contain scrollbar-none px-5 py-4 space-y-2.5"
          >
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-2.5">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-zinc-300">
                  Tidak ada notifikasi
                </p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                  Tidak ada aktivitas baru dalam kategori ini saat ini.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredItems.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    isCopied={copiedTraceId === item.id}
                    shouldReduceMotion={shouldReduceMotion}
                    onSelect={onSelectItem}
                    onCopyTrace={onCopyTrace}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60 bg-zinc-950/80 text-[11px] text-zinc-500 font-mono">
            <span>ARM Notification Engine</span>
            <span className="text-zinc-500">Esc untuk menutup</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

/**
 * SidebarNotification - Flyout Drawer / Notification Center for ARM Exhaust Admin Sidebar
 * Stealth Luxe styling with live unread counter, interactive category filters, and tab navigation.
 */
export function SidebarNotification({
  isCollapsed,
  userRole,
  notifications: initialNotifications,
  onSelectTab,
  onMarkAllRead,
  onClearTraces,
  className,
}: Readonly<SidebarNotificationProps>) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const openDrawer = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEscapeToClose(isOpen, closeDrawer);
  const { copiedTraceId, copyTrace } = useTraceClipboard();
  const { items, markAllRead, clearTraces, markItemRead } = useNotificationItems(
    initialNotifications,
    onMarkAllRead,
    onClearTraces
  );

  const roleFilteredItems = useMemo(
    () => items.filter((item) => isItemVisibleForRole(item, userRole)),
    [items, userRole]
  );

  const unreadCount = useMemo(
    () => roleFilteredItems.filter((item) => item.unread).length,
    [roleFilteredItems]
  );

  const hasTraceItems = useMemo(
    () => roleFilteredItems.some((item) => item.category === 'trace'),
    [roleFilteredItems]
  );

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') {
      return roleFilteredItems;
    }
    return roleFilteredItems.filter((item) => item.category === activeFilter);
  }, [roleFilteredItems, activeFilter]);

  const handleSelectItem = useCallback(
    (item: NotificationItem) => {
      markItemRead(item.id);
      if (item.targetTab && onSelectTab) {
        onSelectTab(item.targetTab);
        setIsOpen(false);
      }
    },
    [markItemRead, onSelectTab]
  );

  const handleCopyTrace = useCallback(
    (item: NotificationItem) => {
      void copyTrace(item);
    },
    [copyTrace]
  );

  return (
    <>
      <NotificationTriggerButton
        isCollapsed={isCollapsed}
        isOpen={isOpen}
        unreadCount={unreadCount}
        shouldReduceMotion={shouldReduceMotion}
        className={className}
        onOpen={openDrawer}
      />

      {mounted && isOpen && (
        <NotificationDrawer
          shouldReduceMotion={shouldReduceMotion}
          unreadCount={unreadCount}
          hasTraceItems={hasTraceItems}
          showClearTraces={Boolean(onClearTraces)}
          activeFilter={activeFilter}
          filteredItems={filteredItems}
          copiedTraceId={copiedTraceId}
          onSelectFilter={setActiveFilter}
          onClearTraces={clearTraces}
          onMarkAllRead={markAllRead}
          onClose={closeDrawer}
          onSelectItem={handleSelectItem}
          onCopyTrace={handleCopyTrace}
        />
      )}
    </>
  );
}
