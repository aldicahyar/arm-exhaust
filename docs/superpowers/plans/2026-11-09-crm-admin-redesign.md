# CRM Admin Panel Redesign Implementation Plan (Dribbble Shot 25741427)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan perombakan total UI/UX halaman Admin CRM ARM Exhaust (`/admin`) dengan presisi tinggi mengacu pada **Dribbble Shot 25741427 (Design Veli)**: Metrik KPI ribbon, toolbar pencarian & filter, tabel data densitas tinggi non-slop, slide-over customer detail drawer (440px), dan modal pembuatan undangan VIP WhatsApp.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, TypeScript, Heroicons / SVG Icons.

**Spec Reference:** [`docs/superpowers/specs/2026-11-09-crm-admin-redesign-design.md`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/docs/superpowers/specs/2026-11-09-crm-admin-redesign-design.md)

---

## Global Design Standards (Anti-AI-Slop Manifesto)

1. **Strict Palette Consistency:**
   - Canvas: `#0F0F11` (Matte carbon deep black).
   - Surface/Cards: `#141416` (Elevated dark charcoal).
   - Drawer/Elevated: `#18181C` with subtle backdrop blur (`backdrop-blur-md`).
   - Borders: `#2B2B32` (Thin, crisp 1px hairline border, no fuzzy drop-shadows).
   - Primary Accent: `#E81828` (Race Red).
   - Reseller VIP Accent: `#F59E0B` (Amber gold telemetry).
   - Distributor Accent: `#10B981` (Emerald green).
   - Muted Labels: `#8A8F98` and `#9AA0A8`.
2. **Typography Hierarchy:**
   - Inter / Geist Sans untuk nama mitra, headline, dan label UI.
   - JetBrains / Geist Mono (`font-mono`) untuk email, nomor telepon, ID, persentase diskon, dan tanggal.
3. **Ergonomics & Responsiveness:**
   - Slide-over drawer selebar 440px di desktop, full-width bottom-sheet di mobile (< 768px).
   - Keyboard accessible: Tombol `Escape` menutup drawer dan modal.
   - Zero layout shifts (CLS < 0.05).

---

## Tasks Breakdown

- [x] **Task 1: Type Definitions & Metrics Ribbon Component**
  - Create: `frontend/src/features/admin/types.ts`
  - Create: `frontend/src/features/admin/components/CrmMetricsRibbon.tsx`
  - Produces: 4 kartu metrik (Total Akun, Reseller VIP 20%, Distributor 35%, Undangan Pending).

- [x] **Task 2: Actionable Toolbar & VIP Invite Modal Component**
  - Create: `frontend/src/features/admin/components/CrmToolbar.tsx`
  - Create: `frontend/src/features/admin/components/VipInviteModal.tsx`
  - Produces: Bilah pencarian debounce, dropdown filter role, dan modal pembuatan token VIP dengan tombol langsung WhatsApp.

- [x] **Task 3: Slide-Over Customer Detail Drawer Component**
  - Create: `frontend/src/features/admin/components/CustomerDetailDrawer.tsx`
  - Produces: Panel geser kanan 440px dengan info kontak lengkap, tombol chat WhatsApp 1-klik, rincian diskon aktif (`master.t_mtr_discount_policies`), dan role switcher cepat.

- [x] **Task 4: High-Density CRM Data Table & Integration**
  - Modify: `frontend/src/features/admin/components/UserManagementTable.tsx`
  - Modify: `frontend/src/features/admin/components/AdminTabs.tsx`
  - Modify: `frontend/src/features/admin/index.ts`
  - Modify: `frontend/src/app/admin/page.tsx`
  - Produces: Halaman CRM terintegrasi penuh sesuai Dribbble Shot 25741427.

- [x] **Task 5: Frontend Build & UI Verification**
  - Verify: `npm --prefix frontend run build` (Turbopack compile bersih 0 error).
  - Verify: E2E check flow login admin -> buka `/admin` -> periksa rendering komponen.
