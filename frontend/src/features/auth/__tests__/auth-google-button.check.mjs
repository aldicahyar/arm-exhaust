import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buttonPath = path.resolve(__dirname, '../AuthGoogleButton.tsx');

console.log('[CHECK] Verifying AuthGoogleButton styling harmony...');

const content = fs.readFileSync(buttonPath, 'utf8');

// 1. Must use rounded-2xl for wrapper and button to match Bencho input/submit radius
assert.ok(content.includes('rounded-2xl'), 'AuthGoogleButton must use rounded-2xl geometry');
assert.ok(!content.includes('rounded-lg'), 'AuthGoogleButton should not use outdated rounded-lg');

// 2. Must use sleek dark border and padding
assert.ok(content.includes('border-[#2B2B30]') || content.includes('border-[#3A3A40]'), 'Must use subtle dark border');

console.log('✅ [CHECK PASSED] AuthGoogleButton styling verified!');
