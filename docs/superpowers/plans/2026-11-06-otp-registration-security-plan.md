# OTP Registrasi + Cloudflare Turnstile Login + Konfigurasi Keamanan Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan sistem pendaftaran berbasis verifikasi OTP 6-digit terenkripsi AES-256-GCM, proteksi login anti brute-force dengan Cloudflare Turnstile dan delay eksponensial, serta panel konfigurasi parameter keamanan runtime di dashboard admin tanpa deploy ulang.

**Architecture:** Registrasi diubah menjadi 2 tahap: pembuatan OTP acak CSPRNG dengan payload data registrasi terenkripsi AES-256-GCM di `t_trx_registration_otps`, diikuti tahap verifikasi OTP yang memvalidasi hash scrypt (dengan `timingSafeEqual`) sebelum membuat akun di `master.t_mtr_users`. Login dilindungi Turnstile dan rate limiter tingkat IP (dari `socket.remoteAddress`) dengan delay eksponensial tanpa membebani user dengan OTP. Konfigurasi keamanan dibaca dari database `master.t_mtr_app_config` dengan in-memory cache 30 detik dan dapat diubah secara aman lewat endpoint admin PUT dengan clamping rentang valid.

**Tech Stack:** Node.js native (`node:http`, `node:crypto`), PostgreSQL `pg`, Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS, `node:assert/strict` self-checks.

**Spec:** [`docs/superpowers/specs/2026-11-06-otp-registration-security-design.md`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/docs/superpowers/specs/2026-11-06-otp-registration-security-design.md)

## Global Constraints

- IP address untuk rate limiting wajib diambil dari `req.socket.remoteAddress` (bukan header `X-Forwarded-For`).
- OTP acak dihasilkan dengan CSPRNG `crypto.randomInt(100000, 1000000)` (selalu 6 digit).
- Hash OTP diverifikasi menggunakan `crypto.timingSafeEqual` untuk mencegah timing-attack.
- Payload data registrasi disimpan dalam bentuk terenkripsi AES-256-GCM (`iv:tag:ciphertext` base64) menggunakan `APP_ENCRYPTION_KEY` 32-byte.
- Pesan kesalahan verifikasi OTP harus selalu generik: `"OTP tidak valid atau kedaluwarsa."` (anti-enumerasi).
- Kunci identifier setelah batas salah (`otp.max_attempts`) berlangsung selama `otp.lock_minutes` dengan kode status HTTP 423.
- Rate limiting IP yang melanggar diblokir selama `ratelimit.block_minutes` (pelanggaran pertama) atau `ratelimit.repeat_block_minutes` (berulang, maksimal 1 jam).
- Seluruh pengujian backend menggunakan script assert murni `node:assert/strict` tanpa framework test runner eksternal.

## Review Focus

- **Turnstile network timeout / failure:** Jika pemanggilan endpoint Cloudflare Turnstile timeout (>5 detik) atau error koneksi, verifikasi harus fail-closed (menolak request dengan HTTP 400).
- **Race condition verifikasi ganda:** Dua permintaan verifikasi bersamaan dengan OTP yang sama hanya boleh menghasilkan 1 user terdaftar; yang kedua wajib ditolak 400 generik karena `verified_at` sudah terset.
- **Lockout setelah max attempts:** Ketika percobaan salah mencapai `otp.max_attempts`, endpoint harus mengembalikan HTTP 423 `"Too many failed attempts. Try again later."` bahkan jika input berikutnya benar, sampai durasi `locked_until` berakhir.
- **Grandfathering login password lama:** Login user lama yang tidak memenuhi kebijakan password baru tetap dapat masuk tanpa ditolak oleh validator registrasi.
- **Clamping nilai config admin di luar batas:** Permintaan PUT `/api/admin/config` dengan nilai di luar rentang clamp harus dipaksa (clamped) ke batas aman terdekat tanpa merusak server.

---

### Task 1: Migrasi Database & Modul Konfigurasi Keamanan (`backend/src/config.mjs`)

