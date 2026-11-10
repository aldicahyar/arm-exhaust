# Task Plan: Integrasi Sistem Autentikasi Google SSO & Email/Password

Status: **SELESAI (Completed)** — Diverifikasi per 2026-11-04  
Hasil Verifikasi: 100% Lulus (Semua Unit, Integration Test & Build Berhasil)

> **For agentic workers:** Status task di bawah telah diselesaikan menggunakan alur `superpowers:subagent-driven-development`.

**Goal:** Mengintegrasikan sistem autentikasi lengkap pada ARM Exhaust yang mencakup Google Sign-In (SSO) dan Email/Password login, dengan penanganan akun terpadu (account linking), perbaikan bug laten verifikasi password, dan pengujian end-to-end terstandarisasi pada skema PostgreSQL `master` & `transaction`.

---

## File Structure & Responsibilities

- `backend/src/google-auth.mjs`: [SELESAI]
  - Fetch dan cache Google Public JWKS (`https://www.googleapis.com/oauth2/v3/certs`)
  - Verifikasi signature RSA-SHA256, klaim `iss` (accounts.google.com), `aud` (CLIENT_ID), `exp`, dan `email_verified`
  - Fallback verifikator mock token untuk lingkungan automated testing
- `backend/src/auth.mjs`: [SELESAI]
  - Perbaikan bug laten `verifyPassword` saat `stored` bernilai `null` (untuk user Google-only)
- `backend/src/index.mjs`: [SELESAI]
  - Penambahan rute `POST /api/auth/google`
  - Logika linking identitas: jika email sudah ada, insert ke `master.t_mtr_user_identities`; jika belum ada, buat user baru lalu tautkan
  - Pembuatan sesi di `transaction.t_trx_sessions` & set cookie `arm_session`
- `frontend/src/components/auth/AuthGoogleButton.tsx`: [SELESAI]
  - Integrasi Google Identity Services (GIS) library dan handler callback token
  - Fallback simulasi saat environment `NEXT_PUBLIC_GOOGLE_CLIENT_ID` belum disetel
- `frontend/src/components/auth/useAuthForm.ts`: [SELESAI]
  - Penanganan state loading dan pesan error saat SSO gagal
- `backend/scripts/integration-auth-check.mjs`: [SELESAI]
  - Pengujian komprehensif dua metode login (Email/Password & Google SSO)

---

### Task 1: Perbaikan Bug Laten `verifyPassword` untuk User Google-Only
- [x] **Step 1: Tulis failing test untuk `verifyPassword` dengan input null/undefined**
- [x] **Step 2: Jalankan test dan pastikan gagal**
- [x] **Step 3: Perbaiki `verifyPassword` di `backend/src/auth.mjs`**
- [x] **Step 4: Jalankan test dan pastikan lulus**
- [x] **Step 5: Selesai & diverifikasi**

---

### Task 2: Implementasi Modul Verifikasi Token Google Native (`backend/src/google-auth.mjs`)
- [x] **Step 1: Tulis failing test untuk verifikasi token Google**
- [x] **Step 2: Jalankan test dan pastikan gagal**
- [x] **Step 3: Implementasi `backend/src/google-auth.mjs`**
- [x] **Step 4: Jalankan test dan pastikan lulus**
- [x] **Step 5: Selesai & diverifikasi**

---

### Task 3: Implementasi Handler Backend `POST /api/auth/google`
- [x] **Step 1: Tulis integration test untuk alur login Google dan penautan akun**
- [x] **Step 2: Jalankan test awal**
- [x] **Step 3: Tambahkan fungsi `googleLogin` di `backend/src/index.mjs`**
- [x] **Step 4: Selesai & diverifikasi**

---

### Task 4: Integrasi Frontend Client Google Sign-In (`AuthGoogleButton.tsx`)
- [x] **Step 1: Muat script Google Identity Services dan bind event credential**
- [x] **Step 2: Tangani feedback UI sukses & error**
- [x] **Step 3: Uji Build Frontend (`npm run build`)**
- [x] **Step 4: Selesai & diverifikasi**

---

### Task 5: Pengujian Akhir & Validasi Kualitas Dua Metode Login
- [x] **Step 1: Jalankan seluruh checklist test backend & frontend (100% Pass)**
- [x] **Step 2: Verifikasi Build & Lint (Next.js 16 build sukses tanpa error)**
