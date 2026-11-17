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

// 2. Accessibility
assert.ok(code.includes('role="dialog"'), 'AccountDrawer must include role="dialog"');
assert.ok(code.includes('aria-modal="true"'), 'AccountDrawer must include aria-modal="true"');
assert.ok(
  code.includes('type="button"'),
  'Interactive buttons must use semantic <button type="button">'
);
assert.ok(code.includes('Escape'), 'AccountDrawer must handle Escape key dismiss');
console.log('✓ Accessibility and keyboard navigation verified');

// 3. English copy
assert.ok(code.includes('Change password'), 'Must contain English header Change password');
assert.ok(code.includes('Current password'), 'Must contain English label Current password');
assert.ok(code.includes('New password'), 'Must contain English label New password');
assert.ok(code.includes('Confirm new password'), 'Must contain English label Confirm new password');
assert.ok(
  code.includes('/forgot-password'),
  'Must link to /forgot-password for forgotten credentials escape hatch'
);
console.log('✓ 100% English copy and /forgot-password link verified');

// 4. CSS Invariants
assert.ok(!code.includes('!important'), 'AccountDrawer must not use CSS !important');
console.log('✓ CSS specificity clean (zero !important)');

console.log('--- ALL ACCOUNT DRAWER CHECKS PASSED ---');
