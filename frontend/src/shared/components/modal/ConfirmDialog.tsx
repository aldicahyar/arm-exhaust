'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Trash2, AlertTriangle, HelpCircle } from 'lucide-react';
import type { ConfirmDialogOptions } from './types';

export interface ConfirmDialogProps {
  readonly isOpen: boolean;
  readonly options: ConfirmDialogOptions | null;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  options,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDialogProps>) {
  const shouldReduceMotion = useReducedMotion();

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !options) {
    return null;
  }

  const confirmText = options.confirmText ?? 'Konfirmasi';
  const cancelText = options.cancelText ?? 'Batal';
  const variant = options.variant ?? 'danger';

  let IconComponent = Trash2;
  if (variant === 'warning') {
    IconComponent = AlertTriangle;
  } else if (variant === 'default') {
    IconComponent = HelpCircle;
  }

  const backdropVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  const dialogVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, scale: 0.95, y: 8 },
        visible: { opacity: 1, scale: 1, y: 0 },
      };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.button
          type="button"
          tabIndex={-1}
          aria-label="Tutup dialog"
          onClick={onCancel}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.15 }}
          className="fixed inset-0 w-full h-full bg-zinc-950/45 backdrop-blur-xs transition-opacity cursor-default"
        />

        {/* Dialog Box */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          variants={dialogVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative flex flex-col w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 text-zinc-950 shadow-2xl z-10"
        >
          {/* Header Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200/80 mb-3 text-zinc-900 shrink-0">
            <IconComponent className="w-4 h-4 text-zinc-900" aria-hidden="true" />
          </div>

          {/* Title & Description */}
          <h3 id="confirm-dialog-title" className="text-sm font-semibold text-zinc-950">
            {options.title}
          </h3>
          <p id="confirm-dialog-desc" className="text-xs text-zinc-500 mt-1 leading-relaxed">
            {options.description}
          </p>

          {/* Optional Monospace Item Preview Box */}
          {options.itemPreview && (
            <div className="mt-3.5 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200/70 text-[11px] font-mono text-zinc-800 truncate select-all">
              {options.itemPreview}
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#141416] hover:bg-zinc-800 rounded-lg transition shadow-xs active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
