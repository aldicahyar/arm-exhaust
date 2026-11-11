# Design Specification: Auth OTP Flow Hardening, Injection Defense & Bencho Monochrome Sync

**Date:** 2026-11-11  
**Status:** Pending User Approval  
**Author:** Pair Programming Assistant (Antigravity) & User  
**File:** `docs/superpowers/specs/2026-11-11-auth-otp-hardening-and-bencho-sync-design.md`

---

## 1. Intent & The Why

When a user registers on ARM Exhaust (e.g., using `arkanpasiva+8@gmail.com`) and opens the 1-click verification link from their email (`http://localhost:3000/login?email=...&otp=...`), two critical issues occur:
1. **Email Hijacking via Race Condition**: `useAuthForm.ts` runs a second `useEffect` on mount that unconditionally reads `localStorage.getItem('arm_remember_email')` (which contained `superadmin@armexhaust.id` from a previous session) and overwrites the user's registered email. This causes OTP submission to fail with `400 Bad Request` and renders `superadmin@armexhaust.id` on screen.
2. **Missing Resilience on Edge Cases**:
   - Plus-addressed emails (`arkanpasiva+8@gmail.com`) can have the `+` character decoded as a space if URL encoding is incomplete.
   - When the link is opened in a new browser tab or refreshed, in-memory state (`name`, `password`) is empty. Clicking "Resend Code" fails because `/api/auth/register` requires a password.
   - Clicking "Change email or back to registration" sends the user to Login mode instead of Register mode.
   - The OTP UI still features legacy `#E81828` red accents on buttons, borders, and icons, violating the Bencho minimalist monochrome standard where only the ARM Exhaust logo retains red color.
   - Input fields need explicit sanitization against Script Injection (XSS, HTML injection, and parameter tampering).

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Strict Email Precedence**: URL parameter `?email=...` takes absolute precedence over `localStorage`.
- **Remember Me Quarantine**: `arm_remember_email` from `localStorage` is ONLY read when `initialMode === 'login'`, `step === 'form'`, and NO email query parameter is present.
- **Script Injection & XSS Defense-in-Depth**:
  - Validate email format with regex before accepting query params into state.
  - Sanitize name and email inputs by stripping HTML tags (`<`, `>`) and control characters.
  - Rely on React's automatic string escaping for DOM output (zero `dangerouslySetInnerHTML`).
  - Rely on parameterized queries (`$1, $2, ...`) in PostgreSQL to guarantee zero SQL injection.
  - Strictly validate 6 numeric digits on OTP (`/^[0-9]{6}$/`).
- **Seamless Resend OTP (`POST /api/auth/resend-otp`)**:
  - Introduce a lightweight backend endpoint that generates a fresh OTP and resends email for an active, unverified registration ticket without requiring re-entry of password.
- **Accurate Back Navigation**: "Change email or back to registration" cleanly returns the user to `mode = 'register'` with `step = 'form'`.
- **Bencho Monochrome Harmonization**:
  - Replace red button in `OtpStep.tsx` with high-contrast `bg-white text-black font-semibold rounded-2xl hover:bg-[#E5E5E5]`.
  - Neutralize input borders and icons into dark monochrome `#2B2B32` / white focus rings.

### Non-Goals
- Altering the cryptographic foundation: AES-256-GCM registration payload encryption, Scrypt password hashing, and Turnstile tokens remain as designed.
- Changing customer/admin role logic or session cookie lifespan.

### Anti-Goals
- Do not clear the user's legitimate `localStorage ('arm_remember_email')` unless they explicitly untick "Remember me" on the login form.
- Do not introduce external sanitization libraries when native string sanitization and regex contracts suffice.

---

## 3. Security Analysis: Script Injection & Vulnerability Mitigation

| Vector | Risk in Current App | Hardened Mitigation |
|---|---|---|
| **Cross-Site Scripting (XSS) via URL Query** | Low in React (React auto-escapes text nodes), but unvalidated query strings could populate state with non-email garbage. | Add `isValidEmail(emailParam)` check before accepting query param. If invalid, discard and remain on clean login form. |
| **Gmail Plus-Addressing (`+` to space)** | Medium: Unencoded `+` gets decoded by `URLSearchParams` as space (` `), breaking email lookups. | Explicitly sanitize: `emailParam.trim().replace(/\s+/g, '+').toLowerCase()`. |
| **HTML Injection in Name Input** | Low: Stored in DB, but potential risk if rendered unescaped in third-party or admin tools. | Sanitize name in `RegisterDto` and client: strip `<` and `>` tags, enforce 2-100 characters. |
| **SQL Injection (SQLi)** | Zero: All queries in `auth.service.ts` use parameterized queries (`$1`, `$2`). | Maintain 100% parameterized queries in the new `resend-otp` endpoint. |
| **Brute-Force OTP** | Zero: 5 failed attempts lock verification for 5 minutes (`locked_until`). Exponential sleep per attempt. | Keep existing rate limiting on `verify-otp` and apply rate limit on `resend-otp`. |

