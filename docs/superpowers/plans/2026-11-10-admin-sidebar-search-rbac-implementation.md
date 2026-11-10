# Sidebar Search, Notification Center & Superadmin/Admin RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun ekosistem navigasi admin ARM Exhaust premium (Stealth Luxe) dengan Sidebar Search (ber-shortcut `⌘K`), Pusat Notifikasi flyout drawer di sidebar, pemisahan role RBAC antara `superadmin` dan `admin` operasional dengan proteksi Opsi A (menu superadmin disembunyikan penuh), modul Pesanan Masuk (Orders) berpenerapan lead time manufaktur knalpot, modul Pengaturan Pajak (Tax), serta akun superadmin default.

**Architecture:** 
1. Database & Backend: Tambahkan role `superadmin` di `master.t_mtr_roles`, buat akun `superadmin@armexhaust.id`, dan proteksi endpoint mutasi sensitif (Pajak, Dynamic Pricing, Keamanan OTP) dengan `@Roles('superadmin')`.
2. Frontend Ergonomics: Tambahkan `SidebarSearch` dan `SidebarNotification` yang terintegrasi di `Sidebar.tsx` (mendukung morphing saat collapsed 68px) dan Command Palette modal (`⌘K`).
3. RBAC Gating Opsi A: `AdminShell.tsx` menyaring menu secara dinamis sehingga admin operasional hanya melihat menu harian (Pesanan Masuk, Direktori Mitra, Undangan VIP), sedangkan superadmin memiliki akses penuh ke seluruh modul termasuk Pengaturan Pajak dan Matriks Diskon.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide React, NestJS, Prisma ORM, PostgreSQL.

**Spec:** [`docs/superpowers/specs/2026-11-10-admin-sidebar-search-rbac-design.md`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/docs/superpowers/specs/2026-11-10-admin-sidebar-search-rbac-design.md)

## Global Constraints
- Tema visual wajib mengikuti estetika Stealth Luxe (font Outfit, aksen amber gold `#d97706`, monochrome zinc `#18181b` / `#e4e4e7`, background kanvas `#f8f9fa` / `#ffffff`).
- Opsi A wajib dipatuhi: menu superadmin sama sekali tidak boleh dirender atau berstatus disabled bagi user ber-role `admin`.
- Kredensial superadmin default: `superadmin@armexhaust.id` / `SuperAdmin123!` menggunakan enkripsi `scrypt` ber-salt sesuai standar database ARM Exhaust.
- Sidebar search wajib ber-morphing mulus tanpa merusak layout icon rail 68px saat sidebar diciutkan.
- Seluruh build Next.js (`npm --prefix frontend run build`) dan backend TypeScript wajib lulus dengan 0 error.

## Review Focus
1. User dengan role `admin` mencoba mengakses tab/endpoint superadmin secara langsung via manipulasi state -> dialihkan secara aman atau ditolak dengan HTTP 403 Forbidden.
2. Sidebar di-collapse ke mode icon rail 68px saat search input terisi -> input ber-morphing menjadi tombol icon kaca pembesar dan tooltip `Pencarian (⌘K)` tetap berfungsi.
3. Menekan shortcut keyboard `Ctrl+K` atau `⌘K` dari area manapun di dashboard admin -> Command Palette modal terbuka seketika dan fokus input otomatis aktif.
4. Aksi cepat WhatsApp pada tabel pesanan knalpot -> membuka tautan `https://wa.me/...` dengan teks template yang ter-encode URL secara presisi (termasuk nomor order, status QC, dan resi kargo).
5. Input persentase pajak pada panel Tax Config -> memvalidasi angka 0-100%, mencegah nilai negatif, dan menyimpan nilai ke database konfigurasi.

---

### Task 1: Database Role `superadmin` Migration & Default Credential Seeding

**Files:**
- Create: `docs/scripts/backend/migrate-superadmin.mjs`
- Test: `docs/scripts/backend/test-superadmin-rbac.mjs`

**Interfaces:**
- Consumes: PostgreSQL connection `DATABASE_URL` via `pg` client.
- Produces: Record `superadmin` di `master.t_mtr_roles` (`can_access_admin: true`, `can_access_b2b: true`) dan akun `superadmin@armexhaust.id` di `master.t_mtr_users`.

- [ ] **Step 1: Write the failing test**

