# Bencho Minimalist Auth Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the `/login` and registration form in ARM Exhaust into a high-contrast minimalist aesthetic inspired by Bencho (`bencho.dev/?c=label-input&theme=dark`), featuring dynamic SVG ring cut-out inputs, staggered letter-hop micro-animations, a minimalist "Remember Me" checkbox, and matching monochrome action buttons where only the ARM logo retains red.

**Architecture:** Create an isolated, reusable `LabelInput` component using SVG path geometry with dynamic `ResizeObserver` width and cut-out gap stroke animation. Update `useAuthForm` with `rememberMe` state management. Refactor `AuthCard` and `AuthGoogleButton` to use unified `rounded-2xl` (18px) geometry, solid white high-contrast primary CTA, and monochrome accents.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, SVG Path Animation, Vitest/Node check scripts.

**Spec:** [`docs/superpowers/specs/2026-11-11-bencho-minimalist-auth-design.md`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/docs/superpowers/specs/2026-11-11-bencho-minimalist-auth-design.md)

## Global Constraints

- Strictly monochrome palette for all interactive controls (inputs, buttons, checkbox, labels); only the ARM Exhaust logo retains its authentic red mark.
- Component width must be fully responsive (`w-full`) to adapt seamlessly across mobile (360px) and desktop split card layouts.
- Input corner radius fixed at 18px (`rounded-2xl`), height 52px.
- Zero TypeScript (`tsc`) and Next.js build errors (`npm --prefix frontend run build`).
- Existing security & auth capabilities (Cloudflare Turnstile, OTP verification, PasswordStrength meter) must remain 100% operational.

## Review Focus

1. **Browser Autofill Handling**: When a browser autofills email/password, `data-up` must activate so the label does not overlap the autofilled text.
2. **Dynamic Resize / Window Scaling**: When switching between mobile and desktop or resizing windows, the SVG ring path must recalculate without visual glitch or stretching.
3. **Password Visibility Toggle**: Toggling password visibility must not shift input caret or trigger unwanted form submit.
4. **Validation Error Ring**: When password confirmation fails (`passwordsMismatch`), the SVG ring must highlight in error red while maintaining the cut-out gap.
5. **Session Persistence**: When "Remember Me" is checked, the email preference should be stored to prepopulate on next visit.

---

### Task 1: Create `LabelInput` Component with Dynamic SVG Ring & Letter-Hop Animation

**Files:**
- Create: `frontend/src/features/auth/LabelInput.tsx`
- Create: `frontend/src/features/auth/__tests__/label-input.check.mjs`
- Modify: `frontend/src/features/auth/index.ts`
- Modify: `frontend/src/app/globals.css` (or embedded styled classes)

**Interfaces:**
- Produces: `LabelInput(props: LabelInputProps) => JSX.Element`
  ```typescript
  export interface LabelInputProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: 'text' | 'email' | 'password';
    name?: string;
    id?: string;
    required?: boolean;
    disabled?: boolean;
    autoComplete?: string;
    minLength?: number;
    maxLength?: number;
    corner?: number;
    error?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    className?: string;
  }
  ```

- [ ] **Step 1: Write verification check script for LabelInput**

Create `frontend/src/features/auth/__tests__/label-input.check.mjs` to verify:
- Component exports correctly and exports `LabelInput`.
- Component file defines SVG path calculation routines (`lbi-ring`, `lbi-gap`, `lbi-label`, `lbi-field`, `lbi-eye`).
- Keyframes `lbi-hop` and data attributes (`data-up`, `data-focus`, `data-filled`) are present.

- [ ] **Step 2: Run verification script to confirm it fails**

Run: `node frontend/src/features/auth/__tests__/label-input.check.mjs`  
Expected: FAIL with "MODULE_NOT_FOUND" or file missing.

- [ ] **Step 3: Implement `LabelInput.tsx` and CSS micro-interactions**

Implement `LabelInput.tsx`:
- Add `useRef` and `ResizeObserver` to measure container `boxWidth` dynamically.
- Add hidden span ref to measure `labelWidth` for dynamic cut-out gap calculation.
- Render SVG with 4 paths:
  - Left rounded arc + bottom half
  - Right rounded arc + bottom half
  - Top gap segment 1 & 2 with `pathLength={1}` and `strokeDashoffset={isUp ? -1 : 0}`
