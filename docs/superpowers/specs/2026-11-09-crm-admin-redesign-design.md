# Design Specification: CRM Admin Panel Redesign (Dribbble Shot 25741427)

> **Status:** PENDING USER APPROVAL  
> **Topic:** Redesign Halaman CRM & Admin Panel (`/admin`) Mengacu pada Dribbble Shot 25741427 (Design Veli)  
> **Date:** 2026-11-09  
> **Author:** Antigravity AI & User Pair Programming  
> **Primary Reference:** [Dribbble Shot 25741427: CRM - Admin Panel Customers List Page](https://dribbble.com/shots/25741427-CRM-Admin-Panel-Customers-List-Page)  
> **Secondary Reference:** [Dribbble Shot 26065830: CRM Dashboard - Customers Page](https://dribbble.com/shots/26065830-CRM-Dashboard-Customers-Page)

---

## 1. Executive Summary & Goals

### 1.1 Background & Problem Statement
Halaman Admin ARM Exhaust saat ini (`/admin`) memiliki tampilan fungsional minimalis yang terasa kaku dan datar (3 tab horizontal sederhana, tabel HTML dasar, dan modal pop-up kecil di tengah). Admin kesulitan memantau metrik performa kemitraan, melihat detail informasi bengkel secara komprehensif, maupun melakukan tindakan cepat seperti menghubungi bengkel via WhatsApp atau memantau kebijakan diskon aktif.

### 1.2 Core Objectives
Mentransformasi halaman `/admin` menjadi **CRM Admin Panel Modern Kelas Dunia** yang secara setia mengadaptasi tata letak dan ergonomi antarmuka **Dribbble Shot 25741427**:
1. **Summary Metrics Ribbon:** 4 kartu metrik CRM di bagian atas untuk visibilitas cepat status kemitraan.
2. **Actionable Filter Toolbar:** Pencarian instan (nama/email/telepon), dropdown filter role, filter wilayah/kota, dan tombol primer `[+ Buat Undangan VIP]`.
3. **High-Density Data Table:** Baris pengguna dua tingkat (nama mitra + avatar inisial, email), status peranan dengan pill berkode warna, nomor kontak WhatsApp, dan tombol aksi per baris.
4. **Slide-Over Customer Inspector Drawer:** Panel detail geser mulus dari sisi kanan layar (lebar 440px) saat pengguna diklik, menyajikan info kontak lengkap, tombol 1-klik WhatsApp chat, daftar kebijakan diskon aktif dari `master.t_mtr_discount_policies`, dan role switcher cepat tanpa meninggalkan daftar tabel.
5. **Integrated VIP Invite Generator:** Akses instan pembuatan link token kemitraan B2B dari toolbar dengan fitur *Direct WhatsApp Dispatcher*.

---

## 2. Visual Architecture & Layout Wireframe

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: ARM EXHAUST CRM / Customers Directory                         [Admin: Mas Aldi 👤] [Keluar 🚪] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. SUMMARY METRICS RIBBON (4 KPI CARDS)                                                                │
│ ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐             │
│ │ 👥 Total Pelanggan│  │ 🏎️ Mitra VIP Aktif │  │ 🎟️ Undangan Pending│ │ 🏷️ Kebijakan Diskon│            │
│ │ 42 Akun           │  │ 18 Bengkel (20%)  │  │ 3 Belum Diklaim   │  │ 2 Aturan Aktif    │             │
│ │ +8% bulan ini     │  │ Margin Rata-rata  │  │ Expire < 48 Jam   │  │ Reseller & Distri │             │
│ └───────────────────┘  └───────────────────┘  └───────────────────┘  └───────────────────┘             │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. ACTION TOOLBAR                                                                                      │
│ [🔍 Cari nama, email, nomor HP...]   [Role: Semua ▾]   [Status: Semua ▾]       [+ Buat Undangan VIP]   │
├──────────────────────────────────────────────────────────────┬─────────────────────────────────────────┤
│ 3. HIGH-DENSITY CUSTOMER DATA TABLE                          │ 4. SLIDE-OVER INSPECTOR DRAWER (440px)  │
│ ┌───┬──────────────────────┬──────────────────┬────────────┐ │ (Muncul mulus dari kanan saat diklik)   │
│ │ # │ MITRA / PELANGGAN    │ ROLE & MARGIN    │ STATUS     │ │                                         │
│ ├───┼──────────────────────┼──────────────────┼────────────┤ │ 👤 Bengkel Speed Depok (ID: #USR-042)  │
│ │ 1 │ [BS] Bengkel Speed   │ [RESELLER 20%]   │ Aktif      │ │ ✉️ speed.depok@gmail.com                │
│ │   │      speed@gmail.com │                  │            │ │ 📍 Kota Depok, Jawa Barat               │
│ ├───┼──────────────────────┼──────────────────┼────────────┤ │─────────────────────────────────────────│
│ │ 2 │ [AR] Anugerah Racing │ [DISTRI 35%]     │ Aktif      │ │ 📞 KONTAK WHATSAPP CEPAT                │
│ │   │      anugerah@arm.id │                  │            │ │ [💬 Kirim WhatsApp: 081299887766]       │
│ ├───┼──────────────────────┼──────────────────┼────────────┤ │─────────────────────────────────────────│
│ │ 3 │ [BP] Budi Pratama    │ [CUSTOMER 0%]    │ Ritel      │ │ 🏷️ KEBIJAKAN DISKON AKTIF              │
│ │   │      budi@gmail.com  │                  │            │ │ • RESELLER_BASE_20 (Diskon 20% Grosir)  │
│ └───┴──────────────────────┴──────────────────┴────────────┘ │ • DEPOK_SPECIAL_10 (Promo Kota Depok)   │
│ [Halaman 1 dari 5]        Tampilkan: [10 ▾] Baris per halaman│ Efektif: 20% (Stacking: EXCLUSIVE)      │
│                                                              │─────────────────────────────────────────│
│                                                              │ 🔄 UBAH ROLE PENGGUNA                   │
│                                                              │ [Customer] [Reseller ✓] [Distributor]   │
│                                                              │ [Simpan Perubahan Role]                 │
└──────────────────────────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 3. Detailed Component Specifications

### 3.1 Component 1: `CrmMetricsRibbon`
Menampilkan 4 kartu ringkasan eksekutif di bagian atas:
1. **Total Akun Pelanggan:** Jumlah keseluruhan pengguna terdaftar di sistem.
2. **Mitra Reseller VIP (20%):** Jumlah akun aktif dengan role `reseller`.
3. **Mitra Distributor (35%):** Jumlah akun aktif dengan role `distributor`.
4. **Undangan VIP Menunggu Klaim:** Jumlah token undangan di `transaction.t_trx_reseller_invites` yang masih aktif dan belum kedaluwarsa.
- **Visual Style:** Surface background `#141416`, border `#2B2B32`, angka besar teks putih dengan sub-label font monospace abu-abu, dan aksen glowing dot.

### 3.2 Component 2: `CrmToolbar`
Bilah aksi di atas tabel data:
- **Search Bar Input:** Input teks dengan ikon pencarian SVG, mendukung pencarian debounce (300ms) untuk nama dan email.
- **Role Filter Dropdown:** Pilihan cepat `Semua Role`, `Customer`, `Reseller`, `Distributor`, `Admin`.
- **Primary CTA Button:** Tombol merah `[+ Buat Undangan VIP]` (`bg-[#E81828]` hover `bg-[#FF2B3C]`) yang membuka dialog generator undangan mitra.

### 3.3 Component 3: `CrmDataTable`
Tabel data densitas tinggi bergaya Dribbble Shot 25741427:
- **Kolom Pengguna (Dua Tingkat):**
  - Avatar lingkaran inisial huruf (misal `BS` untuk Bengkel Speed) dengan warna kontras.
  - Nama mitra / akun (teks tebal putih).
  - Email (teks font mono abu-abu halus di baris kedua).
- **Kolom Peran & Margin (Role Badge Pills):**
  - `Admin`: border `#7F1D1D`, background `#1C0D0F`, teks `#E81828`.
  - `Reseller`: border `#B45309`, background `#1C180A`, teks `#F59E0B` (Margin 20%).
  - `Distributor`: border `#065F46`, background `#06281E`, teks `#10B981` (Margin 35%).
  - `Customer`: border `#27272A`, background `#18181B`, teks `#A1A1AA` (0% Ritel).
- **Kolom Kontak / WhatsApp:**
  - Menampilkan nomor telepon dengan tombol ikon chat langsung.
- **Kolom Tanggal Bergabung:**
  - Tanggal akun dibuat format lokal Indonesia (`09 Nov 2026`).
- **Aksi Cepat Baris:**
  - Tombol panah/detail `[Lihat Detail ›]` yang memicu pembukaan slide-over drawer.
- **Pagination Bar:**
  - Menampilkan jumlah total baris, tombol halaman Sebelumnya / Berikutnya, dan pilihan limit baris per halaman.

### 3.4 Component 4: `CustomerDetailDrawer` (Right Slide-over Inspector)
Panel geser kanan (lebar 440px) yang terinspirasi langsung dari fitur utama Dribbble Shot 25741427:
- **Header:** Tombol tutup silang `[✕]`, avatar besar, nama pengguna, email, dan tanggal registrasi.
- **WhatsApp Direct Action:**
  - Tombol khusus: `[💬 Chat WhatsApp: 081299887766]` yang otomatis membuka `https://api.whatsapp.com/send?phone=...` di tab baru.
- **Active Pricing Policies & Margin Breakdown:**
  - Menampilkan persentase diskon efektif pengguna saat ini (misal `20.00%`).
  - Menampilkan kebijakan diskon yang cocok dari `master.t_mtr_discount_policies` (`RESELLER_BASE_20`, `DISTRIBUTOR_TIER_35`, atau promo kota).
- **Interactive Role Switcher:**
  - Pilihan role interaktif (Customer, Reseller, Distributor, Admin).
  - Tombol konfirmasi dengan state loading dan toast notifikasi sukses.
- **Security & Activity Meta:**
  - Tipe otentikasi (Google SSO atau Password/OTP), waktu terakhir diperbarui.

### 3.5 Component 5: `VipInviteModal`
Dialog modal cepat untuk membuat link undangan mitra VIP:
- Input: Nama Bengkel/Mitra, Nomor WhatsApp (opsional), Pilihan Target Role (Reseller 20% vs Distributor 35%), Masa Berlaku (24 Jam s/d 30 Hari).
- Output: Menampilkan URL token ber-enkripsi 64 karakter, tombol `[Salin Link 📋]`, dan tombol `[Kirim via WhatsApp 💬]` dengan pesan template otomatis.

---

## 4. Design Tokens & Styling Guide

| Token | Nilai Hex | Penggunaan |
|---|---|---|
| **Canvas Background** | `#0F0F11` | Background utama seluruh halaman CRM |
| **Card / Surface Background** | `#141416` | Background kartu metrik, tabel data, dan header |
| **Drawer Surface** | `#18181C` | Background panel samping kanan (elevated) |
| **Borders / Separators** | `#2B2B32` | Garis tepi tabel, kartu, dan divider panel |
| **Primary Brand Red** | `#E81828` | Tombol primer, indikator admin, hover state |
| **Telemetry Amber / Gold**| `#F59E0B` | Badge Reseller VIP (20%), highlight undangan |
| **Distributor Emerald** | `#10B981` | Badge Distributor Regional (35%), status online |
| **Text Primary** | `#FFFFFF` | Nama mitra, judul, angka metrik utama |
| **Text Secondary / Muted**| `#8A8F98` / `#9AA0A8` | Email, sub-label, deskripsi, tanggal |

---

## 5. Technical Implementation & File Structure

```text
frontend/src/features/admin/
├── components/
│   ├── AdminTabs.tsx                  (Diperbarui: Navigasi tab modern)
│   ├── CrmMetricsRibbon.tsx           (Baru: 4 Kartu Metrik CRM atas)
│   ├── CrmToolbar.tsx                 (Baru: Search, filter role/kota, CTA invite)
│   ├── CrmDataTable.tsx               (Baru/Refaktor: Tabel densitas tinggi Shot 25741427)
│   ├── CustomerDetailDrawer.tsx       (Baru: Panel geser samping kanan)
│   ├── VipInviteGenerator.tsx         (Diperbarui: Integrasi modal & WhatsApp dispatch)
│   └── SecurityConfigPanel.tsx        (Tetap: Pengaturan keamanan OTP & Rate Limit)
├── index.ts                           (Ekspor modul)
└── types.ts                           (Definisi tipe TypeScript CRM)
```

---

## 6. Backward Compatibility & Non-Breaking Guarantee

1. **API Endpoints:** Menggunakan endpoint yang sudah berjalan 100% lulus uji:
   - `GET /api/admin/users?search=...&role=...&page=...`
   - `PATCH /api/admin/users/:id/role`
   - `GET /api/admin/roles`
   - `GET /api/admin/reseller-invites`
   - `POST /api/admin/reseller-invites`
   - `POST /api/admin/reseller-invites/:id/revoke`
2. **Zero Breaking Changes:** Tidak mengubah kontrak payload backend apa pun.
3. **Responsive Handling:** Pada layar ponsel (< 768px), drawer kanan otomatis beralih menjadi full-width bottom sheet yang dapat digulir dengan nyaman.

---

## 7. Approval & Next Steps

Sesuai aturan kerja agentic TDD:
- [ ] User menyetujui dokumen spesifikasi desain ini.
- [ ] Setelah disetujui, buat Implementation Plan terperinci (`superpowers:writing-plans`).
- [ ] Eksekusi task demi task dengan pengujian dan build verifikasi bebas error.
