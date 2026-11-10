# Decoupled Multi-Dimensional Discount Policies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memisahkan kolom `discount_percent` dari tabel `master.t_mtr_roles` ke tabel kebijakan mandiri `master.t_mtr_discount_policies` dengan dukungan multi-targeting (role, kategori, kuantitas, kupon, dan kota/kabupaten via JSONB) tanpa mengubah kontrak publik API.

**Architecture:** Menerapkan arsitektur *Separation of Concerns (SoC)*: tabel `roles` dikhususkan untuk otorisasi & hak akses (IAM), sedangkan kebijakan harga dikelola oleh `master.t_mtr_discount_policies` dan dievaluasi secara dinamis oleh `DiscountPolicyService` di NestJS dengan evaluasi operator array native PostgreSQL (`= ANY(target_roles)`) dan stacking evaluator (`EXCLUSIVE` vs `STACKABLE`).

**Tech Stack:** PostgreSQL 16 (Native Array, GIN Index, JSONB), NestJS, Prisma ORM, TypeScript, Next.js 16 (App Router, Turbopack).

**Spec:** [`docs/superpowers/specs/2026-11-09-decoupled-discount-policies-design.md`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/docs/superpowers/specs/2026-11-09-decoupled-discount-policies-design.md)

---

## Global Constraints

