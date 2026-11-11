import assert from 'node:assert';
import fs from 'node:fs';

const shell = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');
assert(shell.includes('isScrolled'), 'Wajib memiliki state isScrolled untuk dynamic header elevation');
assert(shell.includes('backdrop-blur'), 'Topbar wajib memiliki efek backdrop-blur saat di-scroll');
console.log('PASS: Header elevation contract passed.');
