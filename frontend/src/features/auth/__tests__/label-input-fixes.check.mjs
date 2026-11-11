import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const labelInputPath = path.resolve(__dirname, '../LabelInput.tsx');
const content = fs.readFileSync(labelInputPath, 'utf8');

console.log('[CHECK] Verifying review fixes in LabelInput.tsx...');

// 1. Verify gapStartX is clamped to never be less than radius
assert.ok(
  content.includes('gapStartX = Math.max(radius,') || content.includes('gapStartX = Math.max(radius ,'),
  'gapStartX must be clamped to at least radius to prevent 180-degree hairpin spur in pathLeft'
);

// 2. Verify flipCount does not trigger animation on mount
assert.ok(
  content.includes('flipCount !== null') || content.includes('useState<number | null>(null)'),
  'data-flip must not trigger blur animation on initial mount'
);

console.log('✅ [CHECK PASSED] Review fixes verified!');
