'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { NoticeItem, NoticeType, NoticeContextValue } from './types';

const NoticeContext = createContext<NoticeContextValue | null>(null);

const DEFAULT_DURATION = 4500; // 4.5 seconds

export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    // Clear timer if exists
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
    (type: NoticeType, title: string, description?: string, duration: number = DEFAULT_DURATION): string => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newItem: NoticeItem = { id, type, title, description, duration };

      // In Sonner/Dynamic Island style, show the most recent notice cleanly
      setNotices((prev) => {
        // Filter out identical duplicate titles to prevent spam stacking
        const filtered = prev.filter((n) => n.title !== title);
        return [...filtered, newItem].slice(-2); // Keep max 2 in stack
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const notify = useRef({
    error: (title: string, description?: string, duration?: number) => addNotice('error', title, description, duration),
    success: (title: string, description?: string, duration?: number) => addNotice('success', title, description, duration),
    info: (title: string, description?: string, duration?: number) => addNotice('info', title, description, duration),
    warning: (title: string, description?: string, duration?: number) => addNotice('warning', title, description, duration),
    dismiss,
    clearAll,
  }).current;

  // Always update notify methods with latest closures
  notify.error = (title: string, description?: string, duration?: number) => addNotice('error', title, description, duration);
  notify.success = (title: string, description?: string, duration?: number) => addNotice('success', title, description, duration);
  notify.info = (title: string, description?: string, duration?: number) => addNotice('info', title, description, duration);
  notify.warning = (title: string, description?: string, duration?: number) => addNotice('warning', title, description, duration);
  notify.dismiss = dismiss;
  notify.clearAll = clearAll;

  return (
    <NoticeContext.Provider value={{ notices, notify }}>
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