```javascript
// docs/scripts/backend/test-superadmin-rbac.mjs
import pg from 'pg';
import assert from 'node:assert';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const roleRes = await client.query("SELECT * FROM master.t_mtr_roles WHERE id = 'superadmin'");
  assert.strictEqual(roleRes.rowCount, 1, "Role superadmin harus terdaftar di master.t_mtr_roles");
  assert.strictEqual(roleRes.rows[0].can_access_admin, true, "superadmin harus memiliki can_access_admin = true");

  const userRes = await client.query("SELECT * FROM master.t_mtr_users WHERE email = 'superadmin@armexhaust.id'");
  assert.strictEqual(userRes.rowCount, 1, "User superadmin@armexhaust.id harus terdaftar di master.t_mtr_users");
  assert.strictEqual(userRes.rows[0].role, 'superadmin', "Role user harus superadmin");
  console.log("PASS: Role superadmin dan user default valid di database.");
} finally {
  await client.end();
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node docs/scripts/backend/test-superadmin-rbac.mjs`  
Expected: FAIL with assertion error (`role superadmin belum terdaftar`).

- [ ] **Step 3: Implement `migrate-superadmin.mjs`**

Buat script migrasi `docs/scripts/backend/migrate-superadmin.mjs` yang melakukan:
1. `INSERT INTO master.t_mtr_roles (id, name, description, can_access_admin, can_access_b2b, badge_style) VALUES ('superadmin', 'Super Administrator', 'Pemilik sistem, konfigurasi pajak, dynamic pricing, dan kontrol penuh', TRUE, TRUE, '{"bg": "#18181B", "border": "#D97706", "text": "#D97706"}'::jsonb) ON CONFLICT (id) DO UPDATE SET can_access_admin = TRUE, can_access_b2b = TRUE;`
2. Enkripsi password `SuperAdmin123!` dengan `crypto.scrypt` (16-byte random salt, 64-byte key) format `salt:hash`.
3. `INSERT INTO master.t_mtr_users (name, email, password_hash, role) VALUES ('Superadmin ARM', 'superadmin@armexhaust.id', $1, 'superadmin') ON CONFLICT (email) DO UPDATE SET role = 'superadmin';`

- [ ] **Step 4: Run migration and verify test passes**

Run:
```bash
node docs/scripts/backend/migrate-superadmin.mjs
node docs/scripts/backend/test-superadmin-rbac.mjs
```
Expected: PASS with "PASS: Role superadmin dan user default valid di database."

- [ ] **Step 5: Commit**

```bash
git add docs/scripts/backend/migrate-superadmin.mjs docs/scripts/backend/test-superadmin-rbac.mjs
git commit -m "feat(auth): seed superadmin role and default credentials in PostgreSQL"
```

---

### Task 2: Backend API Protection for Superadmin Endpoints (`RolesGuard`)

**Files:**
- Modify: `backend/src/features/admin/admin.controller.ts`
- Modify: `backend/src/features/admin/admin-users.service.ts`
- Test: `docs/scripts/backend/test-admin-rbac-guards.mjs`

**Interfaces:**
- Consumes: `@Roles('superadmin')`, `@Roles('admin', 'superadmin')`, `RolesGuard`.
- Produces: Endpoints `/api/admin/policies/**`, `/api/admin/security/config`, `/api/admin/tax` hanya bisa diakses oleh `superadmin`. Endpoints operasional (`/api/admin/users`, `/api/admin/invites`) bisa diakses oleh `admin` dan `superadmin`.

- [ ] **Step 1: Write the failing test**

```javascript
// docs/scripts/backend/test-admin-rbac-guards.mjs
import assert from 'node:assert';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Test endpoint policies with regular admin session -> Expect 403 Forbidden
// Test endpoint policies with superadmin session -> Expect 200 OK
console.log("Menjalankan verifikasi RBAC guards endpoint backend...");
```

- [ ] **Step 2: Run test to verify failure**

Run: `node docs/scripts/backend/test-admin-rbac-guards.mjs`  
Expected: FAIL before backend controllers updated.

- [ ] **Step 3: Update `admin.controller.ts` with explicit `@Roles('superadmin')`**