---

## 4. Approaches Considered

- **Approach A (Comprehensive Full-Stack Hardening - SELECTED)**:
  - Coordinate state priority in `useAuthForm.ts`.
  - Add backend `POST /api/auth/resend-otp` endpoint.
  - Sanitize inputs and protect plus-addressing.
  - Harmonize `OtpStep.tsx` to Bencho monochrome minimalism.
  - *Why selected:* Eliminates all edge cases, supports multi-tab email opening, provides complete XSS defense, and ensures visual consistency.

- **Approach B (Client-Only Hotfix)**:
  - Add simple conditional checks in `useAuthForm.ts` and warn user to re-register if resend is clicked in a new tab.
  - *Why rejected:* Degrades user experience if the user opens their verification email on a different device or tab.

---

## 5. Technical Implementation Details

### 5.1 Frontend: `frontend/src/features/auth/useAuthForm.ts`
1. **Single Coordinated Initialization Effect**:
   ```ts
   useEffect(() => {
     if (typeof window === 'undefined') return;
     const search = window.location.search;
     const params = search ? new URLSearchParams(search) : null;
     const rawEmailParam = params?.get('email');
     const rawOtpParam = params?.get('otp');

     if (rawEmailParam) {
       // Preserve '+' for plus-addressing (e.g. arkanpasiva+8@gmail.com)
       const sanitizedEmail = rawEmailParam.trim().replace(/\s+/g, '+').toLowerCase();
       if (isValidEmail(sanitizedEmail)) {
         setEmail(sanitizedEmail);
         if (rawOtpParam && /^\d{6}$/.test(rawOtpParam.trim())) {
           setStep('otp');
           setAutoVerifyCode(rawOtpParam.trim());
         }
         // Strip credentials from address bar
         if (window.history?.replaceState) {
           window.history.replaceState({}, document.title, window.location.pathname);
         }
         return; // Skip localStorage prefill completely
       }
     }

     // Only prefill from localStorage if in login form and no email param was provided
     try {
       const savedEmail = localStorage.getItem('arm_remember_email');
       if (savedEmail && initialMode === 'login') {
         setEmail(savedEmail);
         setRememberMe(true);
       }
     } catch {}
   }, [initialMode]);
   ```
2. **Back Navigation**:
   ```ts
   const backToForm = useCallback(() => {
     setStep('form');
     setMode('register');
     setError('');
     setAutoVerifyCode(null);
   }, []);
   ```
3. **Resend OTP Integration**:
   Call `POST /api/auth/resend-otp` with `{ email }`. If successful, reset OTP timer and digits.

### 5.2 Backend: `backend/src/features/auth/`
1. **Endpoint `POST /api/auth/resend-otp`**:
   - DTO: `ResendOtpDto` validating `@IsEmail() email: string`.
   - Controller: `@Post('resend-otp')` with `RateLimitGuard`.
   - Service:
     - Query `transaction.t_trx_registration_otps` for active ticket (`WHERE identifier = $1 AND verified_at IS NULL`).
     - If not found, return `404 Not Found` or `400 Bad Request` ("No pending verification found for this email.").
     - Check `locked_until`.
     - Generate new 6-digit OTP, compute scrypt hash, update row with new `otp_hash`, `request_count = request_count + 1`, and refreshed `expires_at`.
     - Call `mailerService.sendOtpEmail(email, newOtp)`.
     - Return `{ ok: true, message: 'Verification code resent successfully.' }`.

### 5.3 UI: `frontend/src/features/auth/OtpStep.tsx`
1. Change "Verify & Complete" button:
   - Default: `bg-white text-black font-semibold rounded-2xl hover:bg-[#E5E5E5] transition-all duration-150`.
   - Verified: `bg-[#22C55E] text-white rounded-2xl`.
2. Change digits border and focus ring:
   - Neutral `#2B2B32`, focus ring white (`focus:border-white focus:ring-1 focus:ring-white`).
3. Change header shield icon:
   - Subtle monochrome `text-[#9AA0A8] bg-[#18181C] border-[#2B2B32]`.
4. Change resend link:
   - `text-white hover:underline`.

---

## 6. Verification Strategy
- **Unit Tests**:
  - `use-auth-form-priority.check.mjs`: Tests priority of URL param over `localStorage`, plus-addressing preservation, and back-to-register navigation.
  - `backend-resend-otp.check.mjs`: Tests `POST /api/auth/resend-otp` endpoint contract, rate limiting, and email dispatch.
- **Full Suite**: Run all 9 auth test scripts.
- **Build Checks**:
  - Backend TypeScript build (`npm --prefix backend run build` or `nest build`).
  - Frontend Next.js build (`npm --prefix frontend run build`).