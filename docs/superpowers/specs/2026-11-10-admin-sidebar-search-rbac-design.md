# Full Design: Sidebar Search, Notification Center & RBAC Superadmin vs. Admin Operasional

**Tanggal:** 2026-11-10  
**Status:** Menunggu Persetujuan Pengguna  
**Topik:** Integrasi Sidebar Search, Pusat Notifikasi Sidebar, Pemisahan Role Superadmin & Admin Operasional, serta Akun Kredensial Superadmin.

---

## 1. Intent & Konteks (The Why)
Portal Admin ARM Exhaust memerlukan pemisahan tanggung jawab yang jelas antara **Superadmin** (pemilik bisnis / lead engineer yang mengatur parameter krusial seperti tarif pajak, dynamic pricing, matriks diskon, dan keamanan) dengan **Admin Operasional** (tim harian yang menangani pesanan masuk, verifikasi mitra bengkel, dan komunikasi pelanggan). 

Selain itu, navigasi sidebar ditingkatkan dengan **Sidebar Search** bergaya Linear/shadcn (`⌘K`) dan **Pusat Notifikasi** langsung di dalam sidebar agar admin langsung mengetahui ketika ada pesanan baru atau pendaftaran mitra tanpa perlu berpindah konteks. Sesuai keputusan pengguna, antarmuka admin biasa menggunakan **Opsi A (Sembunyikan Penuh / Clean)** agar admin operasional fokus pada tugasnya tanpa distraksi fitur superadmin.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
1. **Sidebar Search (`SidebarInput`):**
   - Menambahkan input pencarian ramping di bawah header sidebar dengan KBD shortcut `⌘K` / `Ctrl+K`.
   - Mendukung *morphing* otomatis saat sidebar diciutkan (mode icon rail 68px) menjadi tombol icon `Search` tunggal dengan tooltip.
   - Mengklik input atau menekan `⌘K` membuka Command Palette modal untuk pencarian cepat lintas menu, mitra, dan pesanan.
2. **Pusat Notifikasi di Sidebar:**
   - Memasang tombol `Notifikasi` (Icon `Bell` dengan badge unread count / amber dot) di bawah search bar.
   - Saat diklik, membuka flyout panel / drawer notifikasi berisi event real-time: Pesanan baru masuk, mitra baru registrasi, dan log keamanan.
3. **Pemisahan RBAC (Superadmin vs Admin):**
   - Mendaftarkan role `superadmin` di tabel database `master.t_mtr_roles` dengan kapabilitas penuh (`can_access_admin: true`, `can_access_b2b: true`).
   - Menerapkan **Opsi A**: Menyembunyikan menu konfigurasi sensitif (*Pengaturan Pajak*, *Kebijakan Diskon*, *Keamanan OTP*) dari user dengan role `admin`. Menu-menu ini hanya muncul untuk `superadmin`.
   - Mengamankan endpoint backend NestJS (`RolesGuard`) agar rute mutasi kebijakan harga, pajak, dan konfigurasi keamanan hanya dapat diakses oleh role `superadmin`.
4. **Akun Kredensial Superadmin:**
   - Menyediakan akun superadmin default melalui script database:
     - **Email:** `superadmin@armexhaust.id`
     - **Password:** `SuperAdmin123!` (dihash dengan `scrypt` ber-salt sesuai standar arsitektur ARM Exhaust).
     - **Role:** `superadmin`
5. **Modul Pesanan Masuk (Orders) & Pengaturan Pajak (Tax):**
   - Menambahkan tab navigasi `orders` (Pesanan Masuk) untuk Admin & Superadmin.
   - Menambahkan tab navigasi `tax` (Pengaturan Pajak/PPN) khusus Superadmin.

### Non-Goals
- Tidak merombak sistem otentikasi Google SSO atau alur OTP registrasi yang sudah stabil.
- Tidak mengubah skema data tabel CRM pelanggan yang sudah berjalan.

