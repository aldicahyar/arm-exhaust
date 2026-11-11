# Auth OTP Flow Hardening, Injection Defense & Bencho Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate email hijacking race conditions, sanitize query params and plus-addressing against script injection, provide standalone `POST /api/auth/resend-otp` backend support, fix back navigation, and harmonize `OtpStep.tsx` with the Bencho minimalist monochrome theme.

**Architecture:** Coordinate initial state in `useAuthForm.ts` to strictly prioritize URL parameters over `localStorage`. Add a secure `POST /api/auth/resend-otp` NestJS endpoint that generates a new OTP from existing pending registration payloads in PostgreSQL. Update `OtpStep.tsx` to match the solid white `rounded-2xl` primary button styling and monochrome visual tokens.

**Tech Stack:** Next.js 15, React 19, NestJS 10, TypeScript, PostgreSQL (node-pg), Tailwind CSS.

**Spec:** [`docs/superpowers/specs/2026-11-11-auth-otp-hardening-and-bencho-sync-design.md`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/docs/superpowers/specs/2026-11-11-auth-otp-hardening-and-bencho-sync-design.md)

## Global Constraints

- URL query parameters must take absolute precedence over `localStorage ('arm_remember_email')`.
- `localStorage ('arm_remember_email')` must only prefill when `initialMode === 'login'` and no query param exists.
- Plus-addressing (e.g. `arkanpasiva+8@gmail.com`) must preserve `+` and reject non-email strings via `isValidEmail`.
- All database operations must use parameterized queries (`$1, $2, ...`) with zero SQL injection risk.
- Only the ARM Exhaust logo retains red color; `OtpStep.tsx` action button must be solid white `rounded-2xl`.
- Zero TypeScript and build errors across both `frontend` and `backend`.

## Review Focus

1. **Email Overwrite on Mount**: When `arm_remember_email` is set in `localStorage` and a link with `?email=...` is visited, state must strictly retain the link email.
2. **Plus-Addressing Preservation**: Query string `?email=arkanpasiva+8@gmail.com` must never decode to `arkanpasiva 8@gmail.com`.
3. **Resend Without Memory Password**: When OTP page is opened fresh from an email link, clicking "Resend Code" must succeed without password.
4. **Script Injection Rejection**: Passing `?email=<script>alert(1)</script>&otp=123456` must fail email validation and reject OTP transition.
5. **Back Navigation Integrity**: Clicking "Change email or back to registration" must route to `mode = 'register'`, allowing email correction.

---

### Task 1: Backend `POST /api/auth/resend-otp` Endpoint & Service

**Files:**
- Create: `backend/src/features/auth/dto/resend-otp.dto.ts`
- Modify: `backend/src/features/auth/auth.service.ts`
- Modify: `backend/src/features/auth/auth.controller.ts`
- Test: `backend/src/features/auth/__tests__/resend-otp.check.mjs`

**Interfaces:**
- Consumes: `DatabaseService`, `OtpService`, `MailerService`, `SecurityConfigService`
- Produces: `POST /api/auth/resend-otp` accepting `{ email: string }`, returning `{ ok: true, message: string }`

- [ ] **Step 1: Write verification test for resend-otp endpoint**

Create `backend/src/features/auth/__tests__/resend-otp.check.mjs` verifying:
- `resend-otp.dto.ts` exists and enforces `@IsEmail()`.
- `auth.service.ts` implements `resendOtp(email, ip)`.
- `auth.controller.ts` exposes `@Post('resend-otp')` with `RateLimitGuard`.
- Database query uses parameterized query on `transaction.t_trx_registration_otps`.

- [ ] **Step 2: Run verification test to confirm it fails**

Run: `node backend/src/features/auth/__tests__/resend-otp.check.mjs`  
Expected: FAIL with missing DTO/endpoint.

- [ ] **Step 3: Implement `ResendOtpDto`, `authService.resendOtp`, and controller route**

