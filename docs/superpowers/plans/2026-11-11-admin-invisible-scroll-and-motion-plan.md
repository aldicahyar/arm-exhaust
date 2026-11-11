# Admin Invisible Scrollbar, Scroll Isolation & Dynamic Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memulihkan kelancaran scrolling pada dashboard admin ARM Exhaust (mengatasi konflik Lenis window interceptor), meniadakan seluruh scrollbar visual browser secara cross-browser menggunakan utilitas `.scrollbar-none` demi estetika minimalis Stealth Luxe, dan mengimplementasikan animasi Dynamic Header Elevation saat konten digulir.

**Architecture:** 
1. CSS Layer: Tambahkan utilitas `.scrollbar-none` di `globals.css` yang menyembunyikan scrollbar Webkit, Firefox, dan IE/Edge tanpa mematikan scrolling.
2. Scroll Isolation: Pasang atribut `data-lenis-prevent="true"`, `overscroll-y-contain`, dan `scrollbar-none` pada scroll container utama di `AdminShell.tsx`.
3. Motion & Elevation: Pasang scroll listener reaktif di `AdminShell.tsx` untuk menganimasikan status topbar (transisi ke `backdrop-blur-md`, `bg-white/90`, border bawah, dan bayangan halus `shadow-xs` saat di-scroll) serta transisi konten halus.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Lenis.

**Spec:** [`docs/superpowers/specs/2026-11-11-admin-invisible-scroll-and-motion-design.md`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/docs/superpowers/specs/2026-11-11-admin-invisible-scroll-and-motion-design.md)

## Global Constraints
- Estetika Stealth Luxe wajib terjaga: kanvas bersih tanpa batang scrollbar abu-abu browser di Windows maupun Mac.
- Fungsi scrolling (mousewheel, touchpad, layar sentuh, keyboard panah/spasi) wajib tetap 100% responsif dan lancar.
- Animasi topbar elevation wajib menggunakan transisi CSS/Framer Motion berperforma tinggi (GPU-accelerated, tanpa lag).
- Seluruh pengujian contract dan build Next.js (`npm --prefix frontend run build`) wajib lulus dengan 0 error.

## Review Focus
1. Mouse wheel berputar di atas tabel pesanan/mitra -> konten bergulir mulus tanpa terblokir oleh Lenis di level window.
2. Halaman dibuka di peramban Windows (Edge/Chrome) -> tidak ada track atau thumb scrollbar abu-abu 17px yang muncul di sisi kanan.
3. Posisi scroll berada di paling atas (scrollTop <= 10px) -> topbar flat dan menyatu dengan kanvas tanpa border atau bayangan.
4. Konten digulir ke bawah (scrollTop > 10px) -> topbar bertransisi halus memunculkan efek melayang (`backdrop-blur-md shadow-xs border-b border-zinc-200`).
5. Peralihan tab (misal dari Pesanan Masuk ke Direktori Mitra) -> posisi scroll reset rapi ke paling atas dan transisi tab tetap mulus.

---

### Task 1: Cross-Browser `.scrollbar-none` CSS Utility

**Files:**
- Modify: `frontend/src/app/globals.css`
- Test: `frontend/src/features/admin/__tests__/scrollbar-utility.check.mjs`

**Interfaces:**
- Consumes: Tailwind CSS base layer.
- Produces: Class utility `.scrollbar-none` yang mematikan tampilan scrollbar pada Webkit (`::-webkit-scrollbar { display: none; }`), Firefox (`scrollbar-width: none;`), dan Edge/IE (`-ms-overflow-style: none;`).

- [ ] **Step 1: Write the failing test check**

```javascript
// frontend/src/features/admin/__tests__/scrollbar-utility.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const css = fs.readFileSync('frontend/src/app/globals.css', 'utf-8');
assert(css.includes('.scrollbar-none'), 'Wajib mendefinisikan kelas .scrollbar-none di globals.css');
assert(css.includes('::-webkit-scrollbar'), 'Wajib mematikan scrollbar untuk Webkit');
assert(css.includes('scrollbar-width: none'), 'Wajib mematikan scrollbar untuk Firefox');
console.log('PASS: scrollbar-none utility contract check passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node frontend/src/features/admin/__tests__/scrollbar-utility.check.mjs`  
Expected: FAIL (`.scrollbar-none` belum ada di `globals.css`).

- [ ] **Step 3: Implement `.scrollbar-none` in `frontend/src/app/globals.css`**

Tambahkan utilitas di layer utilities:
```css
@layer utilities {
  .scrollbar-none::-webkit-scrollbar {
    display: none;
    width: 0px;
    height: 0px;
  }
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/scrollbar-utility.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/globals.css frontend/src/features/admin/__tests__/scrollbar-utility.check.mjs
git commit -m "feat(ui): add cross-browser scrollbar-none utility in globals.css"
```

---

