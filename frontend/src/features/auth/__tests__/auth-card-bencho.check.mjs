import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authCardPath = path.resolve(__dirname, '../AuthCard.tsx');

console.log('[CHECK] Verifying AuthCard Bencho minimalist integration...');

const content = fs.readFileSync(authCardPath, 'utf8');

// 1. Must use LabelInput
assert.ok(content.includes('LabelInput'), 'AuthCard must import and render LabelInput');
assert.ok(content.includes('<LabelInput'), 'AuthCard must use <LabelInput components for form fields');

// 2. Must feature Remember me checkbox in login mode
assert.ok(content.includes('rememberMe'), 'AuthCard must bind rememberMe state');
assert.ok(content.includes('Remember me') || content.includes('Remember Me'), 'AuthCard must render Remember me label');

// 3. Must use solid white primary action button
assert.ok(content.includes('bg-white text-black') || content.includes('bg-white'), 'Submit button must have white background');
assert.ok(content.includes('rounded-2xl'), 'Submit button must use rounded-2xl geometry');

// 4. Must use clean minimalist switch toggle
assert.ok(content.includes('text-white') && content.includes('hover:underline'), 'Switch mode link must use minimalist text-white hover:underline');

console.log('✅ [CHECK PASSED] AuthCard Bencho minimalist integration verified!');