**Files:**
- Modify: `backend/scripts/migrate.mjs`
- Create: `backend/src/config.mjs`
- Create: `backend/scripts/otp-check.mjs`

**Interfaces:**
- Produces: `getSecurityConfig() -> Promise<SecurityConfig>`
- Produces: `clampConfig(key: string, val: number) -> number`
- Produces: `updateSecurityConfig(key: string, val: number) -> Promise<number>`
- Produces: `SECURITY_CONFIG_SPECS: Record<string, { default: number, min: number, max: number, label: string }>`

- [ ] **Step 1: Tulis failing test unit untuk clamping dan default configuration di `backend/scripts/otp-check.mjs`**

```javascript
import assert from 'node:assert/strict';
import { clampConfig, SECURITY_CONFIG_SPECS } from '../src/config.mjs';

// Uji clamping rentang aman
assert.equal(clampConfig('otp.ttl_minutes', 2), 5, 'Nilai di bawah minimum harus di-clamp ke min (5)');
assert.equal(clampConfig('otp.ttl_minutes', 120), 60, 'Nilai di atas maksimum harus di-clamp ke max (60)');
assert.equal(clampConfig('otp.ttl_minutes', 20), 20, 'Nilai di dalam rentang tetap dipertahankan');
assert.equal(clampConfig('unknown.key', 99), 99, 'Key tak dikenal tidak di-clamp');
console.log('✔ config clamping unit test passed');
```

- [ ] **Step 2: Jalankan test dan pastikan gagal (module not found)**

Jalankan: `node backend/scripts/otp-check.mjs`  
Hasil yang diharapkan: FAIL dengan `Cannot find module '../src/config.mjs'`

- [ ] **Step 3: Update `backend/scripts/migrate.mjs` dengan DDL tabel rate limit & config**

Tambahkan kolom `payload_enc TEXT`, `locked_until TIMESTAMPTZ` pada `transaction.t_trx_registration_otps`, buat tabel `transaction.t_trx_rate_limits`, buat `master.t_mtr_app_config`, dan seed 8 key default (`otp.ttl_minutes`, `otp.max_attempts`, `otp.lock_minutes`, `ratelimit.max_requests`, `ratelimit.window_minutes`, `ratelimit.block_minutes`, `ratelimit.repeat_window_minutes`, `ratelimit.repeat_block_minutes`).

- [ ] **Step 4: Implementasikan `backend/src/config.mjs`**

Sediakan `SECURITY_CONFIG_SPECS`, resolusi berlapis (env override `CONFIG_OVERRIDE_*` -> DB `master.t_mtr_app_config` -> default), cache in-memory dengan TTL `CONFIG_CACHE_TTL_MS` (default 30000), serta fungsi `clampConfig`, `getSecurityConfig`, dan `updateSecurityConfig`.

- [ ] **Step 5: Jalankan test unit dan migrasi DB**

Jalankan:
1. `node backend/scripts/otp-check.mjs` -> PASS
2. `npm run --prefix backend migrate` -> Berhasil migrasi DDL

---

### Task 2: Modul Kriptografi & OTP (`backend/src/otp.mjs`)

**Files:**
- Create: `backend/src/otp.mjs`
- Modify: `backend/scripts/otp-check.mjs`

**Interfaces:**
- Produces: `generateOtp() -> string` (6-digit CSPRNG string)
- Produces: `hashOtp(otp: string, salt?: string) -> Promise<string>`
- Produces: `verifyOtpHash(otp: string, storedHash: string) -> Promise<boolean>`
- Produces: `encryptPayload(data: object, keyHexOrB64?: string) -> string`
- Produces: `decryptPayload(cipherText: string, keyHexOrB64?: string) -> object`

- [ ] **Step 1: Tambahkan test CSPRNG, hash roundtrip, timingSafeEqual, dan AES-GCM roundtrip ke `backend/scripts/otp-check.mjs`**

