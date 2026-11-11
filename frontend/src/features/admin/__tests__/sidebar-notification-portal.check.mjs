import assert from 'node:assert';
import fs from 'node:fs';

const code = fs.readFileSync('frontend/src/features/admin/components/SidebarNotification.tsx', 'utf-8');
assert(code.includes('createPortal'), 'Wajib menggunakan createPortal untuk slide-over drawer');
assert(code.includes('document.body'), 'Wajib merender portal ke document.body');
assert(code.includes('mounted'), 'Wajib memiliki SSR safety guard mounted');
console.log('PASS: sidebar-notification-portal check passed.');
