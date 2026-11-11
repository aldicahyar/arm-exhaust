# Short Design: Invisible Scrollbar, Scroll Repair & Motion Elevation

**Tanggal:** 2026-11-11  
**Status:** Menunggu Persetujuan Pengguna  
**Topik:** Perbaikan Bug Scrolling Macet, Penghilangan Scrollbar Default (Minimalist Clean), dan Animasi Dynamic Header Elevation di Admin Portal ARM Exhaust.

---

## 1. Intent & Konteks (The Why)
Pengguna mendapati bahwa scroll di dashboard admin terasa mati/macet, dan menghendaki agar batang scrollbar (*scrollbar track*) dihilangkan sepenuhnya demi menjaga estetika *Stealth Luxe* yang bersih dan modern, dilengkapi dengan animasi halus sebagai pengganti indikator scroll visual.

Akar masalah scrolling macet disebabkan oleh Lenis (`SmoothScroll.tsx`) yang membajak event mousewheel di level `window`, sementara portal admin menggunakan arsitektur app-shell dengan inner container `h-screen overflow-y-auto`. Selain itu, ketiadaan aturan `scrollbar-none` di Windows Chrome/Edge memunculkan batang abu-abu tebal 17px yang mengganggu tampilan.

---

## 2. Goals & Non-Goals

### Goals
1. **Perbaikan Fungsionalitas Scrolling (Scroll Repair):**
   - Menambahkan atribut `data-lenis-prevent` pada container konten utama [`AdminShell.tsx`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/features/admin/components/AdminShell.tsx).
   - Memastikan `overscroll-behavior-y: contain` dan `touch-action: pan-y` aktif agar roda mouse, trackpad, dan layar sentuh dapat menggulir halaman dengan mulus tanpa hambatan.
2. **Penghilangan Scrollbar (Pure Invisible / Zero Scrollbar):**
   - Menambahkan utilitas CSS `.scrollbar-none` di [`globals.css`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/app/globals.css) yang kompatibel lintas peramban (Chrome, Edge, Safari, Firefox).
   - Menerapkan `.scrollbar-none` pada seluruh container gulir di admin: canvas utama, sidebar navigation, dan dialog popover/modal.
3. **Animasi Dynamic Topbar Elevation & Content Reveal:**
   - Topbar header mendeteksi posisi scroll secara reaktif.
   - Saat scroll = 0: Topbar transparan/flat menyatu dengan kanvas latar belakang.
   - Saat scroll > 10px: Topbar otomatis bertransisi menggunakan Framer Motion ke mode melayang (`bg-white/85 backdrop-blur-md border-b border-zinc-200 shadow-xs`).
   - Memberikan transisi fade-in halus saat berpindah antar tab admin.

### Non-Goals
- Tidak merubah API backend, skema Prisma, atau alur otentikasi sesi.
- Tidak merubah fungsionalitas komponen tabel atau form input.

---

## 3. Pendekatan yang Dipertimbangkan (Approaches)
1. *Pendekatan 2 (Floating Micro-Pill Indicator):* Menggantikan scrollbar dengan garis mikro 3px yang auto-hide. *(Dieliminasi karena pengguna secara spesifik meminta bersih total dari segala bentuk scrollbar).*
2. *Pendekatan 1 (Pure Invisible + Dynamic Header Elevation — TERPILIH):* Scrollbar ditiadakan 100%, scrolling mousewheel dipulihkan sepenuhnya, dan affordance visual digantikan oleh animasi blur/elevation dinamis pada topbar.

---

## 4. Rincian Teknis Perubahan

### A. CSS Utility di [`globals.css`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/app/globals.css)
```css
/* Utilitas cross-browser untuk menyembunyikan scrollbar tanpa mematikan scrolling */
.scrollbar-none::-webkit-scrollbar {
  display: none;
  width: 0px;
  height: 0px;
}
.scrollbar-none {
  -ms-overflow-style: none; /* IE & Edge */
  scrollbar-width: none; /* Firefox */
}
```

### B. Perbaikan Container di [`AdminShell.tsx`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/frontend/src/features/admin/components/AdminShell.tsx)
1. Ganti container konten:
   ```tsx
   <div 
     ref={scrollContainerRef}
     data-lenis-prevent="true"
     onScroll={handleScroll}
     className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overscroll-y-contain scrollbar-none bg-[#f8f9fa]"
   >
   ```
2. State `isScrolled` pada Topbar:
   - Pantau `scrollTop > 12` untuk menambahkan kelas `bg-white/90 backdrop-blur-md shadow-xs border-zinc-200`.

### C. Verifikasi
- Pengujian manual: Memastikan roda mouse dapat menggulir tabel tanpa ada batang scrollbar abu-abu di sisi kanan.
- Verifikasi build: `npm --prefix frontend run build` (0 error).
