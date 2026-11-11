import assert from 'node:assert';
import fs from 'node:fs';

const shell = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');
assert(shell.includes('data-lenis-prevent'), 'Wajib menyertakan data-lenis-prevent untuk mencegah interupsi Lenis');
assert(shell.includes('scrollbar-none'), 'Container scroll admin wajib menggunakan scrollbar-none');
assert(shell.includes('overscroll-y-contain'), 'Container wajib menggunakan overscroll-y-contain');
console.log('PASS: Scroll isolation check passed.');