```javascript
import { generateOtp, hashOtp, verifyOtpHash, encryptPayload, decryptPayload } from '../src/otp.mjs';

// 1. CSPRNG 6-digit test 1000 iterasi
for (let i = 0; i < 1000; i++) {
  const code = generateOtp();
  assert.equal(code.length, 6);
  assert.match(code, /^[0-9]{6}$/);
  const num = Number(code);
  assert.ok(num >= 100000 && num < 1000000);
}

// 2. Hash & verify roundtrip
const otp = generateOtp();
const stored = await hashOtp(otp);
assert.equal(await verifyOtpHash(otp, stored), true);
assert.equal(await verifyOtpHash('000000', stored), false);

// 3. AES-256-GCM payload encryption
const payload = { name: 'Riko', email: 'riko@example.com', passwordHash: 'salt:hash' };
const encrypted = encryptPayload(payload);
assert.notEqual(encrypted, JSON.stringify(payload));
const decrypted = decryptPayload(encrypted);
assert.deepEqual(decrypted, payload);

// 4. Random IV per call
const enc2 = encryptPayload(payload);
assert.notEqual(encrypted, enc2, 'IV acak wajib menghasilkan ciphertext berbeda');
```

- [ ] **Step 2: Jalankan test dan pastikan gagal**

Jalankan: `node backend/scripts/otp-check.mjs`  
Hasil yang diharapkan: FAIL `Cannot find module '../src/otp.mjs'`

- [ ] **Step 3: Implementasikan `backend/src/otp.mjs`**

Gunakan `crypto.randomInt(100000, 1000000)`, `crypto.scrypt`, `crypto.timingSafeEqual`, serta `crypto.createCipheriv('aes-256-gcm', key, iv)`. Format enkripsi: `base64(iv):base64(authTag):base64(cipherText)`. `APP_ENCRYPTION_KEY` diambil dari `process.env.APP_ENCRYPTION_KEY` (fallback 32-byte statis dev hanya saat dev/test).

- [ ] **Step 4: Jalankan test dan pastikan lulus**

Jalankan: `node backend/scripts/otp-check.mjs`  
Hasil yang diharapkan: PASS seluruh pengujian unit kriptografi.

---

### Task 3: Modul Rate Limiting & Pengiriman Mailer (`backend/src/ratelimit.mjs`, `backend/src/mailer.mjs`)

**Files:**
- Create: `backend/src/ratelimit.mjs`
- Create: `backend/src/mailer.mjs`

**Interfaces:**
- Produces: `checkRateLimit(ip: string, action: string) -> Promise<{ allowed: boolean, retryAfterSec: number }>`
- Produces: `recordViolation(ip: string, action: string) -> Promise<void>`
- Produces: `sleepExponential(attempt: number) -> Promise<void>`
- Produces: `sendOtpEmail(email: string, otp: string) -> Promise<void>`

- [ ] **Step 1: Tulis unit test untuk fungsi exponential sleep dan mock rate limit di script test**

Verifikasi `sleepExponential(1)` memberikan delay ~250ms, `sleepExponential(2)` ~500ms, dan capped pada 4000ms.

- [ ] **Step 2: Implementasikan `backend/src/ratelimit.mjs`**

Implementasikan query atomik ke tabel `transaction.t_trx_rate_limits`:
1. Cek apakah ada record aktif dengan `blocked_until > now()`. Jika ada, return `{ allowed: false, retryAfterSec }`.
2. Jika jendela waktu telah lewat (`now() - window_start > window_minutes`), reset `count = 1, window_start = now()`.
3. Jika `count >= max_requests`, panggil `recordViolation(ip, action)` yang menghitung `violation_count` dan set `blocked_until = now() + block_minutes` (atau `repeat_block_minutes` jika pelanggaran berulang dalam `repeat_window_minutes`).
4. Implementasikan `sleepExponential(attempt)`: `Math.min(4000, 250 * Math.pow(2, attempt - 1))`.

- [ ] **Step 3: Implementasikan `backend/src/mailer.mjs`**