### Anti-Goals
- Tidak boleh menampilkan menu yang terkunci/disabled bagi admin biasa jika user sudah memilih Opsi A (harus bersih dan disembunyikan sepenuhnya).
- Tidak boleh membiarkan endpoint sensitif di backend hanya dilindungi di sisi frontend (harus ada proteksi `RolesGuard('superadmin')` di NestJS).

---

## 3. Pendekatan yang Dipertimbangkan (Approaches)

1. **Gating Menu Admin Biasa:**
   - *Opsi B (Locked / Icon Gembok):* Menampilkan menu superadmin dalam keadaan disabled. *(Dieliminasi sesuai arahan pengguna agar antarmuka tidak bising).*
   - *Opsi A (Sembunyikan Penuh / Clean - TERPILIH):* Menu superadmin sama sekali tidak dirender untuk role `admin`. Admin hanya melihat menu operasional harian.

2. **Integrasi Notifikasi:**
   - *Pendekatan Topbar:* Meletakkan lonceng notifikasi di top header sebelah kanan. *(Dieliminasi karena pengguna meminta dipusatkan di sidebar bersama search bar).*
   - *Pendekatan Sidebar Sub-header (TERPILIH):* Diletakkan di bawah search bar sidebar, serasi dengan estetika *Stealth Luxe*, dan otomatis ber-morphing menjadi icon bell saat sidebar diciutkan.

---

## 4. Rincian Teknis Arsitektur & Spesifikasi

### A. Skema Database & Migration (`master.t_mtr_roles` & `master.t_mtr_users`)
1. **Role Baru `superadmin`:**
   ```sql
   INSERT INTO master.t_mtr_roles (id, name, description, discount_percent, can_access_admin, can_access_b2b, badge_style)
   VALUES (
     'superadmin', 
     'Super Administrator', 
     'Pemilik sistem, konfigurasi pajak, dynamic pricing, dan kontrol penuh', 
     0.00, 
     TRUE, 
     TRUE, 
     '{"bg": "#18181B", "border": "#D97706", "text": "#D97706"}'::jsonb
   ) ON CONFLICT (id) DO UPDATE SET can_access_admin = TRUE, can_access_b2b = TRUE;
   ```
2. **Akun Superadmin Default:**
   ```sql
   -- Password hash scrypt untuk 'SuperAdmin123!'
   INSERT INTO master.t_mtr_users (name, email, password_hash, role)
   VALUES ('Superadmin ARM', 'superadmin@armexhaust.id', '<hash>', 'superadmin')
   ON CONFLICT (email) DO UPDATE SET role = 'superadmin';
   ```

### B. Backend API Protection (`RolesGuard`)
* Endpoint `/api/admin/policies/**` (Dynamic Pricing) -> `@Roles('superadmin')`
* Endpoint `/api/admin/security/config` (OTP & Rate limits) -> `@Roles('superadmin')`
* Endpoint `/api/admin/tax/**` (Pengaturan PPN/Tax) -> `@Roles('superadmin')`
* Endpoint `/api/admin/users` (Daftar mitra) -> `@Roles('admin', 'superadmin')`
* Endpoint `/api/admin/invites` (Undangan VIP) -> `@Roles('admin', 'superadmin')`
* Endpoint `/api/admin/orders` (Pesanan Masuk) -> `@Roles('admin', 'superadmin')`

### C. Sidebar Components (`frontend/src/features/admin/`)
1. **`SidebarSearch.tsx`:**
   - Ditempatkan di header [`Sidebar.tsx`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/features/admin/components/ui/Sidebar.tsx).
   - Menampilkan input dengan shortcut `⌘K` saat terbuka, dan icon button `Search` saat `collapsed`.
2. **`SidebarNotification.tsx`:**
   - Tombol interaktif dengan icon `Bell`, counter badge angka, dan popover flyout drawer.
