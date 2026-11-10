# Reusable Dynamic Island Telemetry Notice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully reusable, headless top-center notification system combining Sonner's interactive queuing/dismissing mechanics with 21st.dev's Dynamic Island Framer Motion spring physics.

**Architecture:** A lightweight React Context (`NoticeProvider`) mounted at root layout that exposes a clean `useNotice()` hook (`notify.error`, `notify.success`, `notify.info`) powering a floating, headless monochrome carbon pill at `top-center`. Replaces intrusive inline error banners to prevent layout shift.

**Tech Stack:** Next.js 16, React 19, Framer Motion 14, Tailwind CSS, TypeScript.

**Spec:** Brainstormed with user on 2026-11-09: Category 1 (Top-Center Sonner interactive + 21st.dev Dynamic Island morph + Headless/monochrome telemetry palette #121214 / #2B2B32 + full mobile/desktop responsiveness + zero layout shift on form cards).

## Global Constraints

- Palette: Strict monochrome carbon dark (#121214 background, #2B2B32 border, #FFFFFF / #9AA0A8 text, no rainbow backgrounds).
- Responsive: Top-center alignment on desktop; top notch/safe-area adaptive pill on mobile with swipe-up dismiss.
- Zero Layout Shift: Replaces inline card alerts with floating island notifications so auth cards remain 100% stable.
- Reusable: Global provider so any feature (auth, checkout, cart, admin) can trigger notifications with zero boilerplate.

## Review Focus

1. Multiple rapid error triggers queue or replace cleanly without stack collisions.
2. Auto-dismiss timer pauses when user hovers over the notification pill.
3. Mobile touch swipe-up dismiss gesture works smoothly.
4. Dismiss button ('✕') closes the active notice immediately.
5. StrictMode / React 19 compatibility without memory leaks or stale timer closures.

---

### Task 1: Notice Types & Context Provider

**Files:**
- Create: `frontend/src/shared/components/notice/types.ts`
- Create: `frontend/src/shared/components/notice/NoticeContext.tsx`
- Create: `frontend/src/shared/components/notice/index.ts`
- Test: `frontend/src/shared/components/notice/__tests__/notice.test.mjs`

- [ ] Define `NoticeType`, `NoticeItem`, and `NoticeContextValue` interfaces.
- [ ] Implement `NoticeProvider` with state queue, auto-dismiss (4.5s), hover pause, and methods `notify.error()`, `notify.success()`, `notify.info()`, `notify.dismiss()`.
- [ ] Export `useNotice` custom hook.
- [ ] Write and run standalone unit tests verifying notice creation, deduplication, and auto-dismiss timing logic.

### Task 2: Dynamic Island Notification Component (Framer Motion)

**Files:**
- Create: `frontend/src/shared/components/notice/DynamicIslandNotice.tsx`
- Modify: `frontend/src/shared/components/notice/index.ts`

- [ ] Implement `DynamicIslandNotice` using `framer-motion` `AnimatePresence`.
- [ ] Configure spring physics (`{ type: "spring", stiffness: 420, damping: 28 }`) matching 21st.dev Dynamic Island.
- [ ] Apply headless monochrome carbon styling: `#121214`/95 backdrop blur, 1px `#2B2B32` border, subtle shadow, and clean telemetry indicator.
- [ ] Add swipe-up drag dismiss gesture for touch/mobile devices (`drag="y" dragConstraints={{ top: -100, bottom: 0 }}`).
- [ ] Add manual dismiss button (`✕`).

### Task 3: Root Layout Global Mount

**Files:**
- Modify: `frontend/src/app/layout.tsx`

- [ ] Wrap application with `<NoticeProvider>` in `layout.tsx`.
- [ ] Mount `<DynamicIslandNotice />` at root body so it floats above all app views.

### Task 4: Integrate with AuthCard & useAuthForm

**Files:**
- Modify: `frontend/src/features/auth/useAuthForm.ts`
- Modify: `frontend/src/features/auth/AuthCard.tsx`
- Modify: `frontend/src/features/auth/OtpStep.tsx`

- [ ] Wire `useAuthForm` error triggers into `useNotice().notify.error(parsedMessage)`.
- [ ] Remove the inline `{error && <div role="alert">...</div>}` from inside `AuthCard` and `OtpStep` to eliminate form layout shift.
- [ ] Retain accessibility aria attributes and screen-reader announcements.

### Task 5: Verification & End-to-End Build

**Files:**
- Test: `npm --prefix frontend run build`
- Test: `node frontend/src/shared/components/notice/__tests__/notice.test.mjs`
- Test: `node frontend/src/features/auth/__tests__/auth-card.check.mjs`

- [ ] Run unit test suites.
- [ ] Run full Next.js production build (`npm --prefix frontend run build`) verifying zero TypeScript and SSR issues.
