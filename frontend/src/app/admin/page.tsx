import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminShell } from '@/features/admin';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

async function getSessionUser() {
  try {
    const cookie = (await cookies()).toString();
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.user as { name: string; email: string; role: string }) || null;
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/');

  return <AdminShell user={user} />;
}
