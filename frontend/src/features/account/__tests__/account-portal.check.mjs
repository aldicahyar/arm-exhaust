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

// 2. Audit AppChrome.tsx for Header Hiding on /account
const appChromeCode = fs.readFileSync(
  path.join(frontendDir, 'src/shared/components/AppChrome.tsx'),
  'utf-8'
);

assert.ok(
  appChromeCode.includes("pathname?.startsWith('/account')"),
  'AppChrome must exclude global header on /account route for clean aesthetic'
);
console.log('✓ Global header properly hidden on /account via AppChrome');

// 3. Audit AccountSections.tsx
const sectionsCode = fs.readFileSync(
  path.join(frontendDir, 'src/features/account/components/AccountSections.tsx'),
  'utf-8'
);

assert.ok(
  sectionsCode.includes('Sign-in and security') &&
  sectionsCode.includes('Personal information') &&
  sectionsCode.includes('Location') &&
  sectionsCode.includes('Advanced'),
  'AccountSections must include all 4 official Polestar sections'
);
console.log('✓ 4 Official Polestar sections present in AccountSections');

assert.ok(
  !sectionsCode.includes('!important'),
  'AccountSections must not use CSS !important'
);
console.log('✓ CSS specificity clean (no !important)');

// 4. Audit Navigation Rail
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

// 5. Audit types.ts for Readonly
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
