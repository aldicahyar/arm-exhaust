'use client';

import { AuthCard } from '@/features/auth';
import type { AuthMode } from '@/features/auth';

/**
 * Komponen AuthForm (Backward-compatible adapter)
 * Mengalihkan pemanggilan legacy AuthForm ke arsitektur split-card AuthCard baru.
 */
export function AuthForm({ mode = 'login' }: { mode?: AuthMode }) {
  return <AuthCard initialMode={mode} />;
}