- Kolom `discount_percent` harus dihapus sepenuhnya dari `master.t_mtr_roles`.
- Granularitas regional dibatasi maksimal tingkat **Kota/Kabupaten** (disimpan di `criteria_rules JSONB` sebagai `{"cities": [...]}`).
- Response kontrak API publik (`/api/checkout/products`, `/api/auth/me`, `/api/admin/users`) harus tetap backward-compatible mengembalikan `discountPercent` / `discount_percent` hasil kalkulasi runtime.
- Seluruh query array role di database harus memanfaatkan native PostgreSQL index (`GIN (target_roles)`).
- Strict Motorsport Brutalist dark aesthetic (#0F0F11, #141416, #2B2B32, #E81828 race red, #F59E0B gold telemetry) harus dipertahankan.

---

## Review Focus

1. **Token/Role Invite Synchronization**: Saat membuat atau mengklaim undangan VIP reseller, info diskon harus dibaca dari policy `RESELLER_BASE_20`, bukan dari kolom roles yang sudah di-drop.
2. **Guest/Anonymous Access**: Katalog produk (`GET /api/checkout/products`) tanpa session tidak boleh crash atau melempar error saat query policy, dan harus mengembalikan diskon 0% (atau diskon publik jika ada).
3. **Array Null Handling**: Jika policy memiliki `target_roles IS NULL`, policy tersebut harus berlaku untuk semua pengguna (termasuk guest). Jika `target_roles` berisi array, hanya role yang cocok yang berhak mendapatkan diskon.
4. **Stacking Rule Fallback**: Jika seorang Reseller (20%) berbelanja dan ada policy lain yang aktif, mode `EXCLUSIVE` harus secara konsisten memilih nilai diskon persentase tertinggi.
5. **City Filter Boundary**: Filter kota di `criteria_rules JSONB` harus case-insensitive dan tidak boleh membatasi jika data kota tidak dikirimkan oleh pemanggil.

---

### Task 1: Database Migration & Schema Decoupling

**Files:**
- Create: `backend/prisma/migrations/20261109_decouple_discount_policies/migration.sql`
- Modify: `backend/prisma/schema.prisma`
- Test: `docs/scripts/backend/test-discount-policies-schema.mjs`

**Interfaces:**
- Produces: Tabel `master.t_mtr_discount_policies` dengan seed data `RESELLER_BASE_20` (20%) & `DISTRIBUTOR_TIER_35` (35%).
- Produces: Tabel `master.t_mtr_roles` bersih tanpa kolom `discount_percent`.

- [x] **Step 1: Write the failing schema test**
  Buat test script `docs/scripts/backend/test-discount-policies-schema.mjs` yang memverifikasi:
  1. Tabel `master.t_mtr_discount_policies` ada dan memiliki kolom: `code`, `name`, `discount_type`, `discount_value`, `target_roles`, `target_categories`, `min_order_qty`, `criteria_rules`, `stacking_mode`, `is_active`.
  2. Data awal `RESELLER_BASE_20` (20.00%) dan `DISTRIBUTOR_TIER_35` (35.00%) terdaftar dengan benar.
  3. Kolom `discount_percent` sudah TIDAK ADA di `master.t_mtr_roles`.

- [x] **Step 2: Run test to verify it fails**
  Run: `node docs/scripts/backend/test-discount-policies-schema.mjs`
  Expected: FAIL (tabel belum ada atau kolom masih ada di roles).

- [x] **Step 3: Write and execute database migration**
  Eksekusi SQL migration:
  ```sql
  CREATE TABLE IF NOT EXISTS master.t_mtr_discount_policies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
      discount_value NUMERIC(10, 2) NOT NULL,
      target_roles TEXT[] NULL,
      target_categories TEXT[] NULL,
      target_product_ids TEXT[] NULL,
      min_order_qty INT NOT NULL DEFAULT 1,
      min_order_amount NUMERIC(12, 2) DEFAULT 0,
      coupon_code VARCHAR(50) NULL,
      criteria_rules JSONB DEFAULT '{}'::jsonb,
      priority INT NOT NULL DEFAULT 0,
      stacking_mode VARCHAR(20) NOT NULL DEFAULT 'EXCLUSIVE',
      valid_from TIMESTAMPTZ NULL,
      valid_until TIMESTAMPTZ NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_discount_target_roles ON master.t_mtr_discount_policies USING GIN (target_roles);
  CREATE INDEX IF NOT EXISTS idx_discount_is_active_priority ON master.t_mtr_discount_policies (is_active, priority DESC);

  INSERT INTO master.t_mtr_discount_policies (code, name, description, discount_type, discount_value, target_roles, priority, is_active)
  VALUES 
    ('RESELLER_BASE_20', 'Diskon Kemitraan Reseller Resmi', 'Diskon margin dasar B2B untuk bengkel rekanan resmi', 'PERCENTAGE', 20.00, ARRAY['reseller'], 10, TRUE),
    ('DISTRIBUTOR_TIER_35', 'Diskon Distributor Regional', 'Diskon margin tier 1 untuk distributor wilayah', 'PERCENTAGE', 35.00, ARRAY['distributor'], 20, TRUE)
  ON CONFLICT (code) DO UPDATE SET discount_value = EXCLUDED.discount_value, target_roles = EXCLUDED.target_roles;

  ALTER TABLE master.t_mtr_roles DROP COLUMN IF EXISTS discount_percent;
  ```

- [x] **Step 4: Update `schema.prisma` and run `prisma generate`**
  Hapus `discount_percent` dari model `Role` dan tambahkan model `DiscountPolicy`.

- [x] **Step 5: Run test to verify it passes**
  Run: `node docs/scripts/backend/test-discount-policies-schema.mjs`
  Expected: PASS 100%.

---

### Task 2: Pricing Engine Service Refactoring (`DiscountPolicyService` & `CheckoutService`)

**Files:**
- Create: `backend/src/features/checkout/discount-policy.service.ts`
- Modify: `backend/src/features/checkout/checkout.service.ts`
- Modify: `backend/src/features/checkout/checkout.module.ts`
- Modify: `backend/src/features/checkout/checkout.controller.ts`
- Modify: `backend/src/features/checkout/catalog.controller.ts`
- Test: `docs/scripts/backend/test-decoupled-pricing-engine.mjs`

**Interfaces:**
- Produces: `DiscountPolicyService.evaluateDiscount(context: { role?: string; category?: string; city?: string; couponCode?: string; qty?: number })`
- Consumes: `master.t_mtr_discount_policies` query via `DatabaseService`.

- [x] **Step 1: Write failing pricing engine test**
  Buat `docs/scripts/backend/test-decoupled-pricing-engine.mjs` yang memverifikasi:
  1. Pengguna `customer` mendapat diskon 0% (Full retail).
  2. Pengguna `reseller` mendapat diskon 20% dari policy `RESELLER_BASE_20`.
  3. Pengguna `distributor` mendapat diskon 35% dari policy `DISTRIBUTOR_TIER_35`.
  4. Dynamic City Scope: Buat policy uji coba `DEPOK_SPECIAL_10` (`criteria_rules: {"cities": ["KOTA_DEPOK"]}`, value: 10%). Bila parameter `city=KOTA_DEPOK` dikirim, evaluasi policy tersebut aktif.
  5. Sesi Stripe Checkout tetap menghasilkan nilai nominal yang terdiskon secara akurat.

- [x] **Step 2: Run test to verify it fails**
  Run: `node docs/scripts/backend/test-decoupled-pricing-engine.mjs`
  Expected: FAIL.

- [x] **Step 3: Implement `DiscountPolicyService`**
  Implementasikan query dan evaluator:
  ```typescript
  async getEffectiveDiscount(context: {
    role?: string;
    category?: string;
    city?: string;
    couponCode?: string;
    qty?: number;
  }): Promise<{ discountPercent: number; matchedPolicies: string[] }>
  ```
  Query tabel `master.t_mtr_discount_policies` dengan filter masa aktif dan matching array (`target_roles IS NULL OR $1 = ANY(target_roles)`). Jika `criteria_rules->'cities'` ada, cocokkan dengan `city` konteks. Terapkan stacking `EXCLUSIVE` (ambil nilai terbesar).

- [x] **Step 4: Update `CheckoutService` to consume `DiscountPolicyService`**
  Gantikan logika `getDiscountPercentForUser` lama dengan pemanggilan ke `DiscountPolicyService`. Update `createStripeSession` untuk menyertakan metadata policy yang cocok.

- [x] **Step 5: Run test to verify it passes**
  Run: `node docs/scripts/backend/test-decoupled-pricing-engine.mjs`
  Expected: PASS 100%.

---

### Task 3: Backend Auth, Users, & Invites Synchronization

**Files:**
- Modify: `backend/src/features/auth/auth.service.ts`
- Modify: `backend/src/features/admin/admin-users.service.ts`
- Modify: `backend/src/features/admin/reseller-invite.service.ts`
- Test: `docs/scripts/backend/test-admin-policies-sync.mjs`

**Interfaces:**
- Produces: `/api/auth/me` mengembalikan `discount_percent` yang dievaluasi dari `master.t_mtr_discount_policies`.
- Produces: `/api/admin/roles` mengembalikan daftar role murni tanpa kolom `discount_percent`.
- Produces: `/api/reseller/invite-info` mengembalikan diskon kemitraan dari policy aktif.

- [x] **Step 1: Write failing synchronization test**
  Buat `docs/scripts/backend/test-admin-policies-sync.mjs` untuk menguji:
  1. `GET /api/auth/me` untuk reseller mengembalikan `discount_percent: 20` dari policy.
  2. `GET /api/admin/roles` mengembalikan daftar role tanpa properti `discount_percent`.
  3. `GET /api/admin/users` menampilkan list user dengan diskon efektif terhitung.
  4. `GET /api/reseller/invite-info?token=...` mengembalikan info invite dengan `discount_percent: 20`.

- [x] **Step 2: Run test to verify it fails**
  Run: `node docs/scripts/backend/test-admin-policies-sync.mjs`
  Expected: FAIL.

- [x] **Step 3: Update `AuthService.me`**
  Hapus referensi `r.discount_percent` dari query SQL `me()`. Sebagai gantinya, lakukan `LEFT JOIN` atau subquery ke policy aktif tertinggi berdasarkan role pengguna.

- [x] **Step 4: Update `AdminUsersService` and `ResellerInviteService`**
  Perbarui query `getMasterRoles()` untuk tidak menyeleksi kolom `discount_percent`. Perbarui `getInviteInfo` untuk mencari diskon dari tabel policy berdasarkan `role_to_grant`.

- [x] **Step 5: Run test to verify it passes**
  Run: `node docs/scripts/backend/test-admin-policies-sync.mjs`
  Expected: PASS 100%.

---

### Task 4: Frontend Admin Panel & HeaderTabs Synchronization

**Files:**
- Modify: `frontend/src/features/admin/components/UserManagementTable.tsx`
- Modify: `frontend/src/features/admin/components/VipInviteGenerator.tsx`
- Modify: `frontend/src/shared/components/HeaderTabs.tsx`

**Interfaces:**
- Produces: Admin UI menampilkan margin diskon dinamis dari policy tanpa merujuk kolom role lama.
- Produces: Header profile badge menampilkan diskon aktif yang diterima dari `/api/auth/me`.

- [x] **Step 1: Update `UserManagementTable.tsx`**
  Pastikan tabel menampilkan diskon pengguna dari objek `user.discount_percent` / `user.roleDetails.discount_percent` tanpa mengasumsikan role memiliki kolom tersebut.

- [x] **Step 2: Update `VipInviteGenerator.tsx`**
  Perbarui deskripsi margin kemitraan pada dropdown target role (misal: "Reseller Official (Margin 20% B2B Policy)").

- [x] **Step 3: Verify TypeScript compilation in Frontend**
  Run: `npm --prefix frontend run build`
  Expected: Turbopack compile berhasil dalam < 2 detik tanpa error tipe TypeScript.

---

### Task 5: End-to-End Verification & Health Audit

**Files:**
- Create: `docs/scripts/e2e/e2e-decoupled-discount-policies.mjs`
- Regression Run: `docs/scripts/backend/test-rbac-schema.mjs`
- Regression Run: `docs/scripts/backend/test-admin-users.mjs`
- Regression Run: `docs/scripts/backend/test-reseller-invites.mjs`
- Regression Run: `docs/scripts/e2e/e2e-vip-reseller-lifecycle.mjs`

**Interfaces:**
- Produces: Verifikasi 100% siklus hidup: Guest -> Ritel Price; Admin Buat Invite -> Token Diklaim -> Reseller dapat Diskon 20% dari Policy -> Checkout Stripe Berhasil; City-level policy matching terverifikasi.

- [x] **Step 1: Execute full lifecycle E2E test script**
  Jalankan `docs/scripts/e2e/e2e-decoupled-discount-policies.mjs`.
  Verifikasi:
  - Admin login & fetch roles tanpa `discount_percent`.
  - Fetch catalog guest -> 1.850.000 IDR (0%).
  - Fetch catalog reseller -> 1.480.000 IDR (20% via policy).
  - City scope matching: Uji parameter `city=KOTA_DEPOK` vs `city=KOTA_MEDAN`.
  - Stripe session checkout terpotong diskon.

- [x] **Step 2: Run all backend regression test suites**
  Run:
  - `node docs/scripts/backend/test-discount-policies-schema.mjs`
  - `node docs/scripts/backend/test-decoupled-pricing-engine.mjs`
  - `node docs/scripts/backend/test-admin-policies-sync.mjs`
  - `node docs/scripts/backend/test-reseller-invites.mjs`
  - `node docs/scripts/e2e/e2e-decoupled-discount-policies.mjs`
  Expected: ALL PASS (100%).

- [x] **Step 3: Execute production build checks**
  Run: `npm --prefix backend run build`
  Run: `npm --prefix frontend run build`
  Expected: Clean build dengan exit code 0.
