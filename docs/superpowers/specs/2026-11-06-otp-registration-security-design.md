# Spec: OTP Registrasi + Turnstile Login + Konfigurasi Keamanan Runtime

> **Status:** FINAL — disetujui user per 2026-11-06 melalui sesi brainstorming.
> **Sumber keputusan:** Q&A brainstorming (login tanpa OTP, captcha Cloudflare Turnstile, rate limit 5mnt/maks 1 jam, config runtime via panel admin, email dev-mode, uji spam dilewati).

## 1. Tujuan

1. Registrasi email/password memakai verifikasi OTP 6 digit berstandar keamanan tinggi (anti brute-force, anti-enumerasi, anti-reuse, terenkripsi, ter-audit).
2. Login dilindungi dari brute-force **tanpa OTP** (sesuai keputusan user): captcha Cloudflare Turnstile + rate limit + lockout + delay eksponensial.
3. Seluruh parameter keamanan (threshold & durasi) dapat **diubah runtime dari panel admin tanpa deploy ulang**.

## 2. Keputusan Desain (terkunci)

| Keputusan | Pilihan | Alasan |
|---|---|---|
| OTP di login? | **Tidak** — cukup Turnstile + rate limit + lockout | User memilih login tanpa OTP; brute-force sudah tertangani lapisan lain |
| Captcha | **Cloudflare Turnstile** (gratis unlimited, invisible) | User setuju rekomendasi; verifikasi server via `fetch`, nol dependensi baru |
| Pengiriman email | **Dev-mode**: OTP di-log ke console server | Belum ada kredensial email; struktur kode siap colok SMTP/Resend |
| Uji folder spam | **Dilewati** | Butuh provider email nyata |
| Blokir IP 24 jam | **Ditiadakan** → blokir 5 menit, berulang → 1 jam | UX: user sah tidak menunggu 24 jam |
| Sumber parameter | **DB `master.t_mtr_app_config`** + cache 30 detik + panel admin | Perubahan tanpa deploy ulang |
| Google SSO | Tetap langsung masuk **tanpa OTP** | Email sudah diverifikasi Google |

## 3. Alur Pengguna

### Registrasi (2 langkah)
1. Form: Nama, Email, Password, Confirm Password + widget Turnstile → submit.
2. Backend: validasi policy password → rate limit → captcha → cek email terdaftar → generate OTP → simpan (hash + payload terenkripsi) → "kirim" email (dev-mode: console) → respons `{ requiresOtp: true }`.
3. UI pindah ke layar OTP: 6 kotak input (auto-advance, auto-paste), countdown mm:ss dari TTL, tombol "Kirim ulang", tombol "Verifikasi", link kembali.
4. OTP benar → akun dibuat (role `customer`) + session + cookie → redirect masuk aplikasi.

### Login
Email + Password + Turnstile → verifikasi captcha → rate limit → password → session. Tanpa OTP.

### Google SSO
Tidak berubah: verifikasi Google ID Token → session langsung.

## 4. Backend

### 4.1 Skema DB (migrasi)

**`transaction.t_trx_registration_otps`** — tabel sudah ada; tambah kolom:
- `payload_enc TEXT NOT NULL` — data registrasi {name, email, passwordHash} terenkripsi AES-256-GCM (base64: iv:tag:ciphertext)
- `locked_until TIMESTAMPTZ` — kunci identifier setelah `otp.max_attempts` kegagalan

**`transaction.t_trx_rate_limits`** — baru:
```sql
ip_address INET NOT NULL,
action TEXT NOT NULL,           -- 'register' | 'login' | 'verify-otp'
window_start TIMESTAMPTZ NOT NULL,
count INT NOT NULL DEFAULT 0,
violation_count INT NOT NULL DEFAULT 0,  -- jumlah pelanggaran dalam repeat window
blocked_until TIMESTAMPTZ,
PRIMARY KEY (ip_address, action)
```

**`master.t_mtr_app_config`** — baru:
```sql
key TEXT PRIMARY KEY,
value TEXT NOT NULL,        -- angka disimpan sebagai teks
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```
Di-seed dengan 8 key default (lihat 4.4).

### 4.2 Modul baru

