'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import { Check, Copy, X, Undo2 } from 'lucide-react';
import { useNotice, formatNoticeTrace } from './NoticeContext';
import type { NoticeItem, NoticeType } from './types';

export interface NoticeTypeBadge {
  readonly label: string;
  readonly dotClass: string;
  readonly chipClass: string;
}

export const NOTICE_TYPE_BADGE_MAP: Record<NoticeType, NoticeTypeBadge> = {
  error: {
    label: 'Error',
    dotClass: 'bg-zinc-300',
    chipClass: 'text-zinc-200 border-zinc-700/60 bg-zinc-800/80',
  },
  success: {
    label: 'Berhasil',
    dotClass: 'bg-zinc-100',
    chipClass: 'text-zinc-100 border-zinc-700/60 bg-zinc-800/80',
  },
  warning: {
    label: 'Peringatan',
    dotClass: 'bg-zinc-300',
    chipClass: 'text-zinc-200 border-zinc-700/60 bg-zinc-800/80',
  },
  info: {
    label: 'Info',
    dotClass: 'bg-zinc-400',
    chipClass: 'text-zinc-300 border-zinc-700/60 bg-zinc-800/80',
  },
};

export function getNoticeTypeBadge(type: NoticeType | string): NoticeTypeBadge {
  if (typeof type === 'string' && Object.hasOwn(NOTICE_TYPE_BADGE_MAP, type)) {
    return NOTICE_TYPE_BADGE_MAP[type as NoticeType];
  }
  return NOTICE_TYPE_BADGE_MAP.info;
}

export interface DynamicIslandNoticeProps {
  readonly className?: string;
}

export function DynamicIslandNotice({ className }: Readonly<DynamicIslandNoticeProps> = {}) {
  const { notices, notify } = useNotice();
  const shouldReduceMotion = useReducedMotion();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  const handleCopyTrace = useCallback((notice: NoticeItem) => {
    if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
      return;
    }
    const traceText = formatNoticeTrace(notice);
    void navigator.clipboard.writeText(traceText)
      .then(() => {
        setCopiedId(notice.id);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedId((current) => (current === notice.id ? null : current));
        }, 1800);
      })
      .catch((err) => {
        console.warn('[DynamicIslandNotice] Failed to copy notice trace to clipboard:', err);
      });
  }, []);

  if (!notices.length) {
    return null;
  }

  const initialMotion = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -24, scale: 0.92, filter: 'blur(4px)' };

  const animateMotion = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' };

  const exitMotion = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -20, scale: 0.94, filter: 'blur(3px)' };

  const transitionMotion: Transition = shouldReduceMotion
    ? { duration: 0.15 }
    : {
        type: 'spring',
        stiffness: 420,
        damping: 28,
        mass: 0.8,
      };

  const baseAsideClass =
    'fixed top-3 sm:top-5 inset-x-0 z-[9999] flex flex-col items-center pointer-events-none px-4 select-none';
  const asideClass = className ? `${baseAsideClass} ${className}` : baseAsideClass;

  return (
    <aside
      aria-live="polite"
      aria-atomic="true"
      className={asideClass}
    >
      <AnimatePresence mode="popLayout">
        {notices.map((notice: NoticeItem) => {
          const badge = getNoticeTypeBadge(notice.type);
          const isCopied = copiedId === notice.id;
          const duration = notice.duration ?? 0;
          const hasDurationBar = duration > 0 && !shouldReduceMotion;

          return (
            <motion.div
              key={notice.id}
              layout
              drag="y"
              dragConstraints={{ top: -80, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y < -25 || info.velocity.y < -200) {
                  notify.dismiss(notice.id);
                }
              }}
              initial={initialMotion}
              animate={animateMotion}
              exit={exitMotion}
              transition={transitionMotion}
              className="pointer-events-auto relative flex flex-col w-auto max-w-[540px] rounded-full border border-zinc-800/90 bg-[#121214]/95 shadow-[0_12px_36px_rgba(0,0,0,0.7)] backdrop-blur-md mb-2 cursor-grab active:cursor-grabbing overflow-hidden px-3.5 py-2 select-none"
              data-trace-id={notice.traceId}
              data-source={notice.source}
              data-detail={notice.detail}
              title={`[#${notice.traceId}] Klik dua kali untuk menyalin trace`}
              onDoubleClick={() => handleCopyTrace(notice)}
            >
              {/* Screen reader only trace audit descriptor */}
              <span className="sr-only">
                [{badge.label}] #{notice.traceId} {notice.source ? `(${notice.source})` : ''} {notice.detail ?? ''}
              </span>

              {/* Minimalist Capsule Row */}
              <div className="flex items-center justify-between gap-3 min-w-0 w-full">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  {/* Subtle Monochrome Status Indicator */}
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800/90 border border-zinc-700/60 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                  </span>

                  {/* Clean Message Line (Title + Sanitized Description) */}
                  <div className="flex items-baseline gap-1.5 min-w-0 truncate text-xs">
                    <span className="font-semibold text-zinc-100 tracking-tight shrink-0">
                      {notice.title}
                    </span>
                    {notice.description && (
                      <span className="text-zinc-400 font-normal truncate">
                        — {notice.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions: Optional Action Button + Subtle 'Tersalin' Feedback + Native Dismiss Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {notice.actionButton && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        notice.actionButton?.onClick();
                        notify.dismiss(notice.id);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-100 hover:text-white px-2.5 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 transition active:scale-[0.97]"
                    >
                      <Undo2 className="w-3 h-3 text-zinc-400" />
                      <span>{notice.actionButton.label}</span>
                    </button>
                  )}

                  {isCopied && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-300 font-medium px-1.5 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/60 animate-in fade-in duration-150">
                      <Check className="w-3 h-3 text-zinc-200" />
                      <span>Tersalin</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => notify.dismiss(notice.id)}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Tutup notifikasi"
                    title="Tutup notifikasi"
                    className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Duration Indicator (Monochrome) */}
              {hasDurationBar && (
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-zinc-800/80 overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: duration / 1000, ease: 'linear' }}
                    style={{ originX: 0 }}
                    className="h-full w-full bg-zinc-400/80"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </aside>
  );
}
