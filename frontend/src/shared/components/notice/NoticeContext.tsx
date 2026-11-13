'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import type {
  NoticeItem,
  NoticeType,
  NoticeOptions,
  NoticeActionButton,
  NoticeContextValue,
} from './types';

const NoticeContext = createContext<NoticeContextValue | null>(null);

const DEFAULT_DURATION = 4500; // 4.5 seconds
const STORAGE_KEY = 'arm_admin_notice_traces_v1';
const MAX_HISTORY_ITEMS = 50;

const VALID_NOTICE_TYPES = new Set<NoticeType>(['error', 'success', 'info', 'warning']);

export function isValidNoticeItem(raw: unknown): raw is NoticeItem {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return false;
  }
  const item = raw as Record<string, unknown>;

  const hasValidId = typeof item.id === 'string' && item.id.trim().length > 0;
  const hasValidTraceId = typeof item.traceId === 'string' && item.traceId.trim().length > 0;
  const hasValidTitle = typeof item.title === 'string' && item.title.trim().length > 0;
  const hasValidType = typeof item.type === 'string' && VALID_NOTICE_TYPES.has(item.type as NoticeType);
  const hasValidTimestamp = typeof item.timestamp === 'number' && Number.isFinite(item.timestamp);

  if (!hasValidId || !hasValidTraceId || !hasValidTitle || !hasValidType || !hasValidTimestamp) {
    return false;
  }

  if (item.description !== undefined && typeof item.description !== 'string') {
    return false;
  }
  if (item.duration !== undefined && (typeof item.duration !== 'number' || !Number.isFinite(item.duration))) {
    return false;
  }
  if (item.source !== undefined && typeof item.source !== 'string') {
    return false;
  }
  if (item.action !== undefined && typeof item.action !== 'string') {
    return false;
  }
  if (item.detail !== undefined && typeof item.detail !== 'string') {
    return false;
  }
  if (item.read !== undefined && typeof item.read !== 'boolean') {
    return false;
  }

  return true;
}

export function generateTraceId(): string {
  const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.toUpperCase();
  return `TRC-${seed.slice(-6)}`;
}

const SENSITIVE_ERROR_PATTERNS: readonly RegExp[] = [
  /prisma/i,
  /postgres|pg_|psql/i,
  /select\s+|insert\s+into|update\s+|delete\s+from/i,
  /syntax\s*error/i,
  /econnrefused|econnreset|etimedout/i,
  /at\s+(?:async\s+)?[a-zA-Z0-9_$.]+\s*\(/i, // stack traces
  /node_modules/i,
  /webpack/i,
  /foreign\s*key|unique\s*constraint/i,
  /relation\s+["'].*["']\s+does\s+not\s+exist/i,
  /500\s+internal\s+server\s+error/i,
  /failed\s+to\s+fetch/i,
  /networkerror/i,
  /column\s+["'].*["']\s+of\s+relation/i,
  /unhandled\s*rejection/i,
  /fatal|panic/i,
];

export function sanitizeErrorMessage(rawMessage?: string): string {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.';
  }
  const trimmed = rawMessage.trim();
  if (!trimmed) {
    return 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.';
  }

  for (const pattern of SENSITIVE_ERROR_PATTERNS) {
    if (pattern.test(trimmed)) {
      return 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.';
    }
  }

  return trimmed;
}

export function normalizeNoticeOptions(durationOrOptions?: number | NoticeOptions): {
  duration: number;
  source?: string;
  action?: string;
  detail?: string;
  actionButton?: NoticeActionButton;
} {
  if (typeof durationOrOptions === 'number') {
    return {
      duration: Number.isFinite(durationOrOptions) ? durationOrOptions : DEFAULT_DURATION,
    };
  }

  if (durationOrOptions && typeof durationOrOptions === 'object') {
    let duration = DEFAULT_DURATION;
    if (
      typeof durationOrOptions.duration === 'number' &&
      Number.isFinite(durationOrOptions.duration)
    ) {
      duration = durationOrOptions.duration;
    }
    const result: {
      duration: number;
      source?: string;
      action?: string;
      detail?: string;
      actionButton?: NoticeActionButton;
    } = {
      duration,
      source: durationOrOptions.source,
      action: durationOrOptions.action,
      detail: durationOrOptions.detail,
    };
    if (durationOrOptions.actionButton) {
      result.actionButton = durationOrOptions.actionButton;
    }
    return result;
  }

  return { duration: DEFAULT_DURATION };
}

export function formatNoticeTrace(item: NoticeItem): string {
  let isoTime: string;
  if (typeof item?.timestamp === 'number' && Number.isFinite(item.timestamp)) {
    const d = new Date(item.timestamp);
    if (!Number.isNaN(d.getTime())) {
      isoTime = d.toISOString();
    } else {
      isoTime = new Date().toISOString();
    }
  } else {
    isoTime = new Date().toISOString();
  }

  let safeType = 'INFO';
  if (item && typeof item.type === 'string') {
    safeType = item.type.toUpperCase();
  }

  let safeTraceId = 'UNKNOWN';
  if (item && typeof item.traceId === 'string' && item.traceId.length > 0) {
    safeTraceId = item.traceId;
  }

  let safeTitle = '';
  if (item && typeof item.title === 'string') {
    safeTitle = item.title;
  }

  const lines: string[] = [
    `[${safeTraceId}] [${safeType}] [${isoTime}]`,
    `Title: ${safeTitle}`,
  ];

  if (item?.source) {
    lines.push(`Source: ${item.source}`);
  }
  if (item?.action) {
    lines.push(`Action: ${item.action}`);
  }
  if (item?.description) {
    lines.push(`Description: ${item.description}`);
  }
  if (item?.detail) {
    lines.push(`Detail: ${item.detail}`);
  }

  return lines.join('\n');
}

export function loadStoredHistory(): NoticeItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidNoticeItem).slice(0, MAX_HISTORY_ITEMS);
  } catch (err) {
    console.warn('[NoticeContext] Failed to load stored notice traces from localStorage:', err);
    return [];
  }
}

