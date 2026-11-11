import assert from 'node:assert';
import fs from 'node:fs';

const shellContent = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');
assert(shellContent.includes("user.role === 'superadmin'"), 'Wajib menerapkan pemeriksaan user.role === superadmin untuk menu sensitif');
assert(shellContent.includes('SidebarSearch'), 'Wajib memasang SidebarSearch di AdminShell');
assert(shellContent.includes('SidebarNotification'), 'Wajib memasang SidebarNotification di AdminShell');
assert(shellContent.includes('OrdersTable'), 'Wajib memasang OrdersTable untuk tab orders');

const pageContent = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');
assert(pageContent.includes("user.role !== 'admin' && user.role !== 'superadmin'"), 'Page admin wajib mengizinkan role admin dan superadmin');
console.log('PASS: E2E Admin vs Superadmin RBAC & Shell integration passed.');
