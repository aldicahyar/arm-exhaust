# Kebijakan Password Ketat + Konfirmasi Password + Strength Bar — Implementation Plan

> **Status:** SELESAI (Completed) — Diimplementasikan & Lolos Verifikasi per 2026-11-05

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menguatkan alur registrasi email/password dengan kebijakan password ketat (min 8 karakter, wajib huruf besar, huruf kecil, angka, dan simbol dari set `!@#$%^&*(),.?":{}|<>`), field konfirmasi password dengan pengecekan real-time, dan password strength bar visual (lemah/sedang/kuat) — tervalidasi di klien DAN server.

**Architecture:** Aturan kebijakan diduplikasi minimal di dua tempat (fungsi murni `validatePasswordPolicy` di `backend/src/auth.mjs` dan di `frontend/src/components/auth/useAuthForm.ts`) mengikuti pola duplikasi `isValidEmail` yang sudah ada — dua codebase terpisah, tanpa shared package. Strength meter adalah fungsi murni `getPasswordStrength` + komponen presentasi `PasswordStrength.tsx`. Login TIDAK menerapkan kebijakan (user lama boleh punya password non-compliant); kebijakan hanya berlaku saat register.

**Tech Stack:** Node.js murni (`node:http`, `node:crypto`), PostgreSQL `pg`, Next.js 16 + React 19 + Tailwind, assert-based self-check scripts (tanpa framework test).

---

## File Structure

| Aksi | File | Tanggung Jawab |
|---|---|---|
| Create | `backend/scripts/password-policy-check.mjs` | Unit test murni kebijakan password (tanpa server) |
| Modify | `backend/src/auth.mjs` | Export `validatePasswordPolicy()` |
| Modify | `backend/src/index.mjs:57` | Handler `register()` memakai kebijakan |
| Modify | `backend/scripts/auth-check.mjs` | Password test compliant + kasus lemah 400 |
| Modify | `backend/scripts/integration-auth-check.mjs` | `linkPassword` compliant + matriks penolakan server |
| Modify | `frontend/src/components/auth/useAuthForm.ts` | `validatePasswordPolicy`, `getPasswordStrength`, state `confirmPassword`, validasi submit |
| Create | `frontend/src/components/auth/PasswordStrength.tsx` | Komponen visual strength bar |
| Modify | `frontend/src/components/auth/AuthCard.tsx` | Field Confirm Password + hint mismatch real-time + strength bar |
| Modify | `frontend/src/components/auth/index.ts` | Barrel export |
| Modify | `frontend/src/components/__tests__/auth-card.check.mjs` | Test policy/strength/mismatch (pola mirror) |
| Modify | `docs/technical/arsitektur-dan-integrasi.md` | Kebijakan password + baris QA manual baru |

**Definisi aturan (satu sumber kebenaran untuk plan ini):**

```js
// Set simbol yang diizinkan (persis dari requirement — '-' dan '_' TIDAK termasuk)
const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>]/;
// Urutan cek: panjang → huruf besar → huruf kecil → angka → simbol
// Pesan error (identik di klien & server):
// 'Password must be at least 8 characters.'
// 'Password must contain an uppercase letter (A-Z).'
// 'Password must contain a lowercase letter (a-z).'
// 'Password must contain a number (0-9).'
// 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).'
// Konfirmasi tidak cocok: 'Passwords do not match.'
```

---

### Task 1: Backend — `validatePasswordPolicy` (TDD: merah → hijau)

**Files:**
- Create: `backend/scripts/password-policy-check.mjs`
- Modify: `backend/src/auth.mjs`
- Modify: `backend/package.json` (scripts)

- [x] **Step 1: Tulis unit test murni (tanpa server)**

Buat `backend/scripts/password-policy-check.mjs`:

```js
// Unit test murni untuk validatePasswordPolicy — tidak butuh server/DB.
import assert from 'node:assert/strict';
import { validatePasswordPolicy } from '../src/auth.mjs';

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
```

- [x] **Step 2: Daftarkan script npm** — di `backend/package.json` `"scripts"` tambahkan:

```json
"check:password": "node scripts/password-policy-check.mjs"
```

- [x] **Step 3: Verifikasi GAGAL (merah)**

Run: `cd backend; npm run check:password`
Expected: `SyntaxError: The requested module '../src/auth.mjs' does not provide an export named 'validatePasswordPolicy'`