Implementasikan `sendOtpEmail(email, otp)` yang mencetak output JSON terstruktur ke console dev:
`console.log(`[mailer:dev] OTP untuk ${email}: ${otp}`);`.

---

### Task 4: Modul Cloudflare Turnstile Server Verification (`backend/src/captcha.mjs`)

**Files:**
- Create: `backend/src/captcha.mjs`

**Interfaces:**
- Produces: `verifyTurnstile(token: string, ip: string) -> Promise<{ success: boolean, error?: string }>`

- [ ] **Step 1: Implementasikan `backend/src/captcha.mjs`**

1. Jika `process.env.TURNSTILE_SECRET_KEY` kosong atau token bernilai dummy uji dev (`dummy-bypass-token`), return `{ success: true }`.
2. Lakukan POST ke `https://challenges.cloudflare.com/turnstile/v0/siteverify` dengan `AbortSignal.timeout(5000)` membawa payload `secret`, `response: token`, dan `remoteip: ip`.
3. Parse JSON respons `{ success }`. Jika false atau request timeout/gagal, return `{ success: false, error: 'Captcha verification failed.' }`.

---

### Task 5: Wiring Endpoint Backend (`backend/src/index.mjs`)

**Files:**
- Modify: `backend/src/index.mjs`
- Modify: `backend/package.json`

**Interfaces:**
- Consumes: `generateOtp`, `hashOtp`, `verifyOtpHash`, `encryptPayload`, `decryptPayload` from `otp.mjs`
- Consumes: `checkRateLimit`, `sleepExponential` from `ratelimit.mjs`
- Consumes: `verifyTurnstile` from `captcha.mjs`
- Consumes: `getSecurityConfig`, `updateSecurityConfig` from `config.mjs`
- Consumes: `sendOtpEmail` from `mailer.mjs`
- Produces: Endpoint `POST /api/auth/register`, `POST /api/auth/verify-otp`, `POST /api/auth/login`, `GET /api/admin/config`, `PUT /api/admin/config`

- [ ] **Step 1: Ubah handler `register`**

1. Ambil IP dari `req.socket.remoteAddress`.
2. Validasi Turnstile: jika gagal -> return 400.
3. Cek rate limit `checkRateLimit(ip, 'register')`: jika tidak diizinkan -> return 429 `{ error: 'Too many requests. Try again later.', retryAfterSec }`.
4. Validasi name, email, dan `validatePasswordPolicy(password)`.
5. Cek apakah email terdaftar di `master.t_mtr_users`: jika ada -> return 409.
6. Generate OTP, hash scrypt, enkripsi payload `{ name, email, passwordHash }`.
7. Hapus OTP lama yang belum terverifikasi untuk identifier email ini di `transaction.t_trx_registration_otps`, lalu insert baris OTP baru.
8. Panggil `sendOtpEmail(email, otp)`.
9. Kembalikan respons 200 `{ requiresOtp: true }` **tanpa membuat user di DB, tanpa sesi, dan tanpa cookie**.

- [ ] **Step 2: Tambahkan handler `verifyOtp` (`POST /api/auth/verify-otp`)**

1. Ambil IP dari `req.socket.remoteAddress`.
2. Cek rate limit `checkRateLimit(ip, 'verify-otp')` -> 429.
3. Cari baris OTP aktif di `transaction.t_trx_registration_otps` untuk email terkait. Jika tidak ada / sudah lewat `expires_at` / `verified_at IS NOT NULL` -> return 400 `"OTP tidak valid atau kedaluwarsa."`.
4. Jika `locked_until > now()` -> return 423 `"Too many failed attempts. Try again later."`.
5. Verifikasi OTP via `verifyOtpHash(otp, row.otp_hash)`:
   - Jika salah: increment `attempts`. Jika `attempts >= max_attempts`, set `locked_until = now() + lock_minutes`. Jalankan `sleepExponential(attempts)`. Return 400 `"OTP tidak valid atau kedaluwarsa."`.
   - Jika benar: tandai `verified_at = now()`, dekripsi payload, buat user di `master.t_mtr_users`, buat sesi di `transaction.t_trx_sessions`, set cookie `arm_session`, dan return 200 `{ user: { name, email, role: 'customer' } }`.