- Create `backend/src/features/auth/dto/resend-otp.dto.ts`:
  ```ts
  import { IsEmail } from 'class-validator';
  export class ResendOtpDto {
    @IsEmail({}, { message: 'Email tidak valid.' })
    email: string;
  }
  ```
- In `auth.service.ts`:
  Implement `resendOtp(dto: ResendOtpDto, ip: string)`:
  - Query `transaction.t_trx_registration_otps WHERE identifier = $1 AND verified_at IS NULL ORDER BY created_at DESC LIMIT 1`.
  - Check lock status (`locked_until`).
  - Generate new OTP via `this.otpService.generateOtp()`, hash via `this.otpService.hashOtp(otp)`.
  - Update `otp_hash`, `request_count = request_count + 1`, reset `expires_at = now() + (ttl || ' minutes')::interval`.
  - Send email via `this.mailerService.sendOtpEmail(email, otp)`.
  - Return `{ ok: true, message: 'Verification code resent successfully.' }`.
- In `auth.controller.ts`:
  Add `@Post('resend-otp')` decorated with `@HttpCode(HttpStatus.OK)`, `@UseGuards(RateLimitGuard)`, `@RateLimit('resend-otp')`.

- [ ] **Step 4: Run verification test to confirm it passes**

Run: `node backend/src/features/auth/__tests__/resend-otp.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/features/auth/
git commit -m "feat(auth): implement standalone POST /api/auth/resend-otp endpoint"
```

---

### Task 2: Frontend `useAuthForm.ts` Coordinated Priority & Injection Defense

**Files:**
- Modify: `frontend/src/features/auth/useAuthForm.ts`
- Test: `frontend/src/features/auth/__tests__/use-auth-form-priority.check.mjs`

**Interfaces:**
- Consumes: `/api/auth/resend-otp`, `isValidEmail`
- Produces: Hardened hook state prioritizing URL query, preserving plus-addressing, defending against non-email injection, and directing back-nav to register

- [ ] **Step 1: Write verification test for priority hierarchy & plus-addressing**

Create `frontend/src/features/auth/__tests__/use-auth-form-priority.check.mjs` verifying:
- URL query parameter parsing sanitizes `+` in email (no spaces).
- `isValidEmail` validates `emailParam` before setting state.
- `localStorage ('arm_remember_email')` does NOT overwrite `email` when URL param is present.
- `backToForm()` switches to `mode = 'register'`.
- `resendOtp()` invokes `/api/auth/resend-otp` with `{ email }`.

- [ ] **Step 2: Run verification test to confirm it fails**

Run: `node frontend/src/features/auth/__tests__/use-auth-form-priority.check.mjs`  
Expected: FAIL.

- [ ] **Step 3: Refactor `useAuthForm.ts`**

- Unify query parsing and `localStorage` into a single prioritized effect:
  ```ts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search;
    const params = search ? new URLSearchParams(search) : null;
    const rawEmailParam = params?.get('email');
    const rawOtpParam = params?.get('otp');

    if (rawEmailParam) {
      const sanitizedEmail = rawEmailParam.trim().replace(/\s+/g, '+').toLowerCase();
      if (isValidEmail(sanitizedEmail)) {
        setEmail(sanitizedEmail);
        if (rawOtpParam && /^\d{6}$/.test(rawOtpParam.trim())) {
          setStep('otp');
          setAutoVerifyCode(rawOtpParam.trim());
        }
        if (window.history?.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return; // Skip localStorage prefill completely
      }
    }

    try {
      const savedEmail = localStorage.getItem('arm_remember_email');
      if (savedEmail && initialMode === 'login') {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {}
  }, [initialMode]);
  ```
- Update `backToForm`:
  ```ts
  const backToForm = useCallback(() => {
    setStep('form');
    setMode('register');
    setError('');
    setAutoVerifyCode(null);
  }, []);
  ```
