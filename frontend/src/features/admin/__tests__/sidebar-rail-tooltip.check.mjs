import assert from 'node:assert';
import fs from 'node:fs';

const code = fs.readFileSync('frontend/src/features/admin/components/ui/Sidebar.tsx', 'utf-8');
assert(code.includes('panel.collapsed && textLabel'), 'Menu button wajib menampilkan tooltip stealth saat collapsed');
console.log('PASS: sidebar-rail-tooltip check passed.');
