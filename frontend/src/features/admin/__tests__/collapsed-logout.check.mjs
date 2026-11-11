import assert from 'node:assert';
import fs from 'node:fs';

const code = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');
assert(code.includes('Keluar'), 'Wajib memiliki label/tooltip Keluar untuk collapsed logout');
assert(code.includes('group-data-[state=collapsed]/sidebar:flex'), 'Footer collapsed wajib memiliki struktur flex vertikal untuk logout');
console.log('PASS: collapsed-logout check passed.');