- Update `resendOtp`: Call `/api/auth/resend-otp` with `{ email: email.trim().toLowerCase() }`.

- [ ] **Step 4: Run verification test to confirm it passes**

Run: `node frontend/src/features/auth/__tests__/use-auth-form-priority.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/useAuthForm.ts frontend/src/features/auth/__tests__/use-auth-form-priority.check.mjs
git commit -m "fix(auth): enforce URL query precedence, sanitize plus-addressing, and wire resend-otp"
```

---

### Task 3: Harmonize `OtpStep.tsx` to Bencho Monochrome Minimalist Theme

**Files:**
- Modify: `frontend/src/features/auth/OtpStep.tsx`
- Test: `frontend/src/features/auth/__tests__/otp-step-bencho.check.mjs`

**Interfaces:**
- Produces: Monochromatic Bencho styled OTP step (white solid button, neutral input borders, zero red accents outside logo)

- [ ] **Step 1: Write check script for OtpStep Bencho styling**

Create `frontend/src/features/auth/__tests__/otp-step-bencho.check.mjs` verifying:
- Verify button uses `bg-white text-black font-semibold rounded-2xl hover:bg-[#E5E5E5]`.
- Digit inputs use neutral border `#2B2B32` and focus ring white (`focus:border-white`).
- Shield icon uses neutral `#9AA0A8` / `#18181C`.
- Resend button uses `text-white hover:underline` without red styling.

- [ ] **Step 2: Run verification test to confirm it fails**

Run: `node frontend/src/features/auth/__tests__/otp-step-bencho.check.mjs`  
Expected: FAIL with legacy red classes detected.

- [ ] **Step 3: Update `OtpStep.tsx` styling**

- Replace button classes:
  - Default: `w-full mt-1 rounded-2xl bg-white px-4 py-2 text-[13px] font-semibold text-black transition-all duration-150 ease-out hover:bg-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0F0F11] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50`
  - Verified: `bg-[#22C55E] text-white rounded-2xl`
- Replace digit input focus state: `focus:border-white focus:ring-1 focus:ring-white`.
- Replace shield icon: `text-[#9AA0A8] bg-[#18181C] border-[#2B2B32]`.
- Replace resend link: `text-white hover:underline disabled:text-[#5C6068]`.

- [ ] **Step 4: Run verification test to confirm it passes**

Run: `node frontend/src/features/auth/__tests__/otp-step-bencho.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/OtpStep.tsx frontend/src/features/auth/__tests__/otp-step-bencho.check.mjs
git commit -m "style(auth): harmonize OtpStep to Bencho minimalist monochrome theme"
```

---

### Task 4: End-to-End Build & Full Suite Verification

**Files:**
- Run all test suites across `frontend` and `backend`

- [ ] **Step 1: Run all frontend auth check scripts**

Run:
```bash
node frontend/src/features/auth/__tests__/use-auth-form-priority.check.mjs
node frontend/src/features/auth/__tests__/otp-step-bencho.check.mjs
node frontend/src/features/auth/__tests__/auth-checkbox.check.mjs
node frontend/src/features/auth/__tests__/auth-transition.check.mjs
node frontend/src/features/auth/__tests__/label-input.check.mjs
node frontend/src/features/auth/__tests__/use-auth-form-remember.check.mjs
node frontend/src/features/auth/__tests__/auth-google-button.check.mjs
node frontend/src/features/auth/__tests__/auth-card-bencho.check.mjs
node frontend/src/features/auth/__tests__/auth-card.check.mjs
```
Expected: All test scripts PASS.

- [ ] **Step 2: Run backend test check**

Run: `node backend/src/features/auth/__tests__/resend-otp.check.mjs`  
Expected: PASS.

- [ ] **Step 3: Run production builds**

Run:
```bash
npm --prefix backend run build
npm --prefix frontend run build
```
Expected: Code 0 on both builds with zero TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(auth): complete verification of OTP hardening and Bencho sync"
```