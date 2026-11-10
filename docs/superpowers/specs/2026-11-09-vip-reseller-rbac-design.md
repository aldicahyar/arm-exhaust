# Spesifikasi Desain: VIP Reseller & RBAC System (By-Invitation Only)
**ARM Exhaust — High-Performance Exhaust & Racing Systems**  
*Tanggal: 9 November 2026*  
*Status: Proposal Menunggu Persetujuan*

---

## 1. Latar Belakang & Tujuan (Intent & Why)

ARM Exhaust memiliki model bisnis ganda:
1. **B2C (Ritel)**: Pengendara motor umum yang membeli knalpot satuan dengan harga ritel.
2. **B2B (Reseller & Bengkel Rekanan)**: Bengkel, speed shop, dan toko variasi yang membeli secara berkala dalam jumlah banyak untuk stok dan jasa pemasangan.

**Masalah**: Jika pendaftaran reseller dibuka secara publik di website, pembeli ritel akan membanjiri form pendaftaran demi mendapatkan harga murah untuk konsumsi pribadi. Ini merusak margin keuntungan bengkel rekanan resmi dan memicu perang harga (*price dumping*).

**Tujuan**: Membangun sistem **Private / Limited Access RBAC (Role-Based Access Control)** dengan estetika **Bespoke Motorsport Luxury (Anti-Slop)** yang memungkinkan:
- Admin menaikkan role pengguna yang sudah ada menjadi `reseller` secara instan dari dashboard admin.
- Admin meng-generate **Tokenized VIP WhatsApp Invite Link** berbatas waktu untuk dikirimkan secara privat ke pemilik bengkel yang sudah terverifikasi secara offline.
- Pemilik bengkel yang mengklaim link tersebut langsung di-upgrade menjadi `reseller` dengan hak akses harga grosir dan badge kehormatan di navbar.

---

## 2. Sasaran (Goals, Non-Goals, & Anti-Goals)

### Goals
- **Zero Public Leakage**: Tidak ada tombol pendaftaran reseller publik di beranda maupun navbar umum.
- **Dynamic & Extensible Roles**: Sistem role tidak terkunci statis hanya pada 3 role saja. Role disimpan dalam tabel master (`master.t_mtr_roles`) sehingga penambahan role baru di masa depan (misal: `distributor`, `mechanic`, `warehouse`) dapat dibuat secara dinamis lengkap dengan persentase diskon dan hak aksesnya.
- **Cryptographic One-Time Invite**: Link undangan menggunakan token acak ber-entropy tinggi (64-character URL-safe) dengan batasan masa berlaku (*expiration*) dan kuota penggunaan (*one-time use*).
- **Direct Role Assignment**: Admin dapat mencari pengguna berdasarkan email/nama di `/admin` dan mengubah peran secara instan.
- **Bespoke Motorsport Visuals**: Desain halaman VIP dan badge navbar menggunakan palet stealth matte `#0F0F11`, aksen emas balap gelap/bronze `#D97706` / `#F59E0B`, dan tipografi teknis presisi tanpa visual kartun/warna-warni murah (*Anti-AI Slop*).

### Non-Goals
- Tidak membangun sistem pengajuan formulir publik mandiri untuk pengunjung luar.

### Anti-Goals
- **No Hardcoded Roles**: Menghindari pengkodean peran yang kaku di dalam `if/else` atau enum statis agar sistem dapat beradaptasi saat ARM Exhaust berkembang.
- **Anti-Slop**: Menghindari gradien pelangi mencolok, kartu melompat (*layout shift*), animasi berlebihan yang lambat, atau teks marketing generik.
- **No Token Guessing**: Token undangan tidak boleh berupa ID sekuensial (misal `1, 2, 3`) melainkan kriptografis acak `crypto.randomBytes(32).toString('hex')`.

---

## 3. Pendekatan yang Dipilih (Selected Approach: Opsi 3 Kombinasi)

Admin memiliki 2 jalur untuk mengelola reseller:
1. **Jalur Cepat (Direct Upgrade)**: Mengubah dropdown role user di tabel manajemen pengguna `/admin`.
2. **Jalur Undangan VIP (Tokenized Invite Link)**: Membuat tautan berbatas waktu (misal: valid 48 jam) untuk dibagikan via WhatsApp ke mitra bengkel baru.

---

## 4. Rincian Teknis & Skema Database

### 4.1 Skema Database PostgreSQL

