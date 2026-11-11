import assert from 'node:assert';
import fs from 'node:fs';

const filePath = 'frontend/src/features/admin/components/SidebarNotification.tsx';
assert(fs.existsSync(filePath), `Target component file must exist: ${filePath}`);

const content = fs.readFileSync(filePath, 'utf-8');

// Icon imports
assert(content.includes('Bell'), 'Wajib mengimpor Bell dari lucide-react');
assert(content.includes('Package'), 'Wajib mengimpor Package dari lucide-react');
assert(content.includes('Users'), 'Wajib mengimpor Users dari lucide-react');
assert(content.includes('ShieldAlert'), 'Wajib mengimpor ShieldAlert dari lucide-react');
assert(content.includes('CheckCircle2'), 'Wajib mengimpor CheckCircle2 dari lucide-react');

// Interface and export contracts
assert(content.includes('NotificationItem'), 'Wajib mengekspor atau mendefinisikan NotificationItem interface');
assert(content.includes('SidebarNotificationProps'), 'Wajib mengekspor atau mendefinisikan SidebarNotificationProps interface');
assert(content.includes('export function SidebarNotification'), 'Wajib mengekspor komponen SidebarNotification');

// Core functional requirements
assert(content.includes('isCollapsed'), 'Wajib mendukung prop isCollapsed');
assert(content.includes('notifications'), 'Wajib mendukung daftar notifikasi');
assert(content.includes('onSelectTab'), 'Wajib mendukung callback navigasi tab onSelectTab');
assert(content.includes('Tandai Semua Dibaca') || content.includes('Tandai semua dibaca'), 'Wajib ada aksi Tandai Semua Dibaca');

// Default notification categories and seed items
assert(content.includes('ARM-8821'), 'Wajib memuat sampel pesanan baru ARM-8821');
assert(content.includes('Sentosa Motor'), 'Wajib memuat sampel mitra bengkel');
assert(content.includes('brute-force') || content.includes('OTP'), 'Wajib memuat sampel notifikasi keamanan/sistem');

console.log('PASS: SidebarNotification contract passed.');