- [ ] **Step 3: Perkuat handler `login`**

1. Validasi Turnstile -> 400 jika gagal.
2. Cek rate limit `checkRateLimit(ip, 'login')` -> 429 jika terblokir.
3. Cek user & password. Jika salah: jalankan delay eksponensial berdasarkan frekuensi gagal dan kembalikan 401 `"Email atau password salah."`.

- [ ] **Step 4: Tambahkan handler `GET /api/admin/config` dan `PUT /api/admin/config`**

1. Verifikasi sesi admin via `getSessionUser(req)`. Jika bukan role admin -> return 403.
2. GET: kembalikan list parameter dari `getSecurityConfig()` beserta label dan rentang min/max.
3. PUT: validasi input angka, clamp nilai, simpan ke `master.t_mtr_app_config`, dan kembalikan nilai efektif.

---

### Task 6: Integrasi & Verifikasi Otomatis Backend (`backend/scripts/integration-otp-check.mjs`)

**Files:**
- Create: `backend/scripts/integration-otp-check.mjs`
- Modify: `backend/package.json`

- [ ] **Step 1: Tulis skrip integration check komprehensif**

Buat `backend/scripts/integration-otp-check.mjs` yang menjalankan server pada port pengujian terpisah (port 4005) dengan database testing:
1. Registrasi normal -> memastikan respons `{ requiresOtp: true }` tanpa cookie session.
2. Verifikasi OTP salah berkali-kali hingga `attempts >= max_attempts` -> memastikan HTTP 423 returned.
3. Verifikasi OTP benar -> user masuk ke `master.t_mtr_users`, cookie session diterbitkan.
4. Penggunaan ulang OTP yang sama (reuse attack) -> memastikan ditolak 400 generik.
5. Verifikasi OTP yang kadaluwarsa -> memastikan ditolak 400 generik.
6. Rate limiting trigger -> request melebihi ambang batas menghasilkan HTTP 429.
7. Admin config update via PUT -> mengubah konfigurasi runtime dan memvalidasi efek seketika.
8. Non-admin mengakses endpoint config -> memastikan ditolak HTTP 403.

- [ ] **Step 2: Daftarkan script di `backend/package.json` dan jalankan**

Tambahkan `"check:otp": "node scripts/otp-check.mjs"` dan `"check:integration-otp": "node --env-file=.env scripts/integration-otp-check.mjs"` ke `scripts`.  
Jalankan: `npm run --prefix backend check:otp && npm run --prefix backend check:integration-otp`  
Hasil yang diharapkan: 100% PASS seluruh skenario pengujian integrasi.

---

### Task 7: Frontend State Machine & Hook Update (`frontend/src/components/auth/useAuthForm.ts`)

**Files:**
- Modify: `frontend/src/components/auth/useAuthForm.ts`
- Modify: `frontend/src/components/auth/types.ts`
- Modify: `frontend/src/components/__tests__/auth-card.check.mjs`

**Interfaces:**
- Produces: `step: 'form' | 'otp'`
- Produces: `verifyOtp(code: string) -> Promise<void>`
- Produces: `resendOtp() -> Promise<void>`
- Produces: `captchaToken: string | null`
- Produces: `setCaptchaToken: (token: string | null) -> void`

- [ ] **Step 1: Update tipe dan state hook**

1. Tambahkan field `step: 'form' | 'otp'`, `otpEmail: string`, dan `captchaToken: string | null` pada hook.
2. Ketika submit register mengembalikan `{ requiresOtp: true }`, alihkan state `step` menjadi `'otp'`.
3. Tambahkan fungsi `verifyOtp(code: string)` yang mengirim POST ke `/api/auth/verify-otp`.
4. Tambahkan fungsi `resendOtp()` yang memicu pengiriman ulang kode.

- [ ] **Step 2: Update unit test mirror di `frontend/src/components/__tests__/auth-card.check.mjs`**

