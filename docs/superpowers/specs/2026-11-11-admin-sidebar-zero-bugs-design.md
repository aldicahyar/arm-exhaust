# Admin Sidebar Zero-Bugs Hardening Design Spec

**Date:** 2026-11-11  
**Target:** ARM Exhaust Admin Console (`/admin`)  
**Status:** Approved  
**Author:** AI Pair Programming (Antigravity) & User

---

## 1. Problem Statement & Motivation
During interactive visual audit and MCP runtime testing of the ARM Exhaust Admin Console, 5 concrete bugs and usability gaps were identified on the sidebar:
1. **Stacking Context & Z-Index Collision (Drawer Notifikasi):** Slide-over drawer rendered within `<motion.aside>` is trapped inside a CSS stacking context created by `will-change-[width]` and motion transforms. Consequently, the sticky canvas header (`z-30`) renders on top of the dark notification drawer and backdrop, obscuring the drawer header and close button.
2. **Logout Inaccessibility in Collapsed State:** When the sidebar is collapsed (68px icon mode), the logout button is hidden (`group-data-[state=collapsed]/sidebar:hidden`) and only the static avatar "AA" remains, forcing the user to expand the sidebar just to log out.
3. **Rail Hitbox Clipping:** `<AnimatedSidebarRail />` is inside `<motion.div className="... overflow-hidden ...">` with `data-[side=left]:left-full -translate-x-1/2`. The right 6px of its 12px hitbox is clipped by `overflow-hidden`, creating erratic cursor hover detection.
4. **Non-Standardized Micro-Tooltips:** While `SidebarSearch` and `SidebarNotification` have instant Stealth Luxe tooltips, operational menu items rely on browser-native `title=""` which has a 1-2 second delay and default OS appearance.
5. **Mobile Viewport Nav Issues:** On mobile screens (< 400px), topbar breadcrumb wraps awkwardly against the "+ Undang" CTA, and the mobile drawer lacks an explicit close button `(X)` in its header.

---

## 2. Technical Architecture & Component Changes

### 2.1 React Portal for `SidebarNotification.tsx`
- **Pattern:** `createPortal(drawerJSX, document.body)`
- **SSR Safety:** Track `const [mounted, setMounted] = useState(false)` with `useEffect(() => setMounted(true), [])`. Only render portal when `mounted && isOpen`.
- **Styling:** Retain full `z-50`, dark `bg-black/60 backdrop-blur-xs` overlay, and slide-in drawer from the left.
- **Result:** The drawer completely covers the entire viewport including the sticky header, resolving the stacking context leak.

### 2.2 Collapsed Logout & Profile Footer in `AdminShell.tsx`
- **Collapsed View:**
  - Avatar box displayed at top.
  - Directly beneath, display a compact logout icon button:
    ```tsx
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="group relative flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
      aria-label="Keluar dari sesi admin"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 hidden rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-200 shadow-xl group-hover:block whitespace-nowrap">
        Keluar
      </span>
    </button>
    ```
- **Expanded View:** Retains full profile card with user name, email, and logout icon button.

### 2.3 Unclipped Hitbox for `AnimatedSidebarRail`
- In `frontend/src/features/admin/components/ui/Sidebar.tsx`, ensure `AnimatedSidebarRail` is placed outside any inner `overflow-hidden` container so its 12px hitbox (`left-full -translate-x-1/2`) is fully clickable directly along the seam between sidebar and canvas.

### 2.4 Instant Stealth Luxe Tooltips for `AnimatedSidebarMenuButton`
- In `frontend/src/features/admin/components/ui/Sidebar.tsx`:
  When `panel.collapsed` is true and `textLabel` is present, render:
  ```tsx
  {panel.collapsed && textLabel && (
    <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 hidden rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-200 shadow-xl group-hover:block whitespace-nowrap">
      {textLabel}
    </span>
  )}
  ```

### 2.5 Mobile Navigation & Breadcrumb Hardening
- In `MobileSidebar`, add an explicit close button with `X` icon in the header next to the branding.
- In `AdminShell.tsx`, add `truncate max-w-[130px] sm:max-w-none` on the active breadcrumb page title.

---

## 3. Review & Verification Criteria
1. `npm --prefix frontend run build` completes with 0 errors.
2. Clicking `Notifikasi & Order Masuk` renders drawer atop the sticky header without any breadcrumb leak.
3. Collapsing sidebar keeps a 1-click logout button accessible with instant tooltip.
4. Hovering over menu items in collapsed state shows immediate Stealth Luxe tooltips.
5. All automated unit and contract check tests pass.
6. Zero git commits/pushes by the agent (strictly user-managed).
