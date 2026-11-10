# Short Design: Sidebar Stealth Luxe (Monochrome & Amber Gold)

**Tanggal:** 2026-11-10  
**Status:** Menunggu Persetujuan Pengguna  
**Topik:** Pembaruan Palet Warna & Font Sidebar Admin ARM Exhaust (Opsi 3: Stealth Luxe)

---

## 1. Intent & Konteks (The Why)
Pengguna memilih **Opsi 3 (Monochrome Stealth & Gold / Stealth Luxe)** dengan font **Outfit** untuk menggantikan tema *Warm Minimalist Craft* (`Readex Pro` + krem) pada sidebar portal admin. Tujuannya adalah menghadirkan kesan mewah, modern, tajam, dan monokromatik khas brand otomotif premium, tanpa kehilangan fungsionalitas animasi *morphing rail* starc007 yang sudah terpasang.

## 2. Goals & Non-Goals
* **Goals:**
  * Memasang Google Font **`Outfit`** (bobot 400, 500, 600, 700) untuk tipografi sidebar dan admin console.
  * Menerapkan palet Stealth Luxe pada [`Sidebar.tsx`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/features/admin/components/ui/Sidebar.tsx) dan [`AdminShell.tsx`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/features/admin/components/AdminShell.tsx):
    * Background Sidebar: `#ffffff` (Pure White) dengan border `#e4e4e7` (Neutral Zinc).
    * Hover glider (`SharedLayoutBg`): `#f4f4f5` (Zinc 100).
    * Active pill: `#18181b` (Deep Charcoal Black) dengan teks putih kontras tinggi dan aksen bar `#d97706` (Amber Gold).
    * Badges: `#f4f4f5` untuk non-aktif, `#d97706` berteks hitam untuk aktif.
    * Logo box: Kotak hitam pekat `#18181b` berteks putih `ARM`.
  * Mempertahankan seluruh interaksi animasi beUI/starc007 (`Ctrl+B` toggle, morphing rail 68px, mobile drawer).
  * Menyelaraskan border dan aksen pada header topbar [`AdminShell.tsx`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/features/admin/components/AdminShell.tsx) agar serasi.
* **Non-Goals:**
  * Mengubah backend API NestJS, skema database, atau alur logika otentikasi.
  * Merombak struktur tabel data CRM atau form dialog yang sudah stabil.

## 3. Pendekatan yang Dipertimbangkan (Approaches)
1. *Opsi 1 (Dark Obsidian):* Sidebar hitam pekat kontras. (Dieliminasi karena pengguna lebih memilih nuansa bersih Opsi 3).
2. *Opsi 2 (Titanium Slate):* Nuansa abu-abu baja dingin. (Dieliminasi).
3. *Opsi 3 (Stealth Luxe — TERPILIH):* Sidebar putih bersih monokromatik dengan active pill hitam tegas dan aksen amber gold mewah berpadu font futuristik **Outfit**.

## 4. Rincian Teknis Perubahan
1. **Font:** Tambahkan `Outfit:wght@400;500;600;700` pada [`layout.tsx`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/app/layout.tsx) dan [`tailwind.config.ts`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/tailwind.config.ts).
2. **Sidebar:** Update token warna pada [`Sidebar.tsx`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/features/admin/components/ui/Sidebar.tsx) ke kelas Tailwind netral (`bg-white`, `border-zinc-200`, `text-zinc-900`, `bg-zinc-900`, aksen `bg-amber-600`).
3. **AdminShell:** Sesuaikan topbar dan background canvas ke `#f8f9fa` / `#ffffff` dengan border `#e4e4e7`.
4. **Verifikasi:** Jalankan `npm --prefix frontend run build` untuk memastikan 0 error.
