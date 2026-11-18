import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../../..');

console.log('--- RUNNING ACCOUNT PRIVACY & PREFERENCES AUDIT CHECK ---');

// 1. Verify types.ts
const typesPath = path.join(frontendDir, 'src/features/account/types.ts');
assert.ok(fs.existsSync(typesPath), 'types.ts must exist');
const typesCode = fs.readFileSync(typesPath, 'utf-8');

assert.ok(typesCode.includes('CommunicationPreferences'), 'types.ts must define CommunicationPreferences');
assert.ok(typesCode.includes('orderUpdates: boolean'), 'CommunicationPreferences must include orderUpdates');
assert.ok(typesCode.includes('promotions: boolean'), 'CommunicationPreferences must include promotions');
assert.ok(typesCode.includes('newReleases: boolean'), 'CommunicationPreferences must include newReleases');
assert.ok(typesCode.includes('channelEmail: boolean'), 'CommunicationPreferences must include channelEmail');
assert.ok(typesCode.includes('channelWhatsapp: boolean'), 'CommunicationPreferences must include channelWhatsapp');
console.log('✓ types.ts CommunicationPreferences contract verified');

// 2. Verify AccountPrivacyTab.tsx
const privacyPath = path.join(frontendDir, 'src/features/account/components/AccountPrivacyTab.tsx');
assert.ok(fs.existsSync(privacyPath), 'AccountPrivacyTab.tsx must exist');
const privacyCode = fs.readFileSync(privacyPath, 'utf-8');

// Check communication categories
assert.ok(privacyCode.includes('Order & delivery updates'), 'Must include Order & delivery updates');
assert.ok(!privacyCode.includes('>Required<') && !privacyCode.includes('>REQUIRED<'), 'Order & delivery updates must eliminate noisy Required badge');
assert.ok(privacyCode.includes('Promotions & exclusive offers'), 'Must include Promotions & exclusive offers');
assert.ok(privacyCode.includes('New exhaust releases & soundchecks'), 'Must include New exhaust releases');
assert.ok(privacyCode.includes('Preferred Notification Channels'), 'Must include Preferred Notification Channels');
assert.ok(privacyCode.includes('Email') && privacyCode.includes('WhatsApp'), 'Must support Email & WhatsApp channel toggles');
console.log('✓ Clean communication categories without noisy badges verified');

// Check auto-save & zero save-button clutter
assert.ok(privacyCode.includes('Preferences saved'), 'Must include subtle "Preferences saved" auto-save feedback');
assert.ok(privacyCode.includes('Saving...'), 'Must include quiet "Saving..." status');
assert.ok(!privacyCode.includes('Save changes') && !privacyCode.includes('Save Preferences'), 'Must eliminate redundant manual save button');
console.log('✓ Auto-save feedback verified, zero redundant manual save buttons');

// Check ergonomic switch geometry, perfect 2px symmetry, gentle 450ms smooth transition & accessibility
assert.ok(privacyCode.includes('rounded-full'), 'Toggle switch must use ergonomic rounded-full pill design');
assert.ok(privacyCode.includes('translate-x-5') && privacyCode.includes('translate-x-0'), 'Toggle thumb must use symmetrical 0/20px translation');
assert.ok(privacyCode.includes('450ms') || privacyCode.includes('duration-500'), 'Toggle switch must use gentle smooth 450ms transition');
assert.ok(privacyCode.includes('motion-reduce:transition-none'), 'Toggle switch must support prefers-reduced-motion');
assert.ok(privacyCode.includes('role="switch"'), 'Toggle must use accessible semantic role="switch"');
assert.ok(privacyCode.includes('aria-checked'), 'Toggle must provide aria-checked state');
console.log('✓ Ergonomic pill switch geometry, gentle 450ms smooth transition, and accessibility verified');

// Check Connected Accounts & Third-Party Access consolidation
assert.ok(privacyCode.includes('Connected Accounts & Third-Party Access'), 'Must consolidate Connected Accounts into Privacy tab');
assert.ok(privacyCode.includes('Google Account'), 'Must include Google Account SSO card');
assert.ok(privacyCode.includes('Active SSO'), 'Must indicate Active SSO status');
console.log('✓ Connected Accounts & Third-Party Access consolidation into Privacy verified');

// Check Legal & Transparency
assert.ok(privacyCode.includes('Data Protection & Legal Transparency'), 'Must include Data Protection section');
assert.ok(privacyCode.includes('/legal/terms'), 'Must link to Terms & Conditions');
assert.ok(privacyCode.includes('/legal/privacy'), 'Must link to Privacy Policy');
console.log('✓ Legal documents and transparency statements verified');

// 3. Verify AccountPortal.tsx integration
const portalPath = path.join(frontendDir, 'src/features/account/components/AccountPortal.tsx');
const portalCode = fs.readFileSync(portalPath, 'utf-8');

assert.ok(portalCode.includes('AccountPrivacyTab'), 'AccountPortal must import and integrate AccountPrivacyTab');
assert.ok(portalCode.includes("activeTab === 'privacy'"), 'AccountPortal must render AccountPrivacyTab on privacy tab');
console.log('✓ AccountPortal integration with AccountPrivacyTab verified');

console.log('=== ALL ACCOUNT PRIVACY & PREFERENCES AUDIT CHECKS PASSED ===');