1. Pada endpoint `getSecurityConfig` dan `updateSecurityConfig`, ubah guard menjadi `@Roles('superadmin')`.
2. Pastikan rute manajemen user (`getUsers`, `createInvite`) tetap terbuka untuk `@Roles('admin', 'superadmin')`.
3. Tambahkan endpoint `getTaxConfig` dan `updateTaxConfig` pada `admin.controller.ts` di bawah proteksi `@Roles('superadmin')` yang membaca/menulis key `finance.tax_percent` di tabel `master.t_mtr_app_config`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node docs/scripts/backend/test-admin-rbac-guards.mjs`  
Expected: PASS (403 untuk admin biasa pada rute security & tax, 200 untuk superadmin).

- [ ] **Step 5: Commit**

```bash
git add backend/src/features/admin/admin.controller.ts backend/src/features/admin/admin-users.service.ts docs/scripts/backend/test-admin-rbac-guards.mjs
git commit -m "feat(security): enforce superadmin rbac guards on sensitive configuration endpoints"
```

---

### Task 3: Sidebar Search & Command Palette Modal Component (`⌘K`)

**Files:**
- Create: `frontend/src/features/admin/components/SidebarSearch.tsx`
- Create: `frontend/src/features/admin/components/CommandPaletteModal.tsx`
- Test: `frontend/src/features/admin/__tests__/sidebar-search.check.mjs`

**Interfaces:**
- Consumes: `Search`, `Command` dari `lucide-react`, framer-motion.
- Produces: `SidebarSearch` (menampilkan search bar ramping dengan KBD badge `⌘K` saat open, dan icon button saat collapsed), `CommandPaletteModal` (modal dialog navigasi cepat dan pencarian mitra).

- [ ] **Step 1: Write the component test check**

```javascript
// frontend/src/features/admin/__tests__/sidebar-search.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const fileContent = fs.readFileSync('frontend/src/features/admin/components/SidebarSearch.tsx', 'utf-8');
assert(fileContent.includes('⌘K') || fileContent.includes('Ctrl+K'), 'Wajib memuat hint keyboard shortcut ⌘K');
assert(fileContent.includes('Search'), 'Wajib memuat icon Search dari lucide-react');

const modalContent = fs.readFileSync('frontend/src/features/admin/components/CommandPaletteModal.tsx', 'utf-8');
assert(modalContent.includes('onSelectTab'), 'CommandPaletteModal wajib menerima callback perpindahan tab');
console.log('PASS: SidebarSearch & CommandPaletteModal contract checks passed.');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node frontend/src/features/admin/__tests__/sidebar-search.check.mjs`  
Expected: FAIL (File belum dibuat).

- [ ] **Step 3: Implement `SidebarSearch.tsx` and `CommandPaletteModal.tsx`**

1. `SidebarSearch.tsx`:
   - Props: `isCollapsed: boolean; onOpenCommandPalette: () => void;`
   - Render input pill interaktif saat `!isCollapsed` dengan search icon di kiri dan kbd badge `⌘K` di kanan.
   - Render centered button `h-9 w-9` saat `isCollapsed` dengan tooltip "Pencarian (⌘K)".
2. `CommandPaletteModal.tsx`:
   - Modal backdrop dengan framer-motion `AnimatePresence`.
   - Menangkap shortcut keyboard global `keydown` (`e.metaKey && e.key === 'k' || e.ctrlKey && e.key === 'k'`).
   - Menyediakan opsi navigasi instan: "Pesanan Masuk", "Direktori Mitra", "Undangan VIP", "Kebijakan Diskon" (khusus superadmin), dan "Pengaturan Pajak" (khusus superadmin).

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/sidebar-search.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/admin/components/SidebarSearch.tsx frontend/src/features/admin/components/CommandPaletteModal.tsx frontend/src/features/admin/__tests__/sidebar-search.check.mjs
git commit -m "feat(admin-ui): add SidebarSearch and CommandPaletteModal with ⌘K shortcut"
```

---

### Task 4: Notification Center Flyout Drawer di Sidebar

**Files:**
- Create: `frontend/src/features/admin/components/SidebarNotification.tsx`
- Test: `frontend/src/features/admin/__tests__/sidebar-notification.check.mjs`

**Interfaces:**
- Consumes: `Bell`, `Package`, `Users`, `ShieldAlert`, `CheckCircle2` dari `lucide-react`.
- Produces: `SidebarNotification` (tombol interaktif di bawah search bar yang memicu slide-over drawer notifikasi).

- [ ] **Step 1: Write the failing test check**

```javascript
// frontend/src/features/admin/__tests__/sidebar-notification.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const content = fs.readFileSync('frontend/src/features/admin/components/SidebarNotification.tsx', 'utf-8');
assert(content.includes('Bell'), 'Wajib mengimpor Bell dari lucide-react');
assert(content.includes('unreadCount') || content.includes('notifications'), 'Wajib mendukung unreadCount dan daftar notifikasi');
console.log('PASS: SidebarNotification contract passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node frontend/src/features/admin/__tests__/sidebar-notification.check.mjs`  
Expected: FAIL (File not found).

- [ ] **Step 3: Implement `SidebarNotification.tsx`**

