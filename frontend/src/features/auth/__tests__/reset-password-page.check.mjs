import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagePath = path.resolve(__dirname, '../../../app/reset-password/page.tsx');
const cardPath = path.resolve(__dirname, '../ResetPasswordCard.tsx');

console.log('--- Checking /reset-password page and ResetPasswordCard existence & contracts ---');

assert.ok(fs.existsSync(pagePath), 'Page file app/reset-password/page.tsx must exist');
assert.ok(fs.existsSync(cardPath), 'Component file ResetPasswordCard.tsx must exist');

const pageContent = fs.readFileSync(pagePath, 'utf8');
assert.ok(pageContent.includes('Suspense'), 'Page must wrap ResetPasswordCard in Suspense for useSearchParams');
assert.ok(pageContent.includes('ResetPasswordCard'), 'Page must import and render ResetPasswordCard');

const cardContent = fs.readFileSync(cardPath, 'utf8');
assert.ok(cardContent.includes('verify-reset-token'), 'ResetPasswordCard must verify token with verify-reset-token');
assert.ok(cardContent.includes('reset-password'), 'ResetPasswordCard must submit to reset-password endpoint');
assert.ok(cardContent.includes('PasswordStrength'), 'ResetPasswordCard must include PasswordStrength component');

console.log('✅ Reset password page & component check passed!');
