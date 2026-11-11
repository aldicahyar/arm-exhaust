# Admin Sidebar Zero-Bugs Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki seluruh temuan bug visual, stacking context, dan usability pada Animated Sidebar ARM Exhaust admin portal sehingga mencapai standar kualitas zero-bugs dan responsif di semua perangkat.

**Architecture:** 
1. Portal Migration: Migrasikan slide-over notification drawer ke React Portal (`document.body`) dengan SSR mounting guard untuk mengeliminasi stacking context clash dengan sticky header.
2. Usability Hardening: Sediakan akses logout 1-klik yang ergonomis pada mode collapsed footer dengan micro-tooltip Stealth Luxe.
3. Component Polish: Hilangkan clipping hitbox `AnimatedSidebarRail` dan tambahkan instant micro-tooltips pada semua menu items saat collapsed.
4. Mobile Optimization: Tambahkan tombol tutup eksplisit `(X)` pada mobile drawer dan proteksi overflow teks breadcrumb.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons.

**Spec:** [`docs/superpowers/specs/2026-11-11-admin-sidebar-zero-bugs-design.md`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/docs/superpowers/specs/2026-11-11-admin-sidebar-zero-bugs-design.md)

## Global Constraints
- Estetika Stealth Luxe (#09090b, #141417, #f8a712, #eedec5) wajib konsisten.
- Seluruh interaksi harus aman dari SSR hydration mismatch (`mounted` guard untuk Portal).
- Tidak boleh ada perubahan yang merusak fungsi RBAC, search command palette, atau scroll isolation yang sudah ada.
- **STRICT GIT CONSTRAINT:** TIDAK BOLEH menjalankan `git commit` atau `git push`. Seluruh perubahan dibiarkan uncommitted di working copy untuk dikelola langsung oleh user.

## Review Focus
1. Notifikasi dibuka saat berada di tab manapun -> Drawer dan backdrop hitam menutupi seluruh layar tanpa ada teks topbar header yang bocor di atasnya.
2. Sidebar di-collapse ke mode ikon 68px -> Tombol logout tetap terlihat dan dapat diklik dalam 1 langkah di bawah avatar inisial.
3. Kursor diarahkan ke batas kanan sidebar -> Hitbox rail selebar 12px aktif penuh dengan kursor `col-resize` tanpa terpotong di tepi.
4. Kursor di-hover ke ikon menu saat collapsed -> Micro-tooltip gelap instan muncul seketika di samping ikon menu.
5. Emulasi mobile layar sempit (390px) -> Breadcrumb rapi tanpa bertabrakan dengan tombol CTA "+ Undang" dan mobile drawer memiliki tombol tutup `(X)`.

---

### Task 1: Portal-based Drawer in `SidebarNotification.tsx`

**Files:**
- Modify: `frontend/src/features/admin/components/SidebarNotification.tsx`
- Test: `frontend/src/features/admin/__tests__/sidebar-notification-portal.check.mjs`

**Interfaces:**
- Consumes: `createPortal` from `'react-dom'`.
- Produces: Slide-over drawer yang terbebas dari stacking context induk dan merender langsung di `document.body`.

- [ ] **Step 1: Write the failing test check**

```javascript
// frontend/src/features/admin/__tests__/sidebar-notification-portal.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const code = fs.readFileSync('frontend/src/features/admin/components/SidebarNotification.tsx', 'utf-8');
assert(code.includes('createPortal'), 'Wajib menggunakan createPortal untuk slide-over drawer');
assert(code.includes('document.body'), 'Wajib merender portal ke document.body');
assert(code.includes('mounted'), 'Wajib memiliki SSR safety guard mounted');
console.log('PASS: sidebar-notification-portal check passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node frontend/src/features/admin/__tests__/sidebar-notification-portal.check.mjs`  
Expected: FAIL.

- [ ] **Step 3: Implement `createPortal` with SSR safety**

1. Import `createPortal` from `'react-dom'`.
2. Tambahkan state `const [mounted, setMounted] = useState(false);` dan `useEffect(() => setMounted(true), []);`.
3. Bungkus JSX `<AnimatePresence>` drawer dengan:
   ```tsx
   {mounted && isOpen ? createPortal(
     <div className="fixed inset-0 z-50 flex pointer-events-auto">
       ...
     </div>,
     document.body
   ) : null}
   ```

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/sidebar-notification-portal.check.mjs`  
Expected: PASS.

---

### Task 2: Accessible Collapsed Logout & Profile Footer in `AdminShell.tsx`

**Files:**
- Modify: `frontend/src/features/admin/components/AdminShell.tsx`
- Test: `frontend/src/features/admin/__tests__/collapsed-logout.check.mjs`

**Interfaces:**
- Consumes: `LogOut` icon, `user` props, `handleLogout`.
- Produces: Tombol logout 1-klik yang mudah diakses saat sidebar dalam mode collapsed maupun expanded.

- [ ] **Step 1: Write the failing test check**

```javascript
// frontend/src/features/admin/__tests__/collapsed-logout.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const code = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');
assert(code.includes('Keluar'), 'Wajib memiliki label/tooltip Keluar untuk collapsed logout');
assert(code.includes('group-data-[state=collapsed]/sidebar:flex'), 'Footer collapsed wajib memiliki struktur flex vertikal untuk logout');
console.log('PASS: collapsed-logout check passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node frontend/src/features/admin/__tests__/collapsed-logout.check.mjs`  
Expected: FAIL.

- [ ] **Step 3: Update `AdminShell.tsx` footer**

Perbarui `<AnimatedSidebarFooter>`:
- Dalam mode expanded: Tampilkan avatar, info user, dan tombol logout kanan.
- Dalam mode collapsed: Tampilkan avatar di atas, dan tombol logout ringkas di bawahnya dengan tooltip instan Stealth Luxe.

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/collapsed-logout.check.mjs`  
Expected: PASS.

---

### Task 3: Unclipped `AnimatedSidebarRail` & Instant Menu Tooltips in `Sidebar.tsx`

**Files:**
- Modify: `frontend/src/features/admin/components/ui/Sidebar.tsx`
- Test: `frontend/src/features/admin/__tests__/sidebar-rail-tooltip.check.mjs`

**Interfaces:**
- Consumes: `panel.collapsed`, `textLabel`.
- Produces: Rail handle yang tidak terpotong `overflow-hidden` dan micro-tooltip seragam untuk semua menu item.

- [ ] **Step 1: Write the failing test check**

```javascript
// frontend/src/features/admin/__tests__/sidebar-rail-tooltip.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const code = fs.readFileSync('frontend/src/features/admin/components/ui/Sidebar.tsx', 'utf-8');
assert(code.includes('panel.collapsed && textLabel'), 'Menu button wajib menampilkan tooltip stealth saat collapsed');
console.log('PASS: sidebar-rail-tooltip check passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node frontend/src/features/admin/__tests__/sidebar-rail-tooltip.check.mjs`  
Expected: FAIL.

- [ ] **Step 3: Implement instant micro-tooltip & rail boundary polish**

1. Pada `AnimatedSidebarMenuButton`, tambahkan tooltip floating saat `panel.collapsed && textLabel`.
2. Pastikan `AnimatedSidebarRail` terpasang di level `<motion.aside>` tanpa terpotong oleh `overflow-hidden` inner panel.

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/sidebar-rail-tooltip.check.mjs`  
Expected: PASS.

---

### Task 4: Mobile Header Close Button & Responsive Breadcrumb Truncation

**Files:**
- Modify: `frontend/src/features/admin/components/ui/Sidebar.tsx`, `frontend/src/features/admin/components/AdminShell.tsx`
- Test: `frontend/src/features/admin/__tests__/mobile-nav-hardening.check.mjs`

- [ ] **Step 1: Write the failing test check**

```javascript
// frontend/src/features/admin/__tests__/mobile-nav-hardening.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const sidebarCode = fs.readFileSync('frontend/src/features/admin/components/ui/Sidebar.tsx', 'utf-8');
const shellCode = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');

assert(sidebarCode.includes('Tutup sidebar') || sidebarCode.includes('closeMobile') || sidebarCode.includes('X className'), 'Mobile sidebar wajib memiliki tombol close eksplisit');
assert(shellCode.includes('max-w-'), 'Breadcrumb title wajib memiliki class max-w- untuk responsive truncation');
console.log('PASS: mobile-nav-hardening check passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node frontend/src/features/admin/__tests__/mobile-nav-hardening.check.mjs`  
Expected: FAIL.

- [ ] **Step 3: Implement mobile close button & breadcrumb truncation**

1. Pada `MobileSidebar` di `Sidebar.tsx`, tambahkan tombol tutup silang `X` di sudut header drawer.
2. Pada breadcrumb di `AdminShell.tsx`, tambahkan class responsive `truncate max-w-[120px] sm:max-w-none` pada label halaman aktif.

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/mobile-nav-hardening.check.mjs`  
Expected: PASS.

---

### Task 5: End-to-End Verification & Production Build

**Files:**
- Test: All check scripts + Chrome DevTools MCP validation + Next.js build

- [ ] **Step 1: Run all test checks**

```bash
node frontend/src/features/admin/__tests__/sidebar-notification-portal.check.mjs
node frontend/src/features/admin/__tests__/collapsed-logout.check.mjs
node frontend/src/features/admin/__tests__/sidebar-rail-tooltip.check.mjs
node frontend/src/features/admin/__tests__/mobile-nav-hardening.check.mjs
```
Expected: All return PASS.

- [ ] **Step 2: Run Next.js production build**

```bash
npm --prefix frontend run build
```
Expected: Compiled successfully with 0 errors.

- [ ] **Step 3: Runtime verification via Chrome DevTools MCP**

Verify via Chrome DevTools MCP that:
1. Notification drawer opens cleanly above the sticky header.
2. Collapsed sidebar displays the compact logout button with tooltip.
3. Mobile viewport (390px) shows clean breadcrumb and functioning close button.
