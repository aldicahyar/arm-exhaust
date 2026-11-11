# Custom Checkbox & Fluid Auth Mode Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the "Remember me" control into an accessible tactile minimalist checkbox and introduce fluid layout accordion transitions using `framer-motion` for switching between Login and Register modes on the `/login` page with zero layout snap.

**Architecture:** Create an isolated, accessible `AuthCheckbox` component featuring hidden native checkbox and custom high-contrast monochrome tactile box. Refactor `AuthCard` using `framer-motion` (`AnimatePresence`, `motion.div`) with spring/bezier easing to smoothly expand and collapse conditional fields (`Full Name`, `PasswordStrength`, `Confirm Password`, and `AuthCheckbox`) with zero layout jump.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion v14.

**Spec:** [`docs/superpowers/specs/2026-11-11-auth-checkbox-and-smooth-transition-design.md`](file:///c:/Users/aldic/OneDrive/Documents/portofolioo/arm-exhaust/docs/superpowers/specs/2026-11-11-auth-checkbox-and-smooth-transition-design.md)

## Global Constraints

- Use existing `framer-motion` package; zero additional external dependencies.
- Maintain full accessibility: keyboard navigation (`Tab` to focus, `Space` to toggle, `aria-checked`).
- Preserve zero-scrollbar behavior on viewports at 90%–110% zoom.
- Zero TypeScript and Next.js build errors (`npm --prefix frontend run build`).
- Existing auth hooks (`useAuthForm`), OTP step, and Turnstile integration must remain intact.

## Review Focus

1. **Keyboard Accessibility**: `AuthCheckbox` must be reachable via `Tab` and toggleable via `Space`.
2. **Animation Clashing / Height Jumps**: Switching rapidly between Login and Register must not trigger overflow jank or unmounted layout collision.
3. **Controlled vs Uncontrolled Checkbox State**: State changes from `rememberMe` in `useAuthForm` must update the custom checkbox instantaneously.
4. **Framer Motion React 19 Compatibility**: Ensure motion wrappers do not trigger hydration or SSR warnings.
5. **Autofill & Password Strength Transition**: Ensure smooth collapse of `PasswordStrength` when criteria are met without visual stutter.

---

### Task 1: Create `AuthCheckbox` Tactile Component

**Files:**
- Create: `frontend/src/features/auth/AuthCheckbox.tsx`
- Create: `frontend/src/features/auth/__tests__/auth-checkbox.check.mjs`
- Modify: `frontend/src/features/auth/index.ts`

**Interfaces:**
- Produces: `AuthCheckbox(props: AuthCheckboxProps) => JSX.Element`
  ```typescript
  export interface AuthCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
    id?: string;
    className?: string;
  }
  ```

- [ ] **Step 1: Write verification check script for AuthCheckbox**

Create `frontend/src/features/auth/__tests__/auth-checkbox.check.mjs` verifying:
- File `AuthCheckbox.tsx` exists and exports `AuthCheckbox`.
- Component uses hidden native checkbox (`sr-only` class) with accessible properties.
- Component renders custom box with conditional solid white styling and black checkmark icon when `checked`.
- Exported from `frontend/src/features/auth/index.ts`.

- [ ] **Step 2: Run verification script to confirm it fails**

Run: `node frontend/src/features/auth/__tests__/auth-checkbox.check.mjs`  
Expected: FAIL with "AuthCheckbox.tsx must exist".

- [ ] **Step 3: Implement `AuthCheckbox.tsx` and export from `index.ts`**

Implement `AuthCheckbox.tsx`:
- Render `<label className="flex items-center gap-2 cursor-pointer select-none group py-0.5">`.
- Hidden `<input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />`.
- Custom indicator box: `w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all duration-200`.
  - Unchecked: `border-[#3A3A40] bg-[#141416]/90 group-hover:border-[#52525A]`.
  - Checked: `border-white bg-white text-black shadow-sm`.
  - Checkmark SVG icon with scale spring/pop micro-interaction.
- Label text: `text-[11.5px] text-[#9AA0A8] group-hover:text-white transition-colors`.
- Export `AuthCheckbox` in `frontend/src/features/auth/index.ts`.

- [ ] **Step 4: Run verification script to confirm it passes**

Run: `node frontend/src/features/auth/__tests__/auth-checkbox.check.mjs`  
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/AuthCheckbox.tsx frontend/src/features/auth/__tests__/auth-checkbox.check.mjs frontend/src/features/auth/index.ts
git commit -m "feat(auth): create custom minimalist tactile AuthCheckbox component"
```

---

### Task 2: Implement Framer Motion Smooth Transition & Fluid Height Morphing in `AuthCard.tsx`

**Files:**
- Modify: `frontend/src/features/auth/AuthCard.tsx`
- Create: `frontend/src/features/auth/__tests__/auth-transition.check.mjs`

**Interfaces:**
- Consumes: `AuthCheckbox`, `framer-motion` (`AnimatePresence`, `motion`)
- Produces: Seamlessly animated form mode transitions in `AuthCard.tsx`

- [ ] **Step 1: Write check script for AuthCard transition integration**

Create `frontend/src/features/auth/__tests__/auth-transition.check.mjs` verifying:
- `AuthCard.tsx` imports `AuthCheckbox` and uses `<AuthCheckbox`.
- `AuthCard.tsx` imports `AnimatePresence` and `motion` from `framer-motion`.
- Conditional register fields (`Full Name`, `PasswordStrength`, `Confirm Password`) and login field (`AuthCheckbox`) are wrapped inside animated `motion.div` blocks with `overflow-hidden` and `AnimatePresence`.

- [ ] **Step 2: Run verification script to confirm it fails**

Run: `node frontend/src/features/auth/__tests__/auth-transition.check.mjs`  
Expected: FAIL ("AuthCard must use AuthCheckbox").

- [ ] **Step 3: Refactor `AuthCard.tsx` with smooth Framer Motion transitions**

- Replace legacy native checkbox with `<AuthCheckbox checked={rememberMe} onChange={setRememberMe} label="Remember me" />`.
- Wrap conditional sections in `<AnimatePresence initial={false}>`:
  - `Full Name`: `motion.div` with `initial={{ opacity: 0, height: 0 }}`, `animate={{ opacity: 1, height: 'auto' }}`, `exit={{ opacity: 0, height: 0 }}`, `transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}`.
  - `PasswordStrength` & `Confirm Password`: `motion.div` with matching height/opacity collapse transition.
  - `Remember Me`: `motion.div` with matching height/opacity collapse transition.
- Add `layout` or smooth cross-fade to subtitle text and submit button text.

- [ ] **Step 4: Run verification script to confirm it passes**

Run: `node frontend/src/features/auth/__tests__/auth-transition.check.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/AuthCard.tsx frontend/src/features/auth/__tests__/auth-transition.check.mjs
git commit -m "feat(auth): integrate AuthCheckbox and fluid layout morphing transitions in AuthCard"
```

---

### Task 3: End-to-End Build Verification & Suite Integration

**Files:**
- Modify: `frontend/src/features/auth/__tests__/*` (verify all pass)

- [ ] **Step 1: Run all auth test scripts**

Run:
```bash
node frontend/src/features/auth/__tests__/auth-checkbox.check.mjs
node frontend/src/features/auth/__tests__/auth-transition.check.mjs
node frontend/src/features/auth/__tests__/label-input.check.mjs
node frontend/src/features/auth/__tests__/use-auth-form-remember.check.mjs
node frontend/src/features/auth/__tests__/auth-google-button.check.mjs
node frontend/src/features/auth/__tests__/auth-card-bencho.check.mjs
node frontend/src/features/auth/__tests__/label-input-fixes.check.mjs
node frontend/src/features/auth/__tests__/auth-card.check.mjs
```
Expected: All 8 test scripts PASS.

- [ ] **Step 2: Run Next.js production build**

Run: `npm --prefix frontend run build`  
Expected: Success with 0 TypeScript and 0 linting errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(auth): complete verification of tactile checkbox and fluid transitions"
```