| File | Tanggung jawab |
|---|---|
| `src/otp.mjs` | `generateOtp()` → `crypto.randomInt(100000, 1000000)` (CSPRNG, tak dapat diprediksi); `hashOtp(otp, salt)` scrypt, pembandingan via `crypto.timingSafeEqual` (anti timing-attack); `encryptPayload(obj)`/`decryptPayload(enc)` AES-256-GCM dengan key `APP_ENCRYPTION_KEY` (32 byte base64, env, random IV per enkripsi); `OTP_TTL` dari config |
| `src/ratelimit.mjs` | `checkRateLimit(ip, action)` → { allowed, retryAfterSec } hitung dari tabel `t_trx_rate_limits`; `recordViolation(ip, action)` → blokir `block_minutes`, jika pelanggaran ke-`n` dalam `repeat_window_minutes` → `repeat_block_minutes`; `sleepExponential(attempt)` delay 250ms×2^(attempt-1) cap 4s |
| `src/captcha.mjs` | `verifyTurnstile(token, ip)` → POST `https://challenges.cloudflare.com/turnstile/v0/siteverify` via fetch; jika `TURNSTILE_SECRET_KEY` kosong → return true (dev-mode); timeout 5 detik → gagal = tolak |
| `src/config.mjs` | `getSecurityConfig()` — resolusi berlapis: **env override** (jika diset, menerima menit pecahan — untuk test cepat) → DB `t_mtr_app_config` → default hardcoded; cache in-memory `CONFIG_CACHE_TTL_MS` (default 30000) |
| `src/mailer.mjs` | `sendOtpEmail(email, otp)` — dev-mode: log terstruktur ke console. Upgrade path: cabang `if (SMTP_URL)` menyusul |

### 4.3 Endpoint

**`POST /api/auth/register`** (berubah — tidak langsung buat akun):
1. `verifyTurnstile` → gagal: 400 `"Captcha verification failed."`
2. `checkRateLimit(ip, 'register')` → larang: 429 `"Too many requests. Try again later."` + `retryAfterSec`
3. Validasi name/email/policy password (kegagalan policy tetap sebelum cek email — anti-enumerasi)
4. Email sudah terdaftar di `t_mtr_users` → 409 (perilaku lama dipertahankan)
5. Normalisasi email lowercase sebagai `identifier`; hapus semua OTP lama identifier dalam transaksi yang sama dengan insert baris baru (satu identifier = maksimal satu baris aktif)
6. Generate OTP, hash scrypt, enkripsi payload, insert `t_trx_registration_otps` (attempts=0, expires_at = now + ttl)
7. `sendOtpEmail` (dev-mode log)
8. Respons 200 `{ requiresOtp: true }` — **tanpa session, tanpa cookie**
9. Audit log `[otp] generate`

> Sumber IP selalu `req.socket.remoteAddress` (bukan header `X-Forwarded-For` yang bisa dipalsukan) untuk semua aksi rate limiting.

**`POST /api/auth/verify-otp`** (baru): body `{ email, otp }`
1. `checkRateLimit(ip, 'verify-otp')` → 429
2. Ambil baris OTP aktif (belum `verified_at`, belum kedaluwarsa) identifier; tidak ada / sudah verified / kedaluwarsa → 400 generik **"OTP tidak valid atau kedaluwarsa."** (pesan sama untuk semua kasus — anti-enumerasi)
3. `locked_until > now` → 423 `"Too many failed attempts. Try again later."`
4. OTP salah → `attempts+1`; jika `attempts >= otp.max_attempts` → set `locked_until = now + otp.lock_minutes`; `sleepExponential(attempts)`; respons 400 generik yang sama; audit `[otp] verify_fail`
5. OTP benar → set `verified_at` (anti-reuse), dekripsi payload, INSERT user (role customer), createSession + cookie, hapus/expire sisa OTP identifier; respons sama seperti login sukses `{ user: {...} }`; audit `[otp] verify_ok`

**`POST /api/auth/login`** (diperkuat):
1. `verifyTurnstile` → 400
2. `checkRateLimit(ip, 'login')` → 429
3. Password salah → `sleepExponential(failCount)` delay server; respons 401 (pesan lama)
4. Benar → session (kebijakan password grandfathering tetap — tidak divalidasi ulang)

**`GET /api/admin/config`** — session + role `admin` → daftar key/value/label/range.
**`PUT /api/admin/config`** — session + role `admin`; body `{ key: value }`; validasi tipe angka + clamp ke rentang aman per key → 200 nilai efektif. Non-admin → 403. Key tak dikenal → 400.

### 4.4 Parameter default + rentang clamp

| Key | Default | Rentang clamp | Arti |
|---|---|---|---|
| `otp.ttl_minutes` | 15 | 5–60 | masa berlaku OTP |
| `otp.max_attempts` | 3 | 2–10 | batas salah sebelum kunci identifier |
| `otp.lock_minutes` | 5 | 1–60 | durasi kunci identifier |
| `ratelimit.max_requests` | 5 | 3–50 | maks request/IP/jendela |
| `ratelimit.window_minutes` | 15 | 5–60 | panjang jendela |
| `ratelimit.block_minutes` | 5 | 1–60 | blokir pelanggaran pertama |
| `ratelimit.repeat_window_minutes` | 60 | 10–1440 | jendela deteksi berulang |
| `ratelimit.repeat_block_minutes` | 60 | 5–60 | blokir pelanggaran berulang (maks 1 jam sesuai keputusan user) |