- [x] **Step 4: Implementasi** — tambahkan di `backend/src/auth.mjs` setelah `verifyPassword`:

```js
// Kebijakan password registrasi: min 8, huruf besar, huruf kecil, angka,
// dan simbol dari set requirement (!@#$%^&*(),.?":{}|<> — tanpa '-'/'_').
// Login TIDAK memakai ini: user lama boleh punya password non-compliant.
export function validatePasswordPolicy(password) {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter (A-Z).';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter (a-z).';
  if (!/[0-9]/.test(password)) return 'Password must contain a number (0-9).';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).';
  }
  return null;
}
```

- [x] **Step 5: Verifikasi LULUS (hijau)**

Run: `cd backend; npm run check:password`
Expected: `# OK: password policy self-check passed.`

- [x] **Step 6: Commit**

```bash
git add backend/src/auth.mjs backend/scripts/password-policy-check.mjs backend/package.json
git commit -m "feat(auth): strict password policy validator (length, case, digit, symbol)"
```

### Task 2: Backend — wiring `register()` + update test integrasi

**Files:**
- Modify: `backend/src/index.mjs:57`
- Modify: `backend/scripts/auth-check.mjs`
- Modify: `backend/scripts/integration-auth-check.mjs`

- [x] **Step 1: Wiring handler** — di `backend/src/index.mjs`:

1. Tambahkan `validatePasswordPolicy` ke import dari `./auth.mjs`:

```js
import {
  hashPassword, verifyPassword, createSession, getSessionUser, destroySession,
  sessionCookie, clearSessionCookie, validatePasswordPolicy,
} from './auth.mjs';
```

2. Ganti baris `if (password.length < 8) return { status: 400, json: { error: 'Password minimal 8 karakter.' } };` dengan:

```js
  const passwordError = validatePasswordPolicy(password);
  if (passwordError) return { status: 400, json: { error: passwordError } };
```

- [x] **Step 2: Update `auth-check.mjs`** (password lama `passwordtest123` kini ditolak):

1. Ganti `const password = 'passwordtest123';` menjadi:

```js
const password = 'PasswordTest123!';
```

2. Sisipkan setelah blok `// 2. Email duplikat → 409`:

```js
// 2b. Password tidak memenuhi kebijakan → 400 + pesan spesifik
const weak = await post('/api/auth/register', {
  name: 'Lemah', email: `weak-${Date.now()}@test.local`, password: 'passwordtest123',
});
assert.equal(weak.status, 400, 'password tanpa huruf besar/simbol harus 400');
assert.equal((await weak.json()).error, 'Password must contain an uppercase letter (A-Z).');
```

- [x] **Step 3: Update `integration-auth-check.mjs`**:

1. Ganti `const linkPassword = 'mypassword123';` menjadi:

```js
const linkPassword = 'LinkedPass123!';
```

2. Sisipkan section 6 sebelum `console.log('=== SEMUA TEST INTEGRASI AUTH LOLOS ===');`:

```js
console.log('--- 6. Test Kebijakan Password Register (Server-side) ---');
const policyEmail = () => `policy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
const rejections = [
  ['Short1!', 'Password must be at least 8 characters.'],
  ['alllower1!', 'Password must contain an uppercase letter (A-Z).'],
  ['ALLUPPER1!', 'Password must contain a lowercase letter (a-z).'],
  ['NoDigits!!', 'Password must contain a number (0-9).'],
  ['NoSpecial11', 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).'],
];
for (const [weakPw, expectedError] of rejections) {
  const r = await post('/api/auth/register', { name: 'Policy Test', email: policyEmail(), password: weakPw });
  assert.equal(r.status, 400, `"${weakPw}" harus ditolak 400`);
  assert.equal((await r.json()).error, expectedError, `"${weakPw}" → pesan spesifik`);
}
const okReg = await post('/api/auth/register', {
  name: 'Policy Test', email: policyEmail(), password: 'Str0ng!Pass',
});
assert.equal(okReg.status, 200, 'password compliant harus diterima');
console.log('✓ Server menolak 5 kategori password lemah & menerima password kuat');
```

- [x] **Step 4: Verifikasi** — jalankan backend lalu:

Run: `cd backend; npm run check` → Expected: `OK — register/duplikat/login-salah/login/me/logout semua lolos (...)`
Run: `cd backend; npm run check:integration` → Expected: `=== SEMUA TEST INTEGRASI AUTH LOLOS ===`

- [x] **Step 5: Commit**

```bash
git add backend/src/index.mjs backend/scripts/auth-check.mjs backend/scripts/integration-auth-check.mjs
git commit -m "feat(auth): enforce password policy on register + specific 400 messages"
```

### Task 3: Frontend — logika policy, strength, confirmPassword

**Files:**
- Modify: `frontend/src/components/auth/useAuthForm.ts`
- Modify: `frontend/src/components/__tests__/auth-card.check.mjs`

- [x] **Step 1: Tulis test terlebih dahulu (pola mirror file check)** — tambahkan di `frontend/src/components/__tests__/auth-card.check.mjs` sebelum `console.log('# OK: ...')`:

```js
// --- 8. Password Policy & Strength (Register) ---
function validatePasswordPolicy(password) {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter (A-Z).';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter (a-z).';
  if (!/[0-9]/.test(password)) return 'Password must contain a number (0-9).';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).';
  }
  return null;
}
function getPasswordStrength(pw) {
  if (!pw) return 'empty';
  const classes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*(),.?":{}|<>]/].filter((r) => r.test(pw)).length;
  if (pw.length < 8 || classes <= 2) return 'weak';
  if (classes === 3) return 'medium';
  return 'strong';
}

