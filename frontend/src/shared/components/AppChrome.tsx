'use client';

import { usePathname } from 'next/navigation';

interface AppChromeProps {
  readonly children: React.ReactNode;
}

/**
 * AppChrome — pembungkus header/footer global.
 * Pada halaman autentikasi (/login) chrome disembunyikan agar pengguna
 * fokus menyelesaikan login/registrasi tanpa distraksi navigasi (UX best practice).
 */
export function AppChrome({ children }: Readonly<AppChromeProps>) {
  const pathname = usePathname();
  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/account')
  ) {
    return null;
  }
  return <>{children}</>;
}
