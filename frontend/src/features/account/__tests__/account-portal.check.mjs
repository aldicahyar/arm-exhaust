import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../../..');

console.log('--- RUNNING CUSTOMER ACCOUNT PORTAL AUDIT CHECK ---');

const requiredFiles = [
  'src/features/account/types.ts',
  'src/features/account/components/AccountNavRail.tsx',
  'src/features/account/components/AccountSections.tsx',
  'src/features/account/components/AccountPortal.tsx',
  'src/features/account/components/AccountDrawer.tsx',
  'src/features/account/services/account.api.ts',
  'src/features/account/index.ts',
  'src/app/account/page.tsx',
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(frontendDir, relPath);
  assert.ok(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
  console.log(`✓ File verified: ${relPath}`);
}

// 1. Audit AccountPortal.tsx for Zero Meta-Text & Zero Slop
const portalCode = fs.readFileSync(
  path.join(frontendDir, 'src/features/account/components/AccountPortal.tsx'),
  'utf-8'
);

assert.ok(
  !portalCode.includes('Customer Portal / Polestar Stealth'),
  'AccountPortal must remove dev tag Customer Portal / Polestar Stealth'
);
console.log('✓ Dev metadata tag eliminated from AccountPortal');

assert.ok(
  !portalCode.includes('#4ade80') && !portalCode.includes('#22c55e') && !portalCode.includes('text-green'),
  'AccountPortal must not include green AI-slop color tokens'
);
console.log('✓ Zero AI-green accents verified in AccountPortal');

assert.ok(
  portalCode.includes('<AccountDrawer'),
  'AccountPortal must integrate AccountDrawer component'
);
assert.ok(
  !portalCode.includes('window.prompt'),
  'AccountPortal must not use window.prompt mock handlers'
);
console.log('✓ AccountDrawer integration and removal of window.prompt verified in AccountPortal');

// 2. Audit Motion and Bencho Transitions
assert.ok(
  portalCode.includes('motion.div') && portalCode.includes('AnimatePresence'),
  'AccountPortal must integrate motion.div and AnimatePresence for smooth navigation transitions'
);
assert.ok(
  portalCode.includes('BENCHO_EASE'),
  'AccountPortal must use the standard Bencho easing curve for smooth motion'
);
console.log('✓ Bencho Framer Motion transitions verified in AccountPortal');

// 3. Audit AppChrome.tsx for Header Hiding on /account
const appChromeCode = fs.readFileSync(
  path.join(frontendDir, 'src/shared/components/AppChrome.tsx'),
  'utf-8'
);

assert.ok(
  appChromeCode.includes("pathname?.startsWith('/account')"),
  'AppChrome must exclude global header on /account route for clean aesthetic'
);
console.log('✓ Global header properly hidden on /account via AppChrome');

// 4. Audit AccountSections.tsx
const sectionsCode = fs.readFileSync(
  path.join(frontendDir, 'src/features/account/components/AccountSections.tsx'),
  'utf-8'
);

assert.ok(
  sectionsCode.includes('Sign-in and security') &&
  sectionsCode.includes('Personal information'),
  'AccountSections must include Sign-in and security and Personal information'
);
assert.ok(
  !sectionsCode.includes('heading-advanced'),
  'AccountSections must eliminate obsolete Advanced section'
);
assert.ok(
  sectionsCode.includes('getMembershipBadge') &&
  sectionsCode.includes('Official Reseller') &&
  sectionsCode.includes('ARM Member'),
  'AccountSections must support Role-Based Membership Badges (Official Reseller & ARM Member)'
);
console.log('✓ Balanced 2-pillar sections and dynamic Role-Based Membership Badges present in AccountSections');

assert.ok(
  !sectionsCode.includes('!important'),
  'AccountSections must not use CSS !important'
);
console.log('✓ CSS specificity clean (no !important)');

assert.ok(
  portalCode.includes('grid grid-cols-1 lg:grid-cols-2'),
  'AccountPortal must organize sections in a balanced 2-column layout'
);
assert.ok(
  portalCode.includes('Terms & Conditions') &&
  portalCode.includes("activeTab === 'privacy'"),
  'AccountPortal must house Terms & Conditions cleanly in Privacy tab'
);
console.log('✓ Balanced 2-column layout and Privacy tab Terms & Conditions verified in AccountPortal');

assert.ok(
  portalCode.includes("classList.add('scrollbar-none')") &&
  portalCode.includes("classList.remove('scrollbar-none')") &&
  portalCode.includes('scrollbar-none'),
  'AccountPortal must suppress scrollbars on root document and component container'
);
console.log('✓ Zero scrollbars verified across page /account');

assert.ok(
  !sectionsCode.includes('Recovery phone number'),
  'AccountSections must eliminate redundant Recovery phone number'
);
assert.ok(
  sectionsCode.includes('Date of birth'),
  'AccountSections must retain Date of birth for user info and promotions'
);
assert.ok(
  !sectionsCode.includes('Delete account'),
  'AccountSections must eliminate Delete account action as requested'
);
assert.ok(
  !sectionsCode.includes('Two-factor authentication'),
  'AccountSections must eliminate static mock Two-factor authentication row'
);
assert.ok(
  !sectionsCode.includes('Copy ID') && !sectionsCode.includes('accountIdentifier'),
  'AccountSections must eliminate Copy ID and raw account identifier for security & simplicity'
);
console.log('✓ Form redundancy elimination, Date of birth retention, and Copy ID elimination verified in AccountSections');

assert.ok(
  !sectionsCode.includes('onChangeEmail'),
  'AccountSections must eliminate dead-end Change button on Email'
);
assert.ok(
  !sectionsCode.includes('onEditLanguage'),
  'AccountSections must eliminate pseudo-toggle Edit button on Language'
);
assert.ok(
  sectionsCode.includes('onEdit') &&
    !sectionsCode.includes('onEditName') &&
    !sectionsCode.includes('onEditPhone') &&
    !sectionsCode.includes('onEditAddress'),
  'AccountSections must consolidate personal info edit actions into single header onEdit button'
);
console.log('✓ Header-level edit consolidation and pseudo-action elimination verified in AccountSections');

// 5. Audit Navigation Rail
const navRailCode = fs.readFileSync(
  path.join(frontendDir, 'src/features/account/components/AccountNavRail.tsx'),
  'utf-8'
);

assert.ok(
  navRailCode.includes("type=\"button\""),
  'AccountNavRail must use semantic HTML <button type="button">'
);
assert.ok(
  navRailCode.includes("href=\"/catalog\""),
  'AccountNavRail must have clean back-to-store link'
);
assert.ok(
  navRailCode.includes('Back to store'),
  'AccountNavRail must use English text Back to store'
);
console.log('✓ Semantic accessibility buttons, store navigation, and English copy verified in AccountNavRail');

// 6. Audit types.ts for Readonly
const typesCode = fs.readFileSync(
  path.join(frontendDir, 'src/features/account/types.ts'),
  'utf-8'
);

assert.ok(
  typesCode.includes('readonly email:') && typesCode.includes('readonly name:'),
  'types.ts must use readonly properties'
);
console.log('✓ Immutability contracts verified in types.ts');

console.log('=== ALL ACCOUNT PORTAL AUDIT CHECKS PASSED SUCCESSFULLY ===');
