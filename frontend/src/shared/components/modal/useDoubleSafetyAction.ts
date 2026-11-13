'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useConfirm } from './ConfirmContext';
import { useNotice } from '../notice/NoticeContext';
import type { ActionPreset } from './action-presets';

export interface UseDoubleSafetyActionOptions<T> {
  readonly preset: ActionPreset;
  readonly noticeSource: string;
  readonly getItemPreview?: (item: T) => string;
  readonly getItemKey?: (item: T) => string;
  readonly onOptimisticExecute: (item: T) => void;
  readonly onRestore?: (item: T, originalIndex?: number) => void;
  readonly onCommit: (item: T) => Promise<void>;
  readonly undoDuration?: number;
}

export function useDoubleSafetyAction<T>({
  preset,
  noticeSource,
  getItemPreview,
  getItemKey,
  onOptimisticExecute,
  onRestore,
  onCommit,
  undoDuration = 6000,
}: Readonly<UseDoubleSafetyActionOptions<T>>) {
  const confirm = useConfirm();
  const { notify } = useNotice();
  const pendingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Resolve unique string key for item tracking
  const resolveKey = useCallback(
    (item: T): string => {
      if (getItemKey) return getItemKey(item);
      if (item && typeof item === 'object' && 'id' in item && typeof (item as any).id === 'string') {
        return (item as any).id;
      }
      return String(item);
    },
    [getItemKey]
  );

  // Cleanup all pending timers on unmount
  useEffect(() => {
    const timers = pendingTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const isPending = useCallback(
    (idOrItem: string | T): boolean => {
      const key = typeof idOrItem === 'string' ? idOrItem : resolveKey(idOrItem);
      return pendingTimersRef.current.has(key);
    },
    [resolveKey]
  );

  const executeAction = useCallback(
    async (item: T, originalIndex?: number): Promise<void> => {
      const key = resolveKey(item);
      const preview = getItemPreview ? getItemPreview(item) : undefined;

      // Mode 3: confirm_only (Modal confirmation, immediate commit without undo toast)
      if (preset.mode === 'confirm_only') {
        const ok = await confirm({
          title: preset.title ?? 'Konfirmasi Tindakan',
          description: preset.description ?? 'Apakah Anda yakin ingin melanjutkan?',
          confirmText: preset.confirmText,
          cancelText: preset.cancelText,
          variant: preset.variant ?? 'default',
          itemPreview: preview,
        });
        if (!ok) return;

        try {
          await onCommit(item);
          notify.success(preset.successNoticeTitle ?? 'Berhasil', preview, {
            source: noticeSource,
            action: 'commit',
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server.';
          notify.error('Gagal', msg, {
            source: noticeSource,
            action: 'error',
            detail: msg,
          });
        }
        return;
      }

      // Mode 1: confirm_and_undo (Requires modal approval first)
      if (preset.mode === 'confirm_and_undo') {
        const ok = await confirm({
          title: preset.title ?? 'Konfirmasi Tindakan',
          description: preset.description ?? 'Apakah Anda yakin ingin melanjutkan?',
          confirmText: preset.confirmText,
          cancelText: preset.cancelText,
          variant: preset.variant ?? 'danger',
          itemPreview: preview,
        });
        if (!ok) return;
      }

      // Common flow for confirm_and_undo & direct_undo:
      // 1. Optimistic update
      onOptimisticExecute(item);

      // 2. Schedule commit with delayed timer
      let isUndone = false;
      const timeoutId = setTimeout(async () => {
        pendingTimersRef.current.delete(key);
        if (isUndone) return;

        try {
          await onCommit(item);
        } catch (err: unknown) {
          // Rollback on commit failure
          if (onRestore) {
            onRestore(item, originalIndex);
          }
          const msg = err instanceof Error ? err.message : 'Gagal memproses tindakan di server.';
          notify.error('Gagal Memproses', `${msg} Data dipulihkan.`, {
            source: noticeSource,
            action: 'rollback',
            detail: msg,
          });
        }
      }, undoDuration);

      pendingTimersRef.current.set(key, timeoutId);

      // 3. Trigger toast with interactive [Urungkan] button
      notify.info(
        preset.successNoticeTitle ?? 'Tindakan Berhasil',
        preview ? `"${preview}" telah diproses.` : undefined,
        {
          duration: undoDuration,
          source: noticeSource,
          action: 'optimistic',
          detail: `ID: ${key}`,
          actionButton: {
            label: 'Urungkan',
            onClick: () => {
              isUndone = true;
              const activeTimer = pendingTimersRef.current.get(key);
              if (activeTimer) {
                clearTimeout(activeTimer);
                pendingTimersRef.current.delete(key);
              }
              if (onRestore) {
                onRestore(item, originalIndex);
              }
              notify.success(
                preset.undoNoticeTitle ?? 'Pemulihan Berhasil',
                preview ? `"${preview}" telah dikembalikan.` : undefined,
                {
                  source: noticeSource,
                  action: 'undo',
                }
              );
            },
          },
        }
      );
    },
    [
      confirm,
      notify,
      preset,
      noticeSource,
      getItemPreview,
      resolveKey,
      onOptimisticExecute,
      onRestore,
      onCommit,
      undoDuration,
    ]
  );

  return {
    executeAction,
    isPending,
  };
}
