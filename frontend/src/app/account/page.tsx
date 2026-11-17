import type { Metadata } from 'next';
import { AccountPortal } from '@/features/account';

export const metadata: Metadata = {
  title: 'Account | ARM Exhaust',
  description: 'Portal Akun Pelanggan ARM Exhaust — Riwayat Fabrikasi & Pengaturan Identitas',
};

export default function AccountPage() {
  return <AccountPortal />;
}
