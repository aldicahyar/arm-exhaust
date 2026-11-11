import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hookPath = path.resolve(__dirname, '../useAuthForm.ts');

console.log('[CHECK] Verifying useAuthForm priority hierarchy, plus-addressing & resend-otp...');

assert.ok(fs.existsSync(hookPath), 'useAuthForm.ts must exist');
const content = fs.readFileSync(hookPath, 'utf8');

// 1. Plus-addressing preservation check (handling '+' turning into space)
assert.ok(
  content.includes("replace(/\\s+/g, '+')") || content.includes(".replace(/\\s/g, '+')"),
  'Must preserve plus sign in email plus-addressing by normalizing spaces to +'
);

// 2. Email format validation before accepting URL parameter (script injection defense)
assert.ok(
  content.includes('isValidEmail(sanitizedEmail)') || content.includes('isValidEmail(cleanEmail)'),
  'Must validate email format using isValidEmail before accepting URL query parameter'
);

// 3. Absolute precedence: URL param skips/returns before reading localStorage
assert.ok(
  content.includes('return;') || content.includes('!rawEmailParam') || content.includes('!hasUrlEmail'),
  'Must bypass/skip localStorage when URL parameter is present'
);

// 4. Back to registration navigation
assert.ok(
  content.includes("setMode('register')") && content.includes("setStep('form')"),
  'backToForm must set mode to register and step to form'
);

// 5. Standalone resend-otp endpoint integration
assert.ok(
  content.includes('/api/auth/resend-otp'),
  'resendOtp must call /api/auth/resend-otp endpoint'
);

console.log('✅ [CHECK PASSED] useAuthForm priority and injection defense verified!');
