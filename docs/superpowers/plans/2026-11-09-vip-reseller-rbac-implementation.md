# VIP Reseller & Dynamic RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bespoke, extensible Dynamic Role-Based Access Control (RBAC) system featuring private by-invitation B2B onboarding, tokenized VIP WhatsApp invite links with mandatory fresh re-authentication, dynamic wholesale pricing, and refined motorsport badging without public signup leakage.

**Architecture:** Database-driven roles (`master.t_mtr_roles`) and one-time tokenized invites (`transaction.t_trx_reseller_invites`) integrated into NestJS guards and Next.js server components. VIP invite claim strictly requires fresh re-authentication (Google SSO or password credentials) to prevent session hijacking.

**Tech Stack:** Next.js 16 (Turbopack, App Router, React 19), NestJS 11, PostgreSQL, Prisma, Tailwind CSS, Framer Motion, Google Identity Services (GIS).

**Spec:** [`docs/superpowers/specs/2026-11-09-vip-reseller-rbac-design.md`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/docs/superpowers/specs/2026-11-09-vip-reseller-rbac-design.md)

---

## Global Constraints

- Never expose public reseller registration links or forms on the public website.
- Token generation must use cryptographically secure random bytes (`crypto.randomBytes(32).toString('hex')`).
- Mandatory Fresh Re-Authentication is required for all VIP token claims, even if an active session exists.
- Motorsport brutalist dark theme only: `#0F0F11`, `#141416`, `#2B2B32`, race-red `#E81828`, gold telemetry `#F59E0B` / `#D97706`. Zero AI slop.
- Zero Layout Shift (CLS = 0) on all forms and cards.

## Review Focus

1. *Attempting to claim an invite with an expired token*: Must reject with 410 Gone / 404 Not Found and show clear expired notice.
2. *Attempting to claim an invite with an already used token*: Must reject with 409 Conflict / 410 Gone; token cannot be used twice.
3. *Attempting to claim an invite without fresh authentication*: Must strictly require Google SSO or password verification before upgrading role.
4. *Non-admin user attempting to generate invites or patch user roles*: Must reject with 403 Forbidden.
5. *Role discount boundary validation*: Persentase diskon harus dibatasi antara 0% s/d 50% di backend.

---

### Task 1: Database Migration & Master Roles Table

**Files:**
- Create: `backend/prisma/migrations/20261109_dynamic_rbac_and_invites/migration.sql`
- Modify: `backend/prisma/schema.prisma`
- Test: `docs/scripts/backend/test-rbac-schema.mjs`

**Interfaces:**
- Produces: Tables `master.t_mtr_roles` and `transaction.t_trx_reseller_invites`.

- [ ] **Step 1: Write schema verification test**
  Create `docs/scripts/backend/test-rbac-schema.mjs` that verifies table creation, seed data (`customer`, `reseller`, `admin`), and foreign key constraints.

- [ ] **Step 2: Run test to verify it fails**
  Run: `node docs/scripts/backend/test-rbac-schema.mjs`
  Expected: FAIL (tables do not exist yet).

- [ ] **Step 3: Update `schema.prisma` and execute SQL migration**
  Add `Role` and `ResellerInvite` models in `backend/prisma/schema.prisma`. Execute SQL migration in PostgreSQL database `ARM_EXHAUST`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `node docs/scripts/backend/test-rbac-schema.mjs`
  Expected: PASS (tables created, 3 default roles seeded).

---

### Task 2: Backend Dynamic RBAC & Admin User Management API

**Files:**
- Modify: `backend/src/shared/guards/roles.guard.ts`
- Modify: `backend/src/features/admin/admin.controller.ts`
- Modify: `backend/src/features/admin/admin.module.ts`
- Create: `backend/src/features/admin/admin-users.service.ts`
- Test: `docs/scripts/backend/test-admin-users.mjs`

**Interfaces:**
- Produces: `GET /api/admin/users`, `PATCH /api/admin/users/:id/role`.

- [x] **Step 1: Write unit and integration test for admin user role assignment**
  Create `docs/scripts/backend/test-admin-users.mjs` testing listing users, role patching, and 403 unauthorized rejection for non-admins.

- [x] **Step 2: Run test to verify it fails**
  Run: `node docs/scripts/backend/test-admin-users.mjs`
  Expected: FAIL (endpoints not found).

- [x] **Step 3: Implement `AdminUsersService` and controller endpoints**
  Implement user search, role update, and update `RolesGuard` to check user capabilities from database.

- [x] **Step 4: Run test to verify it passes**
  Run: `node docs/scripts/backend/test-admin-users.mjs`
  Expected: PASS.

---

### Task 3: Backend VIP Tokenized Invite System & Fresh Re-Authentication Claim

**Files:**
- Create: `backend/src/features/admin/reseller-invite.service.ts`
- Modify: `backend/src/features/admin/admin.controller.ts`
- Create: `backend/src/features/auth/reseller-claim.controller.ts`
- Test: `docs/scripts/backend/test-reseller-invites.mjs`

**Interfaces:**
- Produces: `POST /api/admin/reseller-invites`, `GET /api/admin/reseller-invites`, `DELETE /api/admin/reseller-invites/:id`, `GET /api/reseller/invite-info`, `POST /api/reseller/claim-invite`.

