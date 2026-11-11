import assert from 'node:assert';
import fs from 'node:fs';

const css = fs.readFileSync('frontend/src/app/globals.css', 'utf-8');
assert(css.includes('.scrollbar-none'), 'Wajib mendefinisikan kelas .scrollbar-none di globals.css');
assert(css.includes('::-webkit-scrollbar'), 'Wajib mematikan scrollbar untuk Webkit');
assert(css.includes('scrollbar-width: none'), 'Wajib mematikan scrollbar untuk Firefox');
console.log('PASS: scrollbar-none utility contract check passed.');