3. **Menu Filtering Dinamis berdasarkan Role di [`AdminShell.tsx`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/features/admin/components/AdminShell.tsx):**
   ```ts
   const operationalSection = {
     title: 'Operasional',
     items: [
       { id: 'orders', label: 'Pesanan Masuk', icon: <Package className="h-4 w-4" />, badge: '5' },
       { id: 'customers', label: 'Direktori Mitra', icon: <Users className="h-4 w-4" /> },
       { id: 'invites', label: 'Undangan VIP', icon: <Ticket className="h-4 w-4" /> },
     ]
   };

   const superadminSection = user.role === 'superadmin' ? {
     title: 'Konfigurasi Sistem',
     items: [
       { id: 'tax', label: 'Pengaturan Pajak (Tax)', icon: <Receipt className="h-4 w-4" /> },
       { id: 'policies', label: 'Matriks Diskon', icon: <Percent className="h-4 w-4" /> },
       { id: 'security', label: 'Keamanan & RBAC', icon: <ShieldCheck className="h-4 w-4" /> },
     ]
   } : null;
   ```
4. **Halaman `/admin/page.tsx`:**
   - Validasi sesi: `if (user.role !== 'admin' && user.role !== 'superadmin') redirect('/');`

### D. Keputusan Teknis Arsitektur & Pipeline Pesanan Knalpot (Best Practice)
1. **Pusat Notifikasi:** Menggunakan arsitektur *event-driven notification center* berbasis state lokal & event sinkronisasi data (tidak memerlukan WebSocket server tambahan yang berat untuk milestone ini).
2. **Command Palette (`⌘K`):** Berbasis client-side palette terintegrasi (`cmdk`/dialog) untuk navigasi instan antar tab, trigger modal cepat (seperti Undangan VIP), dan pencarian data lokal.
3. **Pengaturan Pajak (Tax):** Menggunakan tabel konfigurasi yang sudah ada `master.t_mtr_app_config` dengan key `finance.tax_percent` (default 11%) yang diproteksi khusus Superadmin.
4. **Pipeline Operasional Pesanan Knalpot (ARM Manufacturing Standard):**
   - **Tipe Pesanan:** Ready Stock (Langsung Kirim) vs. Pre-Order / Custom Fabrication (Estimasi 2-4 Hari Kerja).
   - **Status Workflow:**
     - `Menunggu Konfirmasi`: Order masuk baru, verifikasi pembayaran/PO bengkel.
     - `Antrean Produksi & QC`: Proses fabrikasi header, silencer, las cacing, dan uji presisi dudukan.
     - `Siap Kirim / Dikirim`: Pengemasan bubble wrap tebal + nomor resi kargo/ekspedisi.
     - `Selesai`: Pesanan diterima mitra/pelanggan.
   - **Estimasi Lead Time (Waktu Kirim):** Admin operasional dapat memantau dan mengubah tanggal estimasi kirim (*Dispatch Target*) dengan badge waktu responsif ("Sisa 2 Hari", "Siap Hari Ini", "Terlambat").

---

## 5. Rencana Pengujian & Verifikasi
1. **Migrasi Database:** Jalankan script migrasi dan verifikasi akun `superadmin@armexhaust.id` serta role `superadmin` tersimpan di database PostgreSQL.
2. **Uji Login & Proteksi Menu:**
   - Login dengan `admin@armexhaust.id`: Pastikan menu *Pajak*, *Diskon*, dan *Keamanan* **TIDAK MUNCUL** sama sekali di sidebar.
   - Login dengan `superadmin@armexhaust.id`: Pastikan seluruh menu muncul lengkap beserta badge Superadmin.
3. **Uji Interaksi Sidebar:**
   - Uji shortcut keyboard `Ctrl+K` / `⌘K` untuk membuka search modal.
   - Uji toggle collapse sidebar: pastikan search dan notifikasi berubah rapi menjadi icon rail tanpa error layout.
4. **Build Verification:** Jalankan `npm --prefix frontend run build` dan `npm --prefix backend run build` (0 error).