### 4.5 Audit log

Console JSON terstruktur (satu baris per event): `[otp] generate|verify_ok|verify_fail|locked`, `[captcha] pass|fail|error`, `[ratelimit] blocked` — payload: `ts, event, ip, identifierHash (sha256 email dipendekkan), attempt, outcome`. Tidak pernah log OTP plaintext / password / token.

## 5. Frontend

| File | Perubahan |
|---|---|
| `components/auth/useAuthForm.ts` | state `step: 'form' \| 'otp'`; submit register → jika `requiresOtp` → step `otp`; `verifyOtp(code)` → sukses = perlakuan sama login sukses; `resendOtp()` = re-submit register (payload tersimpan form); state `captchaToken` |
| `components/auth/OtpStep.tsx` (baru) | 6 input single-char (auto-advance/backspace, paste 6 digit langsung isi), countdown mm:ss dari respons TTL, tombol Kirim ulang (aktif 30 detik sejak OTP terakhir dikirim), error generik, auto-submit saat 6 digit terisi penuh |
| `components/auth/Turnstile.tsx` (baru) | load script `https://challenges.cloudflare.com/turnstile/v0/api.js` + render widget; tanpa `NEXT_PUBLIC_TURNSTILE_SITE_KEY` → tidak dirender (dev); ekspor token via callback |
| `components/auth/AuthCard.tsx` | merangkai: form step → OtpStep saat register; Turnstile di kedua form; reset token setelah submit gagal |
| `app/admin/page.tsx` | panel **Pengaturan Keamanan** di dashboard admin: satu baris per parameter (label deskriptif + input angka + keterangan rentang yang diizinkan), tombol Simpan → PUT config → tampilkan nilai efektif baru + catatan "perubahan berlaku otomatis ≤30 detik", respons error (403/400/clamp) ditampilkan inline |
| Login page | tidak berubah |

### 5.1 UX OTP yang dijamin
- OTP tidak pernah menunggu reload halaman: step OTP inline di kartu yang sama
- Salah ketik tidak menghukum: lock 5 menit (bukan 24 jam) sesuai keputusan user
- Pesan error selalu generik + ramah ("OTP tidak valid atau kedaluwarsa."), tidak pernah membocorkan alasan spesifik
- Progress jelas: countdown kadaluarsa terlihat, tombol kirim ulang dengan hitungan aktif

## 6. Pengujian (pola `node:assert/strict`, tanpa framework)

### Unit — `backend/scripts/otp-check.mjs`
- `generateOtp()` selalu 6 digit, ≥100000, <1000000; 1000 sampel tidak pernah keluar rentang
- hash roundtrip: OTP benar diverifikasi, OTP salah ditolak
- `encryptPayload`/`decryptPayload` roundtrip; ciphertext berubah tiap call (random IV); key salah → gagal dekrip
- Clamp config di luar rentang → nilai ter-clamp

### Integrasi — `backend/scripts/integration-otp-check.mjs` (server uji port terpisah dengan **env override config berdurasi kecil**, `CONFIG_CACHE_TTL_MS=100`)
- Registrasi → respons `requiresOtp: true`, TANPA cookie session
- OTP salah ×`otp.max_attempts` → identifier terkunci; OTP benar pun ditolak selama lock
- OTP benar → user dibuat + session; OTP sama dipakai ulang → 400 generik
- OTP kedaluwarsa → 400 generik (diuji deterministik: `UPDATE ... SET expires_at = now() - interval '1 second'` langsung di DB, tanpa menunggu TTL)
- Brute force rate limit: request ke-(max+1) endpoint register/login/verify-otp → 429 + `retryAfterSec`; blokir terbuka otomatis setelah `block_minutes` (env override kecil) terlewati — bukti periode block sesuai konfigurasi
- Alur login normal (password benar, request di bawah limit) → 200 tidak terganggu oleh rate limiter
- Delay eksponensial: durasi respons verify gagal ke-2 > ke-1 (diukur `Date.now()`)
- Ubah `otp.max_attempts` jadi 2 via PUT admin (server dengan env override dibersihkan/ dilepas untuk scenario ini) → brute force terkunci setelah 2 salah — bukti config runtime dari DB efektif, cache ≤100ms
- Customer (non-admin) PUT config → 403; key tak dikenal → 400; nilai di luar rentang → ter-clamp
- Captcha: `TURNSTILE_SECRET_KEY` kosong → lewat (dev); secret uji resmi Cloudflare `2x0000000000000000000000000000000AA` (selalu gagal) + token dummy → 400; `1x0000000000000000000000000000000AA` (selalu lolos) → 200