assert.equal(validatePasswordPolicy('Str0ng!Pass'), null);
assert.equal(validatePasswordPolicy('NoSpecial11'), 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).');
assert.equal(validatePasswordPolicy('Dash-Sym_1a'), 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).');

assert.equal(getPasswordStrength(''), 'empty');
assert.equal(getPasswordStrength('abc'), 'weak');
assert.equal(getPasswordStrength('abcdefgh'), 'weak', 'panjang cukup tapi 1 kelas → lemah');
assert.equal(getPasswordStrength('Abcdefg1'), 'medium', '3 kelas → sedang');
assert.equal(getPasswordStrength('Abcdefg!'), 'medium', '3 kelas → sedang');
assert.equal(getPasswordStrength('Abcdef1!'), 'strong', '4 kelas + panjang ≥8 → kuat (compliant)');

// Register: mismatch & policy divalidasi submit; login tidak kena policy
function validateRegisterForm({ name, email, password, confirmPassword }) {
  const policyError = validatePasswordPolicy(password);
  if (policyError) return policyError;
  if (confirmPassword !== password) return 'Passwords do not match.';
  const trimmedName = (name || '').trim();
  if (!trimmedName) return 'Full name is required.';
  return null;
}
assert.equal(
  validateRegisterForm({ name: 'Budi', email: 'b@arm.com', password: 'Abcdef1!', confirmPassword: 'Abcdef1!' }),
  null,
);
assert.equal(
  validateRegisterForm({ name: 'Budi', email: 'b@arm.com', password: 'Abcdef1!', confirmPassword: 'Xbcdef1!' }),
  'Passwords do not match.',
);
assert.equal(
  validateRegisterForm({ name: 'Budi', email: 'b@arm.com', password: 'password', confirmPassword: 'password' }),
  'Password must be at least 8 characters.',
);
```

- [x] **Step 2: Verifikasi test mirror**

Run: `node frontend/src/components/__tests__/auth-card.check.mjs`
Expected: `# OK: Auth split card unit & integration verification passed with 100% assertions.`

- [x] **Step 3: Implementasi di `useAuthForm.ts`**:

1. Tambahkan export setelah `isValidEmail`:

```ts
/**
 * Kebijakan password registrasi — identik dengan backend/src/auth.mjs.
 * Set simbol persis requirement: !@#$%^&*(),.?":{}|<> ('-' dan '_' tidak termasuk).
 * Mengembalikan pesan error spesifik, atau null jika compliant.
 */
export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter (A-Z).';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter (a-z).';
  if (!/[0-9]/.test(password)) return 'Password must contain a number (0-9).';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).';
  }
  return null;
}

export type PasswordStrengthLevel = 'empty' | 'weak' | 'medium' | 'strong';

/**
 * Kategori kekuatan password: kelas karakter terpenuhi (besar/kecil/angka/simbol).
 * 'strong' ≡ memenuhi kebijakan penuh. Login tidak memakai fungsi ini.
 */
export function getPasswordStrength(password: string): PasswordStrengthLevel {
  if (!password) return 'empty';
  const classes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*(),.?":{}|<>]/].filter((r) => r.test(password)).length;
  if (password.length < 8 || classes <= 2) return 'weak';
  if (classes === 3) return 'medium';
  return 'strong';
}
```