1. Buat tombol notifikasi yang adaptif terhadap status sidebar:
   - Mode Terbuka: baris ramping dengan label "Pusat Notifikasi" dan badge hitungan unread (misal `3` berwarna amber gold).
   - Mode Ciut: icon button `Bell` dengan dot merah/amber di pojok kanan atas.
2. Tambahkan flyout popover / slide-over drawer berisi 3 event utama:
   - Pesanan Masuk: Order baru knalpot full system (menunggu konfirmasi).
   - Kemitraan: Bengkel rekanan mendaftar via link VIP.
   - Keamanan: Parameter OTP aktif dan tersinkronisasi.
3. Tombol "Tandai Semua Sudah Dibaca" untuk mereset unread badge.

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/sidebar-notification.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/admin/components/SidebarNotification.tsx frontend/src/features/admin/__tests__/sidebar-notification.check.mjs
git commit -m "feat(admin-ui): add SidebarNotification flyout drawer with unread counter"
```

---

### Task 5: Operational Orders Dashboard Component (`OrdersTable.tsx`)

**Files:**
- Create: `frontend/src/features/admin/components/OrdersTable.tsx`
- Test: `frontend/src/features/admin/__tests__/orders-table.check.mjs`

**Interfaces:**
- Consumes: Font Outfit, Lucide React (`Package`, `Clock`, `Truck`, `CheckCircle2`, `MessageSquare`, `Filter`).
- Produces: Komponen tabel pesanan operasional lengkap dengan filter status manufaktur knalpot, badge Ready Stock vs PO/Custom, lead time countdown, dan integrasi tombol WhatsApp.

- [ ] **Step 1: Write the failing test check**

```javascript
// frontend/src/features/admin/__tests__/orders-table.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const content = fs.readFileSync('frontend/src/features/admin/components/OrdersTable.tsx', 'utf-8');
assert(content.includes('READY STOCK') || content.includes('PRE-ORDER'), 'Wajib memuat tipe pesanan Ready Stock vs Pre-Order');
assert(content.includes('wa.me') || content.includes('MessageSquare'), 'Wajib memuat integrasi WhatsApp untuk transparansi kustomer');
console.log('PASS: OrdersTable contract passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node frontend/src/features/admin/__tests__/orders-table.check.mjs`  
Expected: FAIL.

- [ ] **Step 3: Implement `OrdersTable.tsx`**

1. Tampilkan segmented status filter: `Semua`, `Menunggu Konfirmasi`, `Antrean Produksi & QC`, `Siap Kirim`, `Selesai`.
2. Struktur data baris pesanan memuat:
   - Nomor Pesanan (misal `#ARM-8821`).
   - Nama Pelanggan / Bengkel Mitra + nomor WhatsApp.
   - Item Knalpot (misal `ARM Exhaust ZX-25R Carbon Full System`).
   - Tipe Pesanan: `READY STOCK` (badge zinc netral) vs `PRE-ORDER / CUSTOM` (badge amber gold).
   - Estimasi Waktu Kirim (Target Dispatch Date) + Badge SLA ("Sisa 2 Hari", "Siap Hari Ini").
   - Total Nominal & Status Pembayaran.
   - Quick Action: Tombol icon WhatsApp (`MessageSquare`) yang langsung membuka chat WA dengan pesan update pengerjaan transparan, tombol ubah status resi, dan tombol lihat invoice.

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/orders-table.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/admin/components/OrdersTable.tsx frontend/src/features/admin/__tests__/orders-table.check.mjs
git commit -m "feat(admin-orders): add OrdersTable operational component with exhaust lead time & WhatsApp action"
```

---

### Task 6: Superadmin Tax Config Panel (`TaxConfigPanel.tsx`)

**Files:**
- Create: `frontend/src/features/admin/components/TaxConfigPanel.tsx`
- Test: `frontend/src/features/admin/__tests__/tax-config.check.mjs`

**Interfaces:**
- Consumes: Lucide React (`Receipt`, `Percent`, `ShieldCheck`, `Save`), `useNotice`.
- Produces: Panel konfigurasi tarif pajak PPN (default 11%), toggle faktur pajak otomatis, NPWP perusahaan, dan proteksi mutasi hanya untuk superadmin.

- [ ] **Step 1: Write the failing test check**

```javascript
// frontend/src/features/admin/__tests__/tax-config.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const content = fs.readFileSync('frontend/src/features/admin/components/TaxConfigPanel.tsx', 'utf-8');
assert(content.includes('taxPercent') || content.includes('PPN'), 'Wajib memuat form konfigurasi tarif PPN');
assert(content.includes('fakturPajak') || content.includes('NPWP'), 'Wajib memuat pengaturan faktur pajak / NPWP');
console.log('PASS: TaxConfigPanel contract passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node frontend/src/features/admin/__tests__/tax-config.check.mjs`  
Expected: FAIL.

- [ ] **Step 3: Implement `TaxConfigPanel.tsx`**

1. Form pengaturan tarif pajak PPN (input angka persentase dengan slider / input 0-100%).
2. Toggle "Sertakan PPN dalam Harga Katalog" (Include Tax vs Exclude Tax).
3. Field NPWP Perusahaan & Nama Badan Usaha untuk penerbitan faktur pajak otomatis bagi mitra distributor B2B.
4. Tombol "Simpan Konfigurasi Pajak" yang memanggil endpoint backend `/api/admin/tax` dengan feedback notice.

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/tax-config.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/admin/components/TaxConfigPanel.tsx frontend/src/features/admin/__tests__/tax-config.check.mjs
git commit -m "feat(admin-tax): add TaxConfigPanel for superadmin financial management"
```

---

### Task 7: Integrasi RBAC Opsi A di `AdminShell.tsx` & `/admin/page.tsx`

**Files:**
- Modify: `frontend/src/features/admin/components/AdminShell.tsx`
- Modify: `frontend/src/features/admin/types.ts`
- Modify: `frontend/src/features/admin/index.ts`
- Modify: `frontend/src/app/admin/page.tsx`
- Test: `docs/scripts/e2e/e2e-admin-superadmin-rbac.mjs`

**Interfaces:**
- Consumes: `user.role` ('admin' | 'superadmin'), `SidebarSearch`, `SidebarNotification`, `CommandPaletteModal`, `OrdersTable`, `TaxConfigPanel`.
- Produces: Dynamic sidebar navigation with strict Option A menu gating, full tab routing, and responsive morphing rail.

- [ ] **Step 1: Write E2E verification test**

```javascript
// docs/scripts/e2e/e2e-admin-superadmin-rbac.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const shellContent = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');
assert(shellContent.includes("user.role === 'superadmin'"), 'Wajib menerapkan pemeriksaan user.role === superadmin untuk menu sensitif');
assert(shellContent.includes('SidebarSearch'), 'Wajib memasang SidebarSearch di AdminShell');
assert(shellContent.includes('SidebarNotification'), 'Wajib memasang SidebarNotification di AdminShell');
assert(shellContent.includes('OrdersTable'), 'Wajib memasang OrdersTable untuk tab orders');

const pageContent = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');
assert(pageContent.includes("user.role !== 'admin' && user.role !== 'superadmin'"), 'Page admin wajib mengizinkan role admin dan superadmin');
console.log('PASS: E2E Admin vs Superadmin RBAC & Shell integration passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node docs/scripts/e2e/e2e-admin-superadmin-rbac.mjs`  
Expected: FAIL before updates.

- [ ] **Step 3: Update `types.ts`, `AdminShell.tsx`, and `app/admin/page.tsx`**

1. Di `types.ts`: Tambahkan `'orders' | 'tax'` ke tipe `AdminShellTab`.
2. Di `app/admin/page.tsx`: Perbarui pengecekan sesi:
   `if (user.role !== 'admin' && user.role !== 'superadmin') redirect('/');`
3. Di `AdminShell.tsx`:
   - Pasang `<SidebarSearch />` dan `<SidebarNotification />` tepat di bawah `AnimatedSidebarHeader`.
   - Pisahkan grup menu menjadi:
     - `Operasional` (selalu aktif untuk Admin & Superadmin): Pesanan Masuk (`orders`), Direktori Mitra (`customers`), Undangan VIP (`invites`).
     - `Konfigurasi Sistem (Superadmin Only)`: Pengaturan Pajak (`tax`), Matriks Diskon (`policies`), Keamanan & RBAC (`security`). **Jika `user.role !== 'superadmin'`, grup ini sama sekali tidak dirender (Opsi A dipenuhi).**
   - Di area konten utama: Render `<OrdersTable />` saat tab `orders` aktif, dan `<TaxConfigPanel />` saat tab `tax` aktif.

- [ ] **Step 4: Run E2E test & Next.js production build check**

Run:
```bash
node docs/scripts/e2e/e2e-admin-superadmin-rbac.mjs
npm --prefix frontend run build
```
Expected: PASS (0 type errors, Next.js build sukses).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/admin/ frontend/src/app/admin/page.tsx docs/scripts/e2e/e2e-admin-superadmin-rbac.mjs
git commit -m "feat(admin-shell): integrate clean rbac gating, sidebar search, notification center, and orders tab"
```
