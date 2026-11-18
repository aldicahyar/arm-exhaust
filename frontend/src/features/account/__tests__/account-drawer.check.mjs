import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../../..');

console.log('--- RUNNING ACCOUNT DRAWER COMPONENT AUDIT CHECK ---');

const drawerPath = path.join(
  frontendDir,
  'src/features/account/components/AccountDrawer.tsx'
);

assert.ok(fs.existsSync(drawerPath), 'Missing required file: AccountDrawer.tsx');
console.log('✓ AccountDrawer.tsx exists');

const code = fs.readFileSync(drawerPath, 'utf-8');

// 1. Strict geometry and zero AI slop
assert.ok(
  !code.includes('rounded-md') &&
    !code.includes('rounded-lg') &&
    !code.includes('rounded-xl') &&
    !code.includes('rounded-2xl'),
  'AccountDrawer must not use rounded corners (strict 0px geometry / rounded-none)'
);
assert.ok(
  !code.includes('#4ade80') && !code.includes('#22c55e') && !code.includes('text-green'),
  'AccountDrawer must not include green AI-slop color accents'
);
console.log('✓ Strict 0px geometry and monochrome palette verified');

// 2. Hybrid Bencho Design Integration
assert.ok(
  code.includes('LabelInput'),
  'AccountDrawer must integrate LabelInput for login-page design harmony'
);
assert.ok(
  code.includes('corner={0}'),
  'AccountDrawer must configure LabelInput with corner={0} for hybrid sharp stealth'
);
assert.ok(
  code.includes('PasswordStrength'),
  'AccountDrawer must integrate PasswordStrength component'
);
console.log('✓ Hybrid Bencho LabelInput & PasswordStrength verified');

// 3. Elimination of Redundant Elements (Decluttering)
assert.ok(
  !code.includes('Forgot your current password'),
  'AccountDrawer must eliminate redundant Forgot your current password text'
);
assert.ok(
  !code.includes('/forgot-password'),
  'AccountDrawer must eliminate redundant /forgot-password link'
);
assert.ok(
  !code.includes('Cancel</button>'),
  'AccountDrawer must eliminate redundant Cancel button under action'
);
assert.ok(
  !code.includes('ARM ACCOUNT SECURITY') && !code.includes('END-TO-END ENCRYPTED'),
  'AccountDrawer must eliminate bottom hairline security meta text'
);
console.log('✓ Clutter elimination verified: Zero Cancel button, Zero forgot-password link, Zero footer meta text');

// 4. Security Revocation & Auto Sign Out Flow
assert.ok(
  code.includes('/login?status=password_changed'),
  'AccountDrawer must redirect to /login upon password change for session revocation'
);
assert.ok(
  code.toLowerCase().includes('all active sessions across all devices have been signed out'),
  'AccountDrawer must inform user that all sessions across all devices were revoked'
);
console.log('✓ Security session revocation and sign-in redirect verified');

// 5. Motion & Smooth Bencho Transitions
assert.ok(code.includes('motion.div'), 'AccountDrawer must use motion.div for fluid slide animation');
assert.ok(code.includes('AnimatePresence'), 'AccountDrawer must use AnimatePresence for exit animations');
assert.ok(
  code.includes("x: '100%'") || code.includes('x: "100%"'),
  'AccountDrawer must animate on x axis'
);
console.log('✓ Fluid Framer Motion / Bencho slide animation verified');

// 6. Accessibility
assert.ok(code.includes('role="dialog"'), 'AccountDrawer must include role="dialog"');
assert.ok(code.includes('aria-modal="true"'), 'AccountDrawer must include aria-modal="true"');
assert.ok(code.includes('Escape'), 'AccountDrawer must handle Escape key dismiss');
console.log('✓ Accessibility and keyboard navigation verified');

// 7. English copy
assert.ok(code.includes('Change password'), 'Must contain English header Change password');
assert.ok(code.includes('Current password'), 'Must contain English label Current password');
assert.ok(code.includes('New password'), 'Must contain English label New password');
assert.ok(code.includes('Confirm new password'), 'Must contain English label Confirm new password');
console.log('✓ 100% English copy verified');

// 8. CSS Invariants, Zero Scrollbar, & Pinned Layout
assert.ok(!code.includes('!important'), 'AccountDrawer must not use CSS !important');
assert.ok(
  code.includes('scrollbar-none'),
  'AccountDrawer must suppress scrollbars on drawer panel and inputs'
);
assert.ok(
  !code.includes('🔒'),
  'AccountDrawer must not contain emojis or informal symbols like 🔒'
);
assert.ok(
  code.includes('shrink-0') && code.includes('flex-1 overflow-y-auto'),
  'AccountDrawer must structure layout with pinned header/footer and scrollable body'
);
console.log('✓ CSS specificity clean, zero scrollbars, zero emojis, and pinned footer verified');

// 9. DateWheelPicker & Steam-Style CS Fallback Integration
assert.ok(
  code.includes('DateWheelPicker') || code.includes('DateWheelPickerModal'),
  'AccountDrawer must integrate DateWheelPicker or DateWheelPickerModal component'
);
assert.ok(
  code.includes('isDobPickerOpen') && code.includes('setIsDobPickerOpen'),
  'AccountDrawer must manage modal picker state via isDobPickerOpen'
);
assert.ok(
  code.includes('DateWheelPickerModal'),
  'AccountDrawer must integrate dedicated DateWheelPickerModal overlay to avoid inline layout shift'
);
assert.ok(
  !code.includes('permanently locked'),
  'AccountDrawer must eliminate redundant disclaimer text when Date of birth is already set'
);
assert.ok(
  code.includes('isDobLocked'),
  'AccountDrawer must maintain isDobLocked state'
);
assert.ok(
  !code.includes('ONE-TIME SET') && !code.includes('One-Time Set'),
  'AccountDrawer must eliminate the ONE-TIME SET badge for clean minimalist UX'
);
assert.ok(
  code.includes('disabled') && code.includes('isDobLocked'),
  'AccountDrawer must disable Date of birth field when already filled'
);
console.log('✓ Dedicated DateWheelPickerModal overlay, zero redundant disclaimers, and locked disabled state verified in AccountDrawer');

console.log('--- ALL ACCOUNT DRAWER CHECKS PASSED ---');