2. Tambahkan state & mismatch real-time (setelah `const [password, setPassword] = useState('');`):

```ts
  const [confirmPassword, setConfirmPassword] = useState('');
```

dan setelah `const isRegister = mode === 'register';`:

```ts
  // Real-time: hanya tampil setelah user mulai mengetik konfirmasi
  const passwordsMismatch = isRegister && confirmPassword.length > 0 && confirmPassword !== password;
```

3. Di `toggleMode`, reset konfirmasi (tambahkan `setConfirmPassword('');` di samping `setError('');`).

4. Sisipkan blok register di `validate` — **pertahankan** cek `if (password.length < 8) return 'Password must be at least 8 characters.';` yang lama (login masih memakainya, test mirror baris login `'123'` bergantung padanya), lalu tambahkan setelahnya:

```ts
    if (isRegister) {
      const policyError = validatePasswordPolicy(password);
      if (policyError) return policyError;
      if (confirmPassword !== password) {
        return 'Passwords do not match.';
      }
      const trimmedName = name.trim();
      if (!trimmedName) {
        return 'Full name is required.';
      }
      if (trimmedName.length < 2) {
        return 'Name must be at least 2 characters.';
      }
      if (trimmedName.length > 100) {
        return 'Name must be at most 100 characters.';
      }
    }
```

(Cek panjang untuk register redundan dengan policy — tidak masalah, policy memberi pesan yang sama.)

5. Tambahkan ke `return` objek: `confirmPassword, setConfirmPassword, passwordsMismatch,`

- [x] **Step 4: Verifikasi tipe & build**

Run: `cd frontend; npm run build`
Expected: EXIT 0 tanpa error TypeScript.
Run: `node frontend/src/components/__tests__/auth-card.check.mjs` → Expected: OK.

- [x] **Step 5: Commit**

```bash
git add frontend/src/components/auth/useAuthForm.ts frontend/src/components/__tests__/auth-card.check.mjs
git commit -m "feat(auth): client password policy, strength scoring, confirm-password state"
```

### Task 4: Frontend — UI Confirm Password + Strength Bar

**Files:**
- Create: `frontend/src/components/auth/PasswordStrength.tsx`
- Modify: `frontend/src/components/auth/AuthCard.tsx`
- Modify: `frontend/src/components/auth/index.ts`

- [x] **Step 1: Buat `PasswordStrength.tsx`**:

```tsx
'use client';

import { getPasswordStrength } from './useAuthForm';

const LEVELS = {
  empty: { filled: 0, color: 'bg-[#2B2B30]', label: '' },
  weak: { filled: 1, color: 'bg-[#E81828]', label: 'Weak' },
  medium: { filled: 2, color: 'bg-[#F5A623]', label: 'Medium' },
  strong: { filled: 3, color: 'bg-[#22C55E]', label: 'Strong' },
} as const;

/**
 * Indikator visual kekuatan password (3 segmen + label).
 * Diperbarui real-time dari nilai password; hanya dipakai di mode register.
 */
export function PasswordStrength({ password }: { password: string }) {
  const level = LEVELS[getPasswordStrength(password)];
  return (
    <div className="flex flex-col gap-1" role="status" aria-label={`Password strength: ${level.label || 'empty'}`}>
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < level.filled ? level.color : 'bg-[#2B2B30]'}`}
          />
        ))}
      </div>
      {level.label && <span className="text-[10px] font-semibold text-[#9AA0A8]">{level.label}</span>}
    </div>
  );
}
```

- [x] **Step 2: Update barrel `index.ts`** — tambahkan:

```ts
export * from './PasswordStrength';
```

- [x] **Step 3: Update `AuthCard.tsx`**:

1. Import komponen: `import { PasswordStrength } from './PasswordStrength';`
2. Destructure dari hook: `confirmPassword, setConfirmPassword, passwordsMismatch,`
3. Sisipkan strength bar setelah label Password (hanya register):

```tsx
          {isRegister && <PasswordStrength password={password} />}