#### A. Tabel Master Peran Dinamis (`master.t_mtr_roles`)
Tabel ini membuat penambahan role di masa depan menjadi 100% dinamis tanpa mengubah source code:
```sql
CREATE TABLE master.t_mtr_roles (
    id VARCHAR(30) PRIMARY KEY, -- 'customer', 'reseller', 'admin', 'distributor', 'mechanic', dll
    name VARCHAR(50) NOT NULL,
    description TEXT,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    can_access_admin BOOLEAN NOT NULL DEFAULT FALSE,
    can_access_b2b BOOLEAN NOT NULL DEFAULT FALSE,
    badge_style JSONB NOT NULL DEFAULT '{"bg": "#1C180A", "border": "#B45309", "text": "#F59E0B"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed role awal
INSERT INTO master.t_mtr_roles (id, name, description, discount_percent, can_access_admin, can_access_b2b, badge_style)
VALUES 
  ('customer', 'Customer', 'Pembeli ritel reguler', 0.00, FALSE, FALSE, '{"bg": "#18181B", "border": "#27272A", "text": "#A1A1AA"}'),
  ('reseller', 'Reseller Official', 'Bengkel rekanan resmi B2B', 20.00, FALSE, TRUE, '{"bg": "#1C180A", "border": "#B45309", "text": "#F59E0B"}'),
  ('admin', 'Administrator', 'Pengelola sistem & inventori', 0.00, TRUE, TRUE, '{"bg": "#1C0D0F", "border": "#7F1D1D", "text": "#E81828"}')
ON CONFLICT (id) DO NOTHING;
```

#### B. Tabel Undangan VIP Reseller (`transaction.t_trx_reseller_invites`)
```sql
CREATE TABLE transaction.t_trx_reseller_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    partner_name VARCHAR(120) NOT NULL,
    partner_phone VARCHAR(30),
    role_to_grant VARCHAR(30) NOT NULL DEFAULT 'reseller' REFERENCES master.t_mtr_roles(id),
    created_by UUID REFERENCES master.t_mtr_users(id) ON DELETE SET NULL,
    max_uses INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    claimed_at TIMESTAMPTZ,
    claimed_by_user_id UUID REFERENCES master.t_mtr_users(id) ON DELETE SET NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reseller_invites_token ON transaction.t_trx_reseller_invites(token);
CREATE INDEX idx_reseller_invites_active ON transaction.t_trx_reseller_invites(expires_at, is_revoked, used_count);
```

---

### 4.2 Endpoint Backend (NestJS)

1. **Admin Management Endpoints (`@Roles('admin')`)**:
   - `GET /api/admin/users`: Daftar pengguna (pagination, search by name/email, filter by role).
   - `PATCH /api/admin/users/:id/role`: Update role user (`role: 'customer' | 'reseller' | 'admin'`).
   - `POST /api/admin/reseller-invites`: Buat token undangan baru:
     - Body: `{ partnerName: string, partnerPhone?: string, expiresInHours: number }`
     - Returns: `{ token, inviteUrl, expiresAt }`
   - `GET /api/admin/reseller-invites`: Daftar semua undangan aktif, kedaluwarsa, dan terpakai.
   - `DELETE /api/admin/reseller-invites/:id`: Batalkan (*revoke*) undangan seketika.

2. **VIP Claim Endpoints (Fresh Re-Authentication Enforced)**:
   - `GET /api/reseller/invite-info?token=...`: Cek validitas token sebelum klaim (mengembalikan nama bengkel & sisa masa berlaku, atau 404/410 jika expired/revoked/sudah terpakai). Tidak mengekspos data sensitif.
   - `POST /api/reseller/claim-invite`: Klaim undangan dengan **autentikasi ulang wajib** (Fresh Re-Authentication):
     - Body: `{ token: string, credential?: string, email?: string, password?: string }`
     - Backend memverifikasi kredensial baru (via Google ID Token atau Email+Password), mencocokkan identitas, meng-upgrade role user ke `reseller` (atau role target), mencatat `claimed_by_user_id`, membakar token (*burn one-time token*), dan menerbitkan sesi baru dengan role yang sudah terangkat.

---

### 4.3 Desain Antarmuka Frontend (Next.js)