### Task 2: Scroll Isolation & Lenis Fix in `AdminShell.tsx`

**Files:**
- Modify: `frontend/src/features/admin/components/AdminShell.tsx`
- Test: `frontend/src/features/admin/__tests__/scroll-isolation.check.mjs`

**Interfaces:**
- Consumes: `scrollbar-none`, `data-lenis-prevent`.
- Produces: Konten kanvas admin yang kebal dari intersepsi Lenis window dan memiliki perilaku scroll native yang lancar tanpa scrollbar.

- [ ] **Step 1: Write the failing test check**

```javascript
// frontend/src/features/admin/__tests__/scroll-isolation.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const shell = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');
assert(shell.includes('data-lenis-prevent'), 'Wajib menyertakan data-lenis-prevent untuk mencegah interupsi Lenis');
assert(shell.includes('scrollbar-none'), 'Container scroll admin wajib menggunakan scrollbar-none');
assert(shell.includes('overscroll-y-contain'), 'Container wajib menggunakan overscroll-y-contain');
console.log('PASS: Scroll isolation check passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node frontend/src/features/admin/__tests__/scroll-isolation.check.mjs`  
Expected: FAIL.

- [ ] **Step 3: Update `AdminShell.tsx` scroll container**

1. Tambahkan `ref={scrollContainerRef}` pada container konten utama.
2. Berikan atribut `data-lenis-prevent="true"`.
3. Tambahkan kelas `scrollbar-none` dan `overscroll-y-contain` pada container `overflow-y-auto`.
4. Pastikan `activeTab` perubahan memicu scroll reset ke atas (`scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' })`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/scroll-isolation.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/admin/components/AdminShell.tsx frontend/src/features/admin/__tests__/scroll-isolation.check.mjs
git commit -m "fix(admin-scroll): isolate scroll container with data-lenis-prevent and hide scrollbar"
```

---

### Task 3: Dynamic Header Elevation & Content Motion in `AdminShell.tsx`

**Files:**
- Modify: `frontend/src/features/admin/components/AdminShell.tsx`
- Test: `frontend/src/features/admin/__tests__/header-elevation.check.mjs`

**Interfaces:**
- Consumes: `framer-motion`, `useState`, `useCallback`.
- Produces: Topbar yang bereaksi terhadap pergerakan scroll dengan efek blur, border, dan elevasi bayangan halus.

- [ ] **Step 1: Write the failing test check**

```javascript
// frontend/src/features/admin/__tests__/header-elevation.check.mjs
import assert from 'node:assert';
import fs from 'node:fs';

const shell = fs.readFileSync('frontend/src/features/admin/components/AdminShell.tsx', 'utf-8');
assert(shell.includes('isScrolled'), 'Wajib memiliki state isScrolled untuk dynamic header elevation');
assert(shell.includes('backdrop-blur'), 'Topbar wajib memiliki efek backdrop-blur saat di-scroll');
console.log('PASS: Header elevation contract passed.');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node frontend/src/features/admin/__tests__/header-elevation.check.mjs`  
Expected: FAIL.

- [ ] **Step 3: Implement dynamic topbar elevation & smooth tab transition**

1. Buat state `const [isScrolled, setIsScrolled] = useState(false)`.
2. Buat handler `handleScroll`:
   ```tsx
   const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
     const scrolled = e.currentTarget.scrollTop > 10;
     if (scrolled !== isScrolled) {
       setIsScrolled(scrolled);
     }
   };
   ```
3. Ubah header topbar agar memiliki kelas kondisional:
   ```tsx
   <header className={cn(
     "sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6 transition-all duration-200",
     isScrolled
       ? "bg-white/85 backdrop-blur-md border-[#e4e4e7] shadow-xs"
       : "bg-[#fffbf5]/80 backdrop-blur-xs border-transparent"
   )}>
   ```
4. Bungkus area konten tab dalam `AnimatePresence` atau `motion.div` dengan transisi fade & slide-up halus (`initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/src/features/admin/__tests__/header-elevation.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/admin/components/AdminShell.tsx frontend/src/features/admin/__tests__/header-elevation.check.mjs
git commit -m "feat(admin-motion): add dynamic topbar elevation and smooth tab transitions"
```

---

### Task 4: Full Verification & Build Validation

**Files:**
- Test: All test check scripts + Next.js build

- [ ] **Step 1: Run all check scripts**

```bash
node frontend/src/features/admin/__tests__/scrollbar-utility.check.mjs
node frontend/src/features/admin/__tests__/scroll-isolation.check.mjs
node frontend/src/features/admin/__tests__/header-elevation.check.mjs
node docs/scripts/e2e/e2e-admin-superadmin-rbac.mjs
```
Expected: All tests return PASS.

- [ ] **Step 2: Run Next.js production build**

```bash
npm --prefix frontend run build
```
Expected: PASS with 0 type/lint errors.

- [ ] **Step 3: Commit final verification if any adjustments made**
