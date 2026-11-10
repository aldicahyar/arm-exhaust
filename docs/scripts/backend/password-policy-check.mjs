// Unit test murni untuk validatePasswordPolicy — tidak butuh server/DB.
import assert from 'node:assert/strict';
import { validatePasswordPolicy } from '../../prototypes/backend-mjs/auth.mjs';

// Password compliant dari setiap set simbol yang diizinkan
for (const sym of '!@#$%^&*(),.?":{}|<>'.match(/./gu)) {
  assert.equal(validatePasswordPolicy(`Str0ng${sym}Pass`), null, `simbol ${sym} harus diterima`);
}

assert.equal(validatePasswordPolicy('Str0ng!Pass'), null, 'password kuat → null');

// Satu pelanggaran per kasus — pesan harus spesifik per aturan
assert.equal(validatePasswordPolicy('Ab1!'), 'Password must be at least 8 characters.');
assert.equal(validatePasswordPolicy('lower1!aaa'), 'Password must contain an uppercase letter (A-Z).');
assert.equal(validatePasswordPolicy('UPPER1!AAA'), 'Password must contain a lowercase letter (a-z).');
assert.equal(validatePasswordPolicy('NoDigits!!'), 'Password must contain a number (0-9).');
assert.equal(validatePasswordPolicy('NoSpecial11'), 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).');

// '-' dan '_' BUKAN bagian set simbol requirement
assert.equal(validatePasswordPolicy('Dash-Sym_1a'), 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).');

// String kosong ditolak di cek panjang pertama
assert.equal(validatePasswordPolicy(''), 'Password must be at least 8 characters.');

console.log('# OK: password policy self-check passed.');