### Frontend — extend `components/__tests__/auth-card.check.mjs`
- Mirror: state machine step form↔otp, resend mengembalikan step tetap otp, validasi panjang OTP (tepat 6 digit numerik), auto-submit saat penuh

### Build gate
`npm run build` frontend EXIT 0; seluruh script check backend hijau (`check`, `check:password`, `check:otp`, `check:integration-otp`).

### QA Manual (validasi user, dicatat di `docs/technical/arsitektur-dan-integrasi.md`)
1. Register → OTP muncul di console server (dev-mode) → verifikasi → masuk aplikasi
2. Salah OTP 3× → pesan kunci; tunggu ±5 menit → bisa coba lagi (UX delay wajar terverifikasi)
3. Login salah password berulang → captcha tetap muncul, delay terasa bertambah, tidak ada blokir 24 jam
4. Admin ubah `otp.ttl_minutes` di panel → simpan → OTP baru kedaluwarsa sesuai nilai baru (≤30 detik)
5. Customer biasa membuka `/admin` → redirect; admin asli → panel tampil

### 6.1 Tinjauan Keamanan Menyeluruh Alur Registrasi (requirement #4)
Checklist celah + penutupnya — masing-masing diuji di unit/integrasi di atas:
- Prediksi OTP → CSPRNG `crypto.randomInt` (bukan `Math.random`)
- Timing attack pembandingan hash → `timingSafeEqual`
- Reuse OTP setelah sukses → flag `verified_at` + cek sebelum verifikasi
- OTP kedaluwarsa dipakai → cek `expires_at` di setiap verifikasi
- Enumerasi email via verifikasi OTP → satu pesan generik untuk semua kasus
- Brute force OTP → 3-attempt lock + rate limit IP + delay eksponensial
- Brute force login → Turnstile + rate limit IP + delay eksponensial
- Spoof IP untuk lolos rate limit → IP dari `socket.remoteAddress`, bukan header
- Kebocoran data registrasi di DB → payload AES-256-GCM (nama/email/hash password tidak plaintext di tabel OTP)
- OTP/password/token bocor ke log → aturan audit log eksplisit (4.5)
- Race condition register/verifikasi ganda → constraint UNIQUE(email) di `t_mtr_users` + satu baris OTP aktif per identifier (hapus lama + insert baru dalam satu transaksi)
- Key enkripsi terekspos di repo → `APP_ENCRYPTION_KEY` hanya via `.env` (di-`.gitignore`), tidak ada fallback default yang lemah (server menolak start jika kosong di luar dev)

## 7. Lingkup Luar (YAGNI — sengaja tidak dibangun)

- Pengiriman email nyata (SMTP/Resend) + uji folder spam — menyusul saat kredensial ada (`mailer.mjs` sudah punya titik cabang)
- OTP untuk login / reset password
- Trusted-device cookie
- Tabel audit khusus di DB (console log JSON cukup; `ponytail:` upgrade path ke tabel saat butuh query audit)
- Per-account lockout login (password spraying lintas IP) — mitigasi saat ini: Turnstile + delay eksponensial; upgrade path: kolom `failed_login_count` di users saat trafik produksi nyata
- Rotasi `APP_ENCRYPTION_KEY` otomatis — payload OTP berumur pendek (≤60 menit), rotasi manual cukup

## 8. File Structure Ringkas

```
backend/
  src/otp.mjs          (baru)
  src/ratelimit.mjs    (baru)
  src/captcha.mjs      (baru)
  src/config.mjs       (baru)
  src/mailer.mjs       (baru)
  src/auth.mjs         (dipakai ulang: hashPassword/verifyPassword/createSession/validatePasswordPolicy)
  src/index.mjs        (routing + handler register/verify-otp/login/admin-config)
  scripts/migrate.mjs  (+2 tabel: app_config, kolom registration_otps)
  scripts/otp-check.mjs            (baru, unit)
  scripts/integration-otp-check.mjs (baru, integrasi)
frontend/
  src/components/auth/OtpStep.tsx  (baru)
  src/components/auth/Turnstile.tsx (baru)
  src/components/auth/useAuthForm.ts (modifikasi)
  src/components/auth/AuthCard.tsx   (modifikasi)
  src/components/auth/index.ts       (ekspor baru)
  src/app/admin/page.tsx             (panel Pengaturan Keamanan)
```