#### A. Halaman Undangan VIP (`/reseller/vip-join?token=...`)
* **Layout**: Dark Monolith Split-Screen atau Centered Monolith Card berestetika balap presisi.
* **Header**: Badge khusus *ARM EXHAUST B2B NETWORK • INVITATION*.
* **Greeting**: *"Official Partner Invitation for: [Nama Bengkel]"*.
* **Status**: Indikator hitung mundur masa berlaku token (*"Invite expires in: 47h 58m"*).
* **Action (Mandatory Fresh Re-Authentication — Anti-Hijacking)**:
  - **Semua pengguna WAJIB login ulang secara eksplisit** saat mengklaim link VIP, meskipun browser sedang memiliki cookie sesi aktif sebelumnya.
  - **Alasan Keamanan (*Why*)**:
    1. *Anti-Accidental Hijacking*: Menghindari token bocor atau tertukar jika link dibuka di perangkat kantor/bersama yang sedang login akun customer lain.
    2. *Proof of Fresh Intent*: Memastikan pemilik bengkel secara sadar memverifikasi identitasnya saat itu juga (via Google SSO 1-klik atau Email+Password).
    3. *Immediate Invalidation*: Begitu login ulang sukses, token seketika hangus (*burned*), dan cookie sesi lama diperbarui ke role `reseller`.
* **Feedback**: Dynamic Island notification: *"Congratulations [Nama Bengkel]! Official Reseller Status Activated."*

#### B. Dashboard Admin (`/admin`)
* **Tab 1**: *Security & Rate Limiting* (Konfigurasi keamanan OTP & batas percobaan yang sudah ada).
* **Tab 2**: *User & Role Management* (Tabel pencarian pengguna dengan dropdown role instan).
* **Tab 3**: *VIP Reseller Invites* (Form cepat: Nama Bengkel, Durasi [24 Jam / 48 Jam / 7 Hari], tombol *Generate Link*, dan tombol 1-klik *Copy WhatsApp Invite Message*).

#### C. Navigasi & Badging (`HeaderTabs.tsx`)
* **Badge Reseller**:
  - Label: `RESELLER OFFICIAL`
  - Warna: Background gelap `#1C180A`, border emas motorsport `#B45309`, teks gold `#F59E0B`.
  - Menu profil menambahkan tautan: **"Katalog B2B Grosir"**.
* **Badge Admin**:
  - Label: `ADMIN`
  - Warna: Background gelap `#1C0D0F`, border merah balap `#7F1D1D`, teks `#E81828`.
  - Menu profil menambahkan tautan: **"Admin Control Panel"**.

---

### 4.4 Mesin Diskon Dinamis Reseller (Dynamic Benefit Engine)

Menghindari *hardcoding* diskon pada kode sumber program. Diskon dan batasan minimum order reseller diatur secara dinamis melalui tabel `master.t_mtr_app_config`:

1. **Kunci Konfigurasi Global**:
   - `reseller.discount_percent`: Persentase potongan harga grosir untuk semua knalpot/part (Default: `20` = 20%, min: 5%, max: 50%).
   - `reseller.min_order_qty`: Batas minimum pembelian kuantiti per checkout untuk mendapatkan harga reseller (Default: `1` pcs, min: 1, max: 20).
2. **Pengaturan via Dashboard Admin (`/admin`)**:
   - Admin dapat mengubah persentase diskon kapan saja (misal: naik ke 25% saat promo awal tahun, atau turun ke 18% saat bahan baku naik) melalui antarmuka slider/input numerik di Admin Dashboard tanpa perlu restart server atau redeploy kode.
3. **Penerapan Real-time di Katalog & Checkout**:
   - Saat user dengan role `reseller` membuka katalog atau checkout:
     $$\text{Harga Reseller} = \text{Harga Ritel} \times \left(1 - \frac{\text{reseller.discount\_percent}}{100}\right)$$
   - Tampilan di katalog menyajikan harga ritel tercoret dan harga B2B khusus dengan badge tag margin (`B2B PARTNER MARGIN: 20% OFF`).


---

## 5. Rencana Pengujian & Verifikasi

1. **Unit Test Backend**:
   - Pembuatan token invite dengan berbagai durasi (24 jam, 48 jam).
   - Proteksi token: token kadaluwarsa atau sudah terpakai harus me-reject klaim dengan HTTP 410 Gone / 404 Not Found.
   - Perubahan role user via `PATCH /api/admin/users/:id/role` terisolasi hanya untuk user ber-role `admin`.
2. **End-to-End Test**:
   - Admin membuat link undangan untuk "Bengkel Motor Anugerah".
   - Link dibuka di browser incognito / tab baru.
   - User mendaftar via Google SSO dari link tersebut.
   - User seketika mendapatkan role `reseller`, badge emas muncul di header navbar, dan token berstatus *Claimed*.
3. **Audit Anti-Slop**:
   - Memastikan rasio kontras warna emas `#F59E0B` memenuhi standar aksesibilitas WCAG AA pada latar belakang gelap `#0F0F11`.