- [x] **Step 1: Write test for invite creation, expiration, one-time burn, and mandatory re-auth**
  Create `docs/scripts/backend/test-reseller-invites.mjs`.

- [x] **Step 2: Run test to verify it fails**
  Run: `node docs/scripts/backend/test-reseller-invites.mjs`
  Expected: FAIL.

- [x] **Step 3: Implement token generation and claim handler**
  Generate 64-char crypto token, enforce expiry check, verify fresh Google ID Token or password credential in `POST /api/reseller/claim-invite`, burn token (`used_count = 1`), and grant target role.

- [x] **Step 4: Run test to verify it passes**
  Run: `node docs/scripts/backend/test-reseller-invites.mjs`
  Expected: PASS.

---

### Task 4: Dynamic Reseller Pricing Engine

**Files:**
- Modify: `backend/src/features/checkout/products.catalog.ts`
- Modify: `backend/src/features/checkout/checkout.service.ts`
- Modify: `backend/src/features/checkout/checkout.controller.ts`
- Test: `docs/scripts/backend/test-dynamic-pricing.mjs`

**Interfaces:**
- Produces: Dynamic calculation of retail vs wholesale prices based on authenticated user's role `discount_percent`.

- [x] **Step 1: Write test asserting retail customer gets full price, reseller gets discounted price**
  Create `docs/scripts/backend/test-dynamic-pricing.mjs`.

- [x] **Step 2: Run test to verify it fails**
  Run: `node docs/scripts/backend/test-dynamic-pricing.mjs`
  Expected: FAIL.

- [x] **Step 3: Implement dynamic discount logic in checkout service**
  Query user role discount or `reseller.discount_percent` from `master.t_mtr_roles` and return computed prices.

- [x] **Step 4: Run test to verify it passes**
  Run: `node docs/scripts/backend/test-dynamic-pricing.mjs`
  Expected: PASS.

---

### Task 5: Frontend Admin Management Panel (`/admin`)

**Files:**
- Modify: `frontend/src/app/admin/page.tsx`
- Create: `frontend/src/features/admin/components/UserManagementTable.tsx`
- Create: `frontend/src/features/admin/components/VipInviteGenerator.tsx`
- Modify: `frontend/src/features/admin/index.ts`

**Interfaces:**
- Produces: 3-tab Admin Dashboard (Security Config, User & Role Management, VIP WhatsApp Invite Generator).

- [x] **Step 1: Build `UserManagementTable`**
  Search input, role badge, dropdown to promote/demote role with confirmation notice.

- [x] **Step 2: Build `VipInviteGenerator`**
  Partner name input, duration selector (24h, 48h, 7d), role to grant selector, Generate button, 1-click Copy Link & WhatsApp Share button.

- [x] **Step 3: Mount tabs in `frontend/src/app/admin/page.tsx`**

---

### Task 6: Frontend VIP Reseller Landing Screen (`/reseller/vip-join?token=...`)

**Files:**
- Create: `frontend/src/app/reseller/vip-join/page.tsx`
- Create: `frontend/src/features/reseller/VipJoinCard.tsx`
- Create: `frontend/src/features/reseller/index.ts`

**Interfaces:**
- Produces: Standalone VIP landing page enforcing fresh re-authentication via Google SSO or Email.

- [x] **Step 1: Implement token info fetcher and expiration countdown**
  Check token via `/api/reseller/invite-info?token=...`. Display partner name and expiry timer.

- [x] **Step 2: Build `VipJoinCard` with mandatory fresh login**
  Integrate Google SSO and email credential submit that attaches the `token`.

- [x] **Step 3: Wire success redirect and Dynamic Island notification**
  Show *"Official Reseller Status Activated for [Partner Name]!"* and redirect to catalog/home.

---

### Task 7: Frontend Navbar & Badging Integration (`HeaderTabs.tsx`)

**Files:**
- Modify: `frontend/src/shared/components/HeaderTabs.tsx`
- Modify: `frontend/src/features/auth/useAuthForm.ts`

**Interfaces:**
- Produces: Dynamic badge display (`RESELLER OFFICIAL` gold `#F59E0B`, `ADMIN` red `#E81828`) and dynamic B2B navigation items.

- [x] **Step 1: Add `role` and `roleDetails` to `UserProfile` interface in `HeaderTabs.tsx`**

- [x] **Step 2: Render motorsport badges in profile dropdown and mobile drawer**

- [x] **Step 3: Conditionally render "Katalog B2B Grosir" menu item for B2B roles**

---

### Task 8: End-to-End Verification & Health Audit

**Files:**
- Test: `docs/scripts/e2e/e2e-vip-reseller-lifecycle.mjs`

- [x] **Step 1: Execute full lifecycle test script**
  Admin generates VIP invite for "Bengkel Anugerah Motor" -> Link claimed with fresh Google SSO -> User upgraded to reseller -> Discount reflected in catalog -> Direct role demotion by admin.

- [x] **Step 2: Run frontend and backend builds**
  Ensure zero TypeScript errors, zero lint warnings, and clean compilation.
