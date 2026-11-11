# Short Design: Form Login & Register Minimalist ala Bencho (Monochrome)

**Tanggal:** 2026-11-11  
**Status:** Menunggu Persetujuan Pengguna  
**Topik:** Penyesuaian Form Input, Action Buttons, dan Checkbox "Remember Me" pada Halaman `/login` (ARM Exhaust) Mengadopsi Estetika Monokrom Bencho.dev

---

## 1. Intent & Konteks (The Why)
Pengguna menginginkan tampilan form autentikasi (`/login` dan mode register) memiliki estetika minimalis modern persis seperti komponen `LabelInput` di [bencho.dev/?c=label-input&theme=dark](https://bencho.dev/?c=label-input&theme=dark). 

Semua elemen dibuat monokromatis (hitam, putih kontras, dark surface `#0F0F11`, dan border netral `#2B2B30`), sehingga **hanya logo ARM Exhaust yang membawa aksen warna merah aslinya**. Selain itu, pada mode login ditambahkan kontrol interaktif **"Remember Me" (Ingat Sesi Saya)** yang dirancang minimalis dan serasi.

---

## 2. Goals & Non-Goals

### Goals:
1. **Komponen `LabelInput` (Otentik Bencho)**:
   - Outline border berbasis **dynamic SVG ring** dengan kalkulasi kurva presisi dan animasi *cut-out gap* (`stroke-dashoffset: -1px`) saat input difokuskan atau terisi (`data-up="true"`).
   - Animasi **Floating Label** dengan micro-interaction **letter-hop** (`lbi-hop`) berjenjang per karakter (`calc(var(--i) * 24ms)`) saat difokuskan.
   - Password eye toggle interaktif dengan transisi scale & blur ganda (morph icon) antara show/hide password.
   - Responsif `w-full` (mengisi container `AuthCard` secara proporsional), tinggi ~50px–52px, corner radius `rounded-2xl` (18px).
2. **Keseragaman Tombol (Full Bencho Monochrome)**:
   - **Tombol Submit (Sign In / Create Account)**: Solid White (`bg-white text-black font-semibold rounded-2xl hover:bg-neutral-200 active:scale-[0.98] transition-all`) dengan tinggi yang seimbang.
   - **Tombol Google SSO**: Menyesuaikan radius menjadi `rounded-2xl` dengan border `#2B2B30` dan dark background `#141416`.
   - **Tautan Ganti Mode**: Teks minimalis putih/abu-abu netral (`text-white hover:underline`).
3. **Checkbox "Remember Me"**:
   - Ditampilkan hanya pada mode Login (`!isRegister`).
   - Didesain minimalis monokrom: kotak kecil `w-4 h-4 rounded-md` border `#3A3A40` yang terisi putih kontras saat dicentang (`bg-white border-white text-black`).
   - Terintegrasi dengan state `rememberMe` di `useAuthForm`.
4. **Preservasi Fungsionalitas Eksisting**:
   - Menjaga integrasi `PasswordStrength` meter, validasi `passwordsMismatch`, Cloudflare Turnstile, serta integrasi OTP 6 digit.

### Non-Goals:
- Mengubah alur bisnis registrasi backend atau skema database users.
- Mengubah halaman lain di luar autentikasi (`/login`, `/masuk`, `/daftar`).

---

## 3. Pendekatan yang Dipertimbangkan (Approaches)

1. **Pendekatan A (Hybrid dengan Aksen Merah ARM Exhaust):**
   Memakai struktur Bencho namun tombol utama tetap merah balap `#E81828`. *(Dieliminasi karena pengguna secara spesifik memilih estetika full minimalist monokrom di mana hanya logo yang memiliki warna merah)*.
2. **Pendekatan B (CSS Border Mockup Biasa):**
   Memakai CSS `fieldset`/`legend` atau background-masking biasa untuk efek cut-out. *(Dieliminasi karena tidak menghasilkan kehalusan kurva SVG dan animasi cut-out stroke-dashoffset asli Bencho)*.
3. **Pendekatan C (Pure Bencho Monochrome + Dynamic SVG Ring — TERPILIH):**
   Mengimplementasikan SVG path rendering asli dari Bencho dengan adaptasi responsif (fluid width), outline gap dinamis, staggered letter-hop, tombol solid white kontras tinggi, dan checkbox minimalis.

---

## 4. Rincian Teknis Arsitektur & Perubahan

### A. Komponen Baru: `frontend/src/features/auth/LabelInput.tsx`
* **Props**:
  - `label`: string (misal: "Email", "Password", "Full Name", "Confirm Password")
  - `type`: 'text' | 'email' | 'password'
  - `value`: string
  - `onChange`: (val: string) => void
  - `name`, `autoComplete`, `required`, `disabled`, `error?: boolean`
  - `corner`: number (default: `18`)
* **Implementasi**:
  - Mengukur lebar teks label via hidden/measuring element untuk menentukan celah *cut-out gap* SVG ring secara akurat.
  - Render SVG path dengan 2 segmen busur (`A`) dan 2 garis horizontal (`gap`).
  - Animasi CSS keyframes `lbi-hop` disematkan dalam CSS/Tailwind class.

### B. Pembaruan `useAuthForm.ts` & `types.ts`
* Menambahkan state `rememberMe: boolean` dan `setRememberMe: (val: boolean) => void`.
* Mengirimkan flag `rememberMe` ke payload endpoint login `/api/auth/login` (atau penyimpanan preferensi lokal).

### C. Pembaruan `AuthCard.tsx`
* Mengganti form input native lama (`<input className="...">`) dengan `<LabelInput />`.
* Menambahkan baris Checkbox "Remember Me" di antara input password dan tombol submit pada mode Sign In.
* Mengubah tombol submit menjadi solid white minimalis (`rounded-2xl bg-white text-black hover:bg-neutral-200`).
* Menyelaraskan teks pemisah "or" dan tombol Google SSO ke radius `rounded-2xl`.

---

## 5. Rencana Verifikasi
1. **Verifikasi Visual**:
   - Memeriksa animasi letter-hop saat input nama, email, dan password diklik/fokus.
   - Memeriksa celah cut-out pada SVG ring apakah pas membungkus label saat floating.
   - Memeriksa kelancaran toggle eye password.
   - Memeriksa tampilan checkbox Remember Me dalam state unchecked dan checked.
2. **Verifikasi Fungsional**:
   - Submit login dan register berjalan normal (tidak merusak validasi input, Turnstile, atau penanganan error).
3. **Build & Typecheck**:
   - Menjalankan `npm --prefix frontend run build` untuk menjamin 0 error TypeScript / linting.
