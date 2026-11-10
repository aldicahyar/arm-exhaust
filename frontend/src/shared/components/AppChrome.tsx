'use client';

import { usePathname } from 'next/navigation';

/**
 * AppChrome — pembungkus header/footer global.
 * Pada halaman autentikasi (/login) chrome disembunyikan agar pengguna
 * fokus menyelesaikan login/registrasi tanpa distraksi navigasi (UX best practice).
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/login') || pathname?.startsWith('/admin')) return null;
  return <>{children}</>;
}