- Staggered letter-hop label: `[...label].map((char, i) => <span key={i} style={{ '--i': i } as React.CSSProperties}>{char}</span>)`.
- Smooth password eye toggle button with morphing SVGs.
- Export `LabelInput` from `frontend/src/features/auth/index.ts`.
- Add `.lbi-hop` keyframes to `frontend/src/app/globals.css` or component stylesheet.

- [ ] **Step 4: Run verification script to confirm it passes**

Run: `node frontend/src/features/auth/__tests__/label-input.check.mjs`  
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/LabelInput.tsx frontend/src/features/auth/__tests__/label-input.check.mjs frontend/src/features/auth/index.ts frontend/src/app/globals.css
git commit -m "feat(auth): create Bencho-style LabelInput component with SVG ring and letter-hop"
```

---

### Task 2: Extend `useAuthForm.ts` and `types.ts` for "Remember Me" State

**Files:**
- Modify: `frontend/src/features/auth/types.ts:30-42`
- Modify: `frontend/src/features/auth/useAuthForm.ts:60-120, 290-340`
- Test: `frontend/src/features/auth/__tests__/use-auth-form-remember.check.mjs`

**Interfaces:**
- Consumes: `useAuthForm` hook
- Produces: `rememberMe: boolean`, `setRememberMe: (val: boolean) => void` in `useAuthForm` return object.

- [ ] **Step 1: Write test for rememberMe state in useAuthForm**

Create `frontend/src/features/auth/__tests__/use-auth-form-remember.check.mjs` verifying:
- `useAuthForm` exports `rememberMe` and `setRememberMe`.
- Default value is `false` (or loads saved email from localStorage if available).
- Payload in login mode incorporates `rememberMe: true/false`.

- [ ] **Step 2: Run verification script to confirm it fails**

Run: `node frontend/src/features/auth/__tests__/use-auth-form-remember.check.mjs`  
Expected: FAIL ("rememberMe is not exported").

- [ ] **Step 3: Update `types.ts` and `useAuthForm.ts`**

- In `types.ts`, add `rememberMe?: boolean` to `AuthFormState`.
- In `useAuthForm.ts`:
  - Initialize `rememberMe` state.
  - On mount, check `localStorage.getItem('arm_remember_email')`; if found, populate `email` and set `rememberMe = true`.
  - In `handleSubmit`, if `!isRegister && rememberMe`, save email to `localStorage`; if `!rememberMe`, remove key. Include `rememberMe` in request body.
  - Return `rememberMe` and `setRememberMe` from `useAuthForm`.

- [ ] **Step 4: Run verification script to confirm it passes**

Run: `node frontend/src/features/auth/__tests__/use-auth-form-remember.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/types.ts frontend/src/features/auth/useAuthForm.ts frontend/src/features/auth/__tests__/use-auth-form-remember.check.mjs
git commit -m "feat(auth): add rememberMe state and persistent storage to useAuthForm"
```

---

### Task 3: Harmonize `AuthGoogleButton.tsx` and Action Buttons

**Files:**
- Modify: `frontend/src/features/auth/AuthGoogleButton.tsx:117-159`
- Test: `frontend/src/features/auth/__tests__/auth-google-button.check.mjs`

**Interfaces:**
- Consumes: `AuthGoogleButton`
- Produces: Updated `AuthGoogleButton` with `rounded-2xl` (18px) geometry, neutral minimalist border `#2B2B30`, and height ~48px.

- [ ] **Step 1: Write check script for AuthGoogleButton styling**

Create `frontend/src/features/auth/__tests__/auth-google-button.check.mjs` to check that button class names include `rounded-2xl`, height/padding matching the 50px profile, and border `#2B2B30`.

- [ ] **Step 2: Run check script to verify it fails**

Run: `node frontend/src/features/auth/__tests__/auth-google-button.check.mjs`  
Expected: FAIL (still using old `rounded-lg`).

- [ ] **Step 3: Update `AuthGoogleButton.tsx`**

