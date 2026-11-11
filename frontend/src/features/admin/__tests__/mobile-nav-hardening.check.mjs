import assert from 'node:assert';
import fs from 'node:fs';

const sidebarCode = fs.readFileSync('frontend/src/features/admin/components/ui/Sidebar.tsx', 'utf-8');
const shellCode = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');

assert(sidebarCode.includes('Tutup sidebar') || sidebarCode.includes('X className'), 'Mobile sidebar wajib memiliki tombol close eksplisit');
assert(shellCode.includes('max-w-'), 'Breadcrumb title wajib memiliki class max-w- untuk responsive truncation');
console.log('PASS: mobile-nav-hardening check passed.');
