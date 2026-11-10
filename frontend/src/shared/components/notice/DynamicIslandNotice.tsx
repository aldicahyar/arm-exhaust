'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotice } from './NoticeContext';
import type { NoticeItem } from './types';

export function DynamicIslandNotice() {
  const { notices, notify } = useNotice();

  if (!notices.length) return null;

  return (
    <aside
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-3 sm:top-5 inset-x-0 z-[9999] flex flex-col items-center pointer-events-none px-4 select-none"
    >
      <AnimatePresence mode="popLayout">
        {notices.map((notice: NoticeItem) => (
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
            initial={{ opacity: 0, y: -24, scale: 0.92, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 0.94, filter: 'blur(3px)' }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 28,
              mass: 0.8,
            }}
            className="pointer-events-auto relative flex items-center justify-between gap-3 w-full max-w-[420px] rounded-full sm:rounded-2xl border border-[#2B2B32] bg-[#121214]/95 px-4 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.7)] backdrop-blur-md mb-2 cursor-grab active:cursor-grabbing"
          >
            {/* Status Glyph & Content */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Discrete telemetry micro-dot */}
              <div className="flex-shrink-0 flex items-center justify-center">
                {notice.type === 'error' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E81828] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E81828]" />
                  </span>
                )}
                {notice.type === 'success' && (
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
                  </span>
                )}
                {(notice.type === 'info' || notice.type === 'warning') && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9AA0A8]" />
                )}
              </div>

              {/* Textual Payload */}
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[12px] sm:text-[13px] font-semibold text-white tracking-wide leading-snug break-words">
                  {notice.title}
                </span>
                {notice.description && (
                  <span className="text-[11px] text-[#9AA0A8] leading-relaxed mt-0.5 break-words">
                    {notice.description}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Dismiss Button */}
            <button
              type="button"
              onClick={() => notify.dismiss(notice.id)}
              aria-label="Dismiss notification"
              className="flex-shrink-0 p-1 text-[#71717A] hover:text-white transition-colors rounded-full focus:outline-none"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </aside>
  );
}