Validasi state transition `form -> otp`, pemformatan kode 6-digit, dan penanganan status error generik.  
Jalankan: `node frontend/src/components/__tests__/auth-card.check.mjs` -> PASS.

---

### Task 8: Komponen UI OtpStep & Cloudflare Turnstile (`frontend/src/components/auth/`)

**Files:**
- Create: `frontend/src/components/auth/Turnstile.tsx`
- Create: `frontend/src/components/auth/OtpStep.tsx`
- Modify: `frontend/src/components/auth/AuthCard.tsx`
- Modify: `frontend/src/components/auth/index.ts`

- [ ] **Step 1: Buat komponen `frontend/src/components/auth/Turnstile.tsx`**

Memuat script Cloudflare Turnstile (`https://challenges.cloudflare.com/turnstile/v0/api.js`) secara asinkron, merender container, dan memanggil callback `onVerify(token)` dan `onError()`. Jika `NEXT_PUBLIC_TURNSTILE_SITE_KEY` tidak disetel (dev mode), render container placeholder atau otomatis bypass token.

- [ ] **Step 2: Buat komponen `frontend/src/components/auth/OtpStep.tsx`**

1. 6 field input terpisah dengan perilaku auto-advance saat diketik, backspace mundur ke kotak sebelumnya, dan handler onPaste 6 digit.
2. Hitungan mundur (countdown timer) mm:ss sesuai TTL.
3. Tombol "Kirim Ulang" dengan cooldown 30 detik.
4. Auto-submit seketika saat digit ke-6 selesai dimasukkan.

- [ ] **Step 3: Hubungkan komponen di `frontend/src/components/auth/AuthCard.tsx`**

1. Render `Turnstile` pada form login dan register.
2. Tampilkan `OtpStep` saat state `step === 'otp'`.
3. Sediakan tombol kembali ke form pengisian jika user ingin mengganti email.

---

### Task 9: Panel Konfigurasi Keamanan Admin Dashboard (`frontend/src/app/admin/page.tsx`)

**Files:**
- Modify: `frontend/src/app/admin/page.tsx`
- Create: `frontend/src/app/admin/SecurityConfigPanel.tsx`

- [ ] **Step 1: Buat client component `SecurityConfigPanel.tsx`**

Komponen untuk menampilkan tabel/form parameter keamanan runtime:
1. Menampilkan 8 parameter konfigurasi beserta label deskriptif dan rentang batas aman (min - max).
2. Input angka untuk masing-masing parameter.
3. Tombol Simpan yang memicu `PUT /api/admin/config`.
4. Indikator feedback visual (sukses/gagal/clamped notice) dan catatan bahwa perubahan aktif dalam $\le 30$ detik.

- [ ] **Step 2: Pasang `SecurityConfigPanel` ke dalam `frontend/src/app/admin/page.tsx`**

Pastikan hanya role admin yang dapat melihat dan mengakses komponen tersebut.

---

### Task 10: Verifikasi Penuh (Full-Story Verification & Build Gate)

**Files:**
- Modify: `docs/technical/arsitektur-dan-integrasi.md` (Update catatan arsitektur & tabel uji manual QA)

- [ ] **Step 1: Jalankan seluruh script test backend**

Jalankan:
```bash
npm run --prefix backend check
npm run --prefix backend check:password
npm run --prefix backend check:otp
npm run --prefix backend check:integration-otp
```
Pastikan seluruh pengujian 100% PASS.

- [ ] **Step 2: Jalankan test frontend dan Next.js production build**

Jalankan:
```bash
node frontend/src/components/__tests__/auth-card.check.mjs
npm run --prefix frontend build
```
Pastikan Next.js build sukses tanpa error type checking atau linting.

- [ ] **Step 3: Update dokumentasi teknis `docs/technical/arsitektur-dan-integrasi.md`**

Catat penambahan alur verifikasi OTP, integrasi Turnstile, tabel migrasi database baru, dan langkah verifikasi manual QA.
