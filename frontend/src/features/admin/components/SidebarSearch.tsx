'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';

export interface SidebarSearchProps {
  readonly isCollapsed: boolean;
  readonly onOpenCommandPalette: () => void;
  readonly className?: string;
}

/**
 * SidebarSearch - Interactive search bar component for ARM Exhaust Admin Sidebar
 * Morphs seamlessly between a full search pill (expanded) and an icon button (collapsed).
 */
export function SidebarSearch({
  isCollapsed,
  onOpenCommandPalette,
  className,
}: Readonly<SidebarSearchProps>) {
  if (isCollapsed) {
    return (
      <div className={cn('relative flex justify-center w-full px-2 py-1', className)}>
        <motion.button
          type="button"
          onClick={onOpenCommandPalette}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Pencarian (⌘K)"
          aria-label="Pencarian (⌘K)"
          className={cn(
            'group relative flex h-9 w-9 items-center justify-center rounded-lg',
            'border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700',
            'text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-1 focus:ring-zinc-600/50'
          )}
        >
          <Search className="h-4 w-4 transition-colors" />

          {/* Hover Tooltip for Collapsed Rail */}
          <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 hidden rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-200 shadow-xl group-hover:block whitespace-nowrap">
            Pencarian (⌘K)
          </span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className={cn('w-full px-3 py-1', className)}>
      <motion.button
        type="button"
        onClick={onOpenCommandPalette}
        whileTap={{ scale: 0.98 }}
        aria-label="Cari menu atau fitur (⌘K / Ctrl+K)"
        className={cn(
          'group w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left',
          'bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/70 hover:border-zinc-700',
          'text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-xs',
          'focus:outline-none focus:ring-1 focus:ring-zinc-600/50'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0" />
          <span className="text-xs text-zinc-400 group-hover:text-zinc-200 font-normal truncate">
            Cari menu atau fitur...
          </span>
        </div>

        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-zinc-700/60 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-300 shadow-xs shrink-0 group-hover:text-zinc-200 group-hover:border-zinc-600">
          <span>⌘K</span>
        </kbd>
      </motion.button>
    </div>
  );
}
