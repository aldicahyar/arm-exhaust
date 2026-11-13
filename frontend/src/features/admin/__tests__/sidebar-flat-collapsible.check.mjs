import assert from 'node:assert';
import fs from 'node:fs';

const typesContent = fs.readFileSync('frontend/src/features/admin/types.ts', 'utf-8');
const adminShellContent = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');

// 1. AdminShellTab in types.ts must include 'hero' and 'events'
assert(
  typesContent.includes("'hero'") && typesContent.includes("'events'"),
  'types.ts wajib memperluas AdminShellTab dengan "hero" dan "events"'
);

// 2. No AnimatedSidebarGroupLabel in AdminShell.tsx (flat seamless stream)
assert(
  !adminShellContent.includes('<AnimatedSidebarGroupLabel>'),
  'AdminShell.tsx tidak boleh lagi menggunakan <AnimatedSidebarGroupLabel> (harus flat seamless stream)'
);
assert(
  !adminShellContent.includes('AnimatedSidebarGroupLabel'),
  'AdminShell.tsx tidak boleh mengimpor atau menggunakan AnimatedSidebarGroupLabel'
);

// 3. Operational items flat in AdminShell.tsx
assert(
  adminShellContent.includes("'orders'") &&
  adminShellContent.includes("'customers'") &&
  adminShellContent.includes("'invites'"),
  'AdminShell.tsx wajib mempertahankan 3 item operasional flat (orders, customers, invites)'
);

// 4. Collapsible Konten Web with Submenu
assert(
  adminShellContent.includes('Konten Web'),
  'AdminShell.tsx wajib memuat menu collapsible "Konten Web"'
);
assert(
  adminShellContent.includes('isContentMenuOpen'),
  'AdminShell.tsx wajib memuat state isContentMenuOpen'
);
assert(
  adminShellContent.includes('AnimatedSidebarMenuSub'),
  'AdminShell.tsx wajib menggunakan AnimatedSidebarMenuSub'
);
assert(
  adminShellContent.includes('Hero Carousel') || adminShellContent.includes('Hero'),
  'AdminShell.tsx sub-menu wajib memuat Hero Carousel'
);
assert(
  adminShellContent.includes('Event & Komunitas') || adminShellContent.includes('Event'),
  'AdminShell.tsx sub-menu wajib memuat Event & Komunitas'
);

// 5. Collapsible Konfigurasi Sistem with Submenu (Superadmin only)
assert(
  adminShellContent.includes('Konfigurasi Sistem'),
  'AdminShell.tsx wajib memuat menu collapsible "Konfigurasi Sistem"'
);
assert(
  adminShellContent.includes('isConfigMenuOpen'),
  'AdminShell.tsx wajib memuat state isConfigMenuOpen'
);
assert(
  adminShellContent.includes('Pengaturan Pajak') &&
  adminShellContent.includes('Matriks Diskon') &&
  adminShellContent.includes('Keamanan & RBAC'),
  'AdminShell.tsx sub-menu Konfigurasi Sistem wajib memuat Pajak, Matriks Diskon, dan Keamanan'
);

// 6. ariaExpanded on parent buttons
assert(
  adminShellContent.includes('ariaExpanded={isContentMenuOpen}'),
  'Parent button Konten Web wajib memiliki ariaExpanded={isContentMenuOpen}'
);
assert(
  adminShellContent.includes('ariaExpanded={isConfigMenuOpen}'),
  'Parent button Konfigurasi Sistem wajib memiliki ariaExpanded={isConfigMenuOpen}'
);

// 7. Auto-expand logic for active child tabs
assert(
  adminShellContent.includes("activeTab === 'hero'") && adminShellContent.includes("activeTab === 'events'"),
  'Wajib terdapat auto-expand logic saat activeTab hero atau events aktif'
);
assert(
  adminShellContent.includes("activeTab === 'tax'") &&
  adminShellContent.includes("activeTab === 'policies'") &&
  adminShellContent.includes("activeTab === 'security'"),
  'Wajib terdapat auto-expand logic saat activeTab tax, policies, atau security aktif'
);

// 8. Placeholders for hero & events panels in main workspace canvas
assert(
  adminShellContent.includes('panel-hero') || adminShellContent.includes("activeTab === 'hero'"),
  'AdminShell.tsx wajib menyediakan container/placeholder untuk panel hero'
);
assert(
  adminShellContent.includes('panel-events') || adminShellContent.includes("activeTab === 'events'"),
  'AdminShell.tsx wajib menyediakan container/placeholder untuk panel events'
);

console.log('PASS: sidebar-flat-collapsible check passed.');