export function persistHistory(items: NoticeItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const validItems = items.filter(isValidNoticeItem).slice(0, MAX_HISTORY_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems));
  } catch (err) {
    console.warn('[NoticeContext] Failed to persist notice traces to localStorage:', err);
  }
}

interface NoticeProviderProps {
  readonly children: React.ReactNode;
}

export function NoticeProvider({ children }: Readonly<NoticeProviderProps>) {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [history, setHistory] = useState<NoticeItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isHydratedRef = useRef<boolean>(false);

  // Mount hydration: load stored traces, preserving any notices emitted before hydration
  useEffect(() => {
    const stored = loadStoredHistory();
    setHistory((prev) => {
      if (prev.length === 0) {
        return stored;
      }
      const existingIds = new Set(prev.map((item) => item.id));
      const merged = [...prev, ...stored.filter((item) => !existingIds.has(item.id))];
      return merged.slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  // Sync state to localStorage only after hydration has completed
  useEffect(() => {
    if (!isHydratedRef.current) {
      isHydratedRef.current = true;
      return;
    }
    persistHistory(history);
  }, [history]);

  // Cleanup timers on unmount
  useEffect(() => {
    const currentTimers = timersRef.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setNotices([]);
  }, []);

  const addNotice = useCallback(
    (
      type: NoticeType,
      title: string,
      description?: string,
      durationOrOptions?: number | NoticeOptions
    ): string => {
      const traceId = generateTraceId();
      const timestamp = Date.now();
      const id = `${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
      const normalized = normalizeNoticeOptions(durationOrOptions);

      const newItem: NoticeItem = {
        id,
        traceId,
        type,
        title,
        description,
        duration: normalized.duration,
        timestamp,
        source: normalized.source,
        action: normalized.action,
        detail: normalized.detail,
        read: false,
        actionButton: normalized.actionButton,
      };

      // In Sonner/Dynamic Island style, show the most recent notice cleanly (max 2)
      setNotices((prev) => {
        const filtered = prev.filter((n) => n.title !== title);
        return [...filtered, newItem].slice(-2);
      });

      // Maintain persistent client history (newest first, max 50) - side effect handled by useEffect
      setHistory((prev) => {
        return [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      });

      if (normalized.duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, normalized.duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const markAllHistoryRead = useCallback(() => {
    setHistory((prev) => {
      return prev.map((item) => ({ ...item, read: true }));
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const notify = useMemo(
    () => ({
      error: (title: string, description?: string, durationOrOptions?: number | NoticeOptions) => {
        const safeDesc = description ? sanitizeErrorMessage(description) : undefined;
        let options = durationOrOptions;
        if (description && safeDesc !== description) {
          if (typeof options === 'object' && options !== null) {
            if (!options.detail) {
              options = { ...options, detail: description };
            }
          } else if (typeof options === 'number') {
            options = { duration: options, detail: description };
          } else {
            options = { detail: description };
          }
        }
        return addNotice('error', title, safeDesc, options);
      },
      success: (title: string, description?: string, durationOrOptions?: number | NoticeOptions) =>
        addNotice('success', title, description, durationOrOptions),
      info: (title: string, description?: string, durationOrOptions?: number | NoticeOptions) =>
        addNotice('info', title, description, durationOrOptions),
      warning: (title: string, description?: string, durationOrOptions?: number | NoticeOptions) =>
        addNotice('warning', title, description, durationOrOptions),
      dismiss,
      clearAll,
    }),
    [addNotice, dismiss, clearAll]
  );

  const unreadTraceCount = useMemo(() => {
    return history.filter((item) => !item.read).length;
  }, [history]);

  const contextValue = useMemo<NoticeContextValue>(
    () => ({
      notices,
      history,
      unreadTraceCount,
      notify,
      markAllHistoryRead,
      clearHistory,
    }),
    [notices, history, unreadTraceCount, notify, markAllHistoryRead, clearHistory]
  );

  return (
    <NoticeContext.Provider value={contextValue}>
      {children}
    </NoticeContext.Provider>
  );
}

export function useNotice(): NoticeContextValue {
  const context = useContext(NoticeContext);
  if (!context) {
    throw new Error('useNotice must be used within a NoticeProvider');
  }
  return context;
}

export function useOptionalNotice(): NoticeContextValue | null {
  return useContext(NoticeContext);
}
