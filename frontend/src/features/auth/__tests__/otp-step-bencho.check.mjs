import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const otpStepPath = path.resolve(__dirname, '../OtpStep.tsx');

console.log('[CHECK] Verifying OtpStep Bencho minimalist monochrome theme...');

assert.ok(fs.existsSync(otpStepPath), 'OtpStep.tsx must exist');
const content = fs.readFileSync(otpStepPath, 'utf8');

// 1. Solid white primary action button with rounded-2xl
assert.ok(
  content.includes('bg-white text-black') && content.includes('rounded-2xl'),
  'OtpStep submit button must use solid white bg-white text-black rounded-2xl'
);

// 2. Digit inputs must not use red border/shadow
assert.ok(
  !content.includes('border-[#E81828]') && !content.includes('focus:border-[#E81828]'),
  'OtpStep digit inputs must not use legacy red border/focus styling'
);
assert.ok(
  content.includes('focus:border-white'),
  'OtpStep digit inputs must use crisp focus:border-white'
);

// 3. Security shield icon must be monochrome neutral
assert.ok(
  !content.includes('text-[#E81828]'),
  'OtpStep header icon and text must not use legacy red text-[#E81828]'
);

// 4. Resend code link must use clean text-white hover:underline
assert.ok(
  !content.includes('text-[#E81828]') && content.includes('text-white hover:underline'),
  'OtpStep resend action must use text-white hover:underline without red accents'
);

console.log('✅ [CHECK PASSED] OtpStep Bencho monochrome styling verified!');