- Change outer wrapper and button to `rounded-2xl border border-[#2B2B30] bg-[#141416] py-3.5 hover:border-[#44444C] hover:bg-[#1A1A1E]`.
- Ensure Google GIS native overlay also has `rounded-2xl`.

- [ ] **Step 4: Run check script to verify it passes**

Run: `node frontend/src/features/auth/__tests__/auth-google-button.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/AuthGoogleButton.tsx frontend/src/features/auth/__tests__/auth-google-button.check.mjs
git commit -m "style(auth): align Google SSO button to rounded-2xl minimalist geometry"
```

---

### Task 4: Integrate `LabelInput`, "Remember Me" Checkbox, and Solid White CTA into `AuthCard.tsx`

**Files:**
- Modify: `frontend/src/features/auth/AuthCard.tsx:115-274`
- Test: `frontend/src/features/auth/__tests__/auth-card-bencho.check.mjs`

**Interfaces:**
- Consumes: `LabelInput`, `useAuthForm`, `AuthGoogleButton`
- Produces: Complete Bencho-inspired auth interface in `AuthCard.tsx`

- [ ] **Step 1: Write check script for AuthCard integration**

Create `frontend/src/features/auth/__tests__/auth-card-bencho.check.mjs` to verify:
- `LabelInput` is imported and used for `name`, `email`, `password`, `confirmPassword`.
- Checkbox for "Remember me" is present in login mode.
- Submit button has solid white background (`bg-white text-black rounded-2xl`).
- Mode toggle button uses clean white underline styling (`text-white hover:underline`).

- [ ] **Step 2: Run check script to verify it fails**

Run: `node frontend/src/features/auth/__tests__/auth-card-bencho.check.mjs`  
Expected: FAIL.

- [ ] **Step 3: Refactor `AuthCard.tsx`**

- Replace inputs with `<LabelInput label="Full Name" ... corner={18} />`, `<LabelInput label="Email" type="email" ... />`, `<LabelInput label="Password" type="password" ... />`, `<LabelInput label="Confirm Password" type="password" ... error={passwordsMismatch} />`.
- On login mode (`!isRegister`), add the minimalist checkbox:
  ```tsx
  <div className="flex items-center justify-between text-xs my-1">
    <label className="flex items-center gap-2 cursor-pointer select-none text-[#9AA0A8] hover:text-white transition-colors">
      <input
        type="checkbox"
        checked={rememberMe}
        onChange={(e) => setRememberMe(e.target.checked)}
        className="h-4 w-4 rounded-md border border-[#3A3A40] bg-[#141416] text-white accent-white focus:ring-0 focus:outline-none"
      />
      <span>Remember me</span>
    </label>
  </div>
  ```
- Update submit button to solid white:
  `className="mt-2 w-full rounded-2xl bg-white px-4 py-3.5 text-[14px] font-semibold text-black transition-all duration-150 ease-out hover:bg-[#E5E5E5] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"`
- Update mode toggle button to clean white link.

- [ ] **Step 4: Run check script to verify it passes**

Run: `node frontend/src/features/auth/__tests__/auth-card-bencho.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/AuthCard.tsx frontend/src/features/auth/__tests__/auth-card-bencho.check.mjs
git commit -m "feat(auth): integrate LabelInput, Remember Me checkbox, and solid white CTA in AuthCard"
```

---

### Task 5: End-to-End Build Verification & Visual Refinement

**Files:**
- Modify: `frontend/src/features/auth/LabelInput.tsx` (if edge cases detected)
- Modify: `frontend/src/app/globals.css` (if extra keyframes required)

- [ ] **Step 1: Run Next.js production build**

Run: `npm --prefix frontend run build`  
Expected: Success with 0 TypeScript and 0 linting errors.

- [ ] **Step 2: Run all check scripts in auth suite**

Run:
```bash
node frontend/src/features/auth/__tests__/label-input.check.mjs
node frontend/src/features/auth/__tests__/use-auth-form-remember.check.mjs
node frontend/src/features/auth/__tests__/auth-google-button.check.mjs
node frontend/src/features/auth/__tests__/auth-card-bencho.check.mjs
```
Expected: All checks PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(auth): complete Bencho minimalist auth styling verification"
```
