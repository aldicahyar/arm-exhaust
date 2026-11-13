'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export type SubmitVisualState = 'idle' | 'saving' | 'success';

export const MODAL_INPUT_CLASS =
  'w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-950 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none transition';

export interface UseModalSubmitOptions {
  readonly isOpen: boolean;
  readonly isUploading?: boolean;
  readonly resetTrigger?: unknown;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.FormEvent) => Promise<boolean>;
}

export interface UseModalSubmitReturn {
  readonly submitState: SubmitVisualState;
  readonly isCloseLocked: boolean;
  readonly handleFormSubmit: (e: React.FormEvent) => Promise<void>;
  readonly shouldReduceMotion: boolean;
}

export function useModalSubmit({
  isOpen,
  isUploading = false,
  resetTrigger,
  onClose,
  onSubmit,
}: Readonly<UseModalSubmitOptions>): UseModalSubmitReturn {
  const [submitState, setSubmitState] = useState<SubmitVisualState>('idle');
  const shouldReduceMotion = Boolean(useReducedMotion());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();
    setSubmitState('idle');
  }, [isOpen, resetTrigger, clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const isCloseLocked = isUploading || submitState === 'saving' || submitState === 'success';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCloseLocked) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCloseLocked, onClose]);

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isCloseLocked) return;

      setSubmitState('saving');
      try {
        const success = await onSubmit(e);
        if (!success) {
          setSubmitState('idle');
          return;
        }

        setSubmitState('success');
        const delay = shouldReduceMotion ? 0 : 500;
        timerRef.current = setTimeout(() => {
          onClose();
          setSubmitState('idle');
        }, delay);
      } catch (err) {
        console.error('Modal form submit failed:', err);
        setSubmitState('idle');
      }
    },
    [isCloseLocked, onSubmit, shouldReduceMotion, onClose]
  );

  return {
    submitState,
    isCloseLocked,
    handleFormSubmit,
    shouldReduceMotion,
  };
}

export interface AdminModalSubmitButtonProps {
  readonly isCloseLocked: boolean;
  readonly submitState: SubmitVisualState;
  readonly idleLabel: string;
  readonly savingLabel?: string;
  readonly savedLabel?: string;
  readonly className?: string;
}

export function AdminModalSubmitButton({
  isCloseLocked,
  submitState,
  idleLabel,
  savingLabel = 'Menyimpan...',
  savedLabel = 'Tersimpan!',
  className,
}: Readonly<AdminModalSubmitButtonProps>) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.button
      type="submit"
      disabled={isCloseLocked}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition shadow-xs disabled:opacity-50 min-w-[110px]',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {submitState === 'saving' && (
          <motion.span
            key="saving"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1.5"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{savingLabel}</span>
          </motion.span>
        )}
        {submitState === 'success' && (
          <motion.span
            key="success"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>{savedLabel}</span>
          </motion.span>
        )}
        {submitState === 'idle' && (
          <motion.span
            key="idle"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {idleLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