```

4. Sisipkan field konfirmasi setelah strength bar (hanya register):

```tsx
          {isRegister && (
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-[#C7CAD1]">
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Re-enter your password"
                disabled={loading}
                aria-invalid={passwordsMismatch}
                className={`w-full rounded-lg border bg-[#141416] px-3 py-[clamp(6px,0.9vh,8px)] text-[13px] text-white placeholder-[#8A8F98] transition focus:outline-none disabled:opacity-60 ${
                  passwordsMismatch ? 'border-[#E81828]' : 'border-[#2B2B30] focus:border-[#E81828]'
                }`}
              />
              {passwordsMismatch && (
                <span className="text-[10px] font-medium text-[#FF6B77]">Passwords do not match.</span>
              )}
            </label>
          )}
```

5. Placeholder field Password diganti `placeholder="Min. 8 chars with A-Z, a-z, 0-9, symbol"`.

- [x] **Step 4: Verifikasi build**

Run: `cd frontend; npm run build`
Expected: EXIT 0.

- [x] **Step 5: Commit**

```bash
git add frontend/src/components/auth
git commit -m "feat(auth): confirm password field with live mismatch hint + strength bar UI"
```

### Task 5: Verifikasi akhir + dokumentasi

**Files:**
- Modify: `docs/technical/arsitektur-dan-integrasi.md`

- [x] **Step 1: Full gate verifikasi** (backend & frontend dev server jalan):

```powershell
cd backend; npm run check:password       # → # OK: password policy self-check passed.
cd backend; npm run check                # → OK — register/duplikat/... semua lolos
cd backend; npm run check:integration    # → === SEMUA TEST INTEGRASI AUTH LOLOS ===
node frontend/src/components/__tests__/auth-card.check.mjs  # → # OK: ... 100% assertions.
cd frontend; npm run build               # → EXIT 0
```

- [x] **Step 2: QA manual browser** (`http://localhost:3000/login` → tab Register):
  - Ketik `password` → bar merah "Weak"; tambah hingga `Password1` → "Medium"; `Password1!` → "Strong".
  - Isi konfirmasi beda → hint merah "Passwords do not match." muncul real-time; submit diblokir dengan pesan sama di banner.
  - Isi konfirmasi sama, password non-compliant → submit diblokir dengan pesan aturan pertama yang dilanggar.
  - Password compliant + konfirmasi cocok → akun dibuat, redirect `/`.
  - Tab Sign In → hanya 2 field, tanpa strength bar; login user lama tetap jalan.

- [x] **Step 3: Update `docs/technical/arsitektur-dan-integrasi.md`**:

1. Tambah baris di tabel §0 setelah baris `| Primary Key | ... |`:

```markdown
| Kebijakan Password | Register wajib: min 8 karakter + huruf besar + huruf kecil + angka + simbol `!@#$%^&*(),.?":{}|<>` — divalidasi klien & server; login tidak divalidasi ulang (user lama di-grandfathered) |
```

2. Tambah baris QA #11–#13 di tabel "Pengujian QA Manual":

```markdown
| 11 | Register: ketik konfirmasi berbeda dari password | Hint merah "Passwords do not match." real-time; submit diblokir |
| 12 | Register: isi password dari `password` → `Password1!` | Strength bar merah "Weak" → amber "Medium" → hijau "Strong" |
| 13 | Register password tanpa simbol (bypass klien via curl) | 400 + `Password must contain a special character (!@#$%^&*(),.?":{}|<>).` |
```

- [x] **Step 4: Commit**

```bash
git add docs/technical/arsitektur-dan-integrasi.md
git commit -m "docs(auth): password policy + QA scenarios for registration hardening"
```

---

## Catatan Desain (sudah dipertimbangkan, sengaja tidak dibuat)

- **Tidak ada shared package klien/server** — mengikuti pola duplikasi `isValidEmail` yang sudah ada; dua fungsi murni × 2 codebase lebih murah daripada monorepo tooling.
- **Login tidak divalidasi policy** — mencegah lockout user lama (mis. password admin eksisting). Policy hanya gerbang registrasi (dan nanti change-password).
- **`-` dan `_` bukan simbol valid** — requirement menetapkan set persis; pesan error menampilkan set sehingga user tahu simbol mana yang diterima.
- ponytail: tidak ada zxcvbn/entropy scoring — heuristik 4 kelas cukup untuk MVP; upgrade ke zxcvbn saat ada daftar password terbocorkan (HIBP) di masa depan.
