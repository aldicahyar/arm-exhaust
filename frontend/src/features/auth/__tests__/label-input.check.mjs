import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const labelInputPath = path.resolve(__dirname, '../LabelInput.tsx');
const indexPath = path.resolve(__dirname, '../index.ts');

console.log('[CHECK] Verifying LabelInput implementation...');

// 1. File existence
assert.ok(fs.existsSync(labelInputPath), 'LabelInput.tsx must exist');

const content = fs.readFileSync(labelInputPath, 'utf8');

// 2. Component signature and contracts
assert.ok(content.includes('export function LabelInput') || content.includes('export const LabelInput'), 'Must export LabelInput component');
assert.ok(content.includes('interface LabelInputProps') || content.includes('type LabelInputProps'), 'Must define LabelInputProps interface');

// 3. SVG dynamic ring & cut-out gap paths
assert.ok(content.includes('lbi-ring'), 'Must render SVG ring with lbi-ring class');
assert.ok(content.includes('lbi-gap'), 'Must render dynamic gap paths with lbi-gap class');
assert.ok(content.includes('lbi-label'), 'Must render label with lbi-label class');
assert.ok(content.includes('lbi-field'), 'Must render transparent input with lbi-field class');

// 4. Staggered letter hop
assert.ok(content.includes('--i'), 'Must bind character index to CSS variable --i for staggered hop animation');

// 5. Password eye toggle
assert.ok(content.includes('lbi-eye') || content.includes('aria-label'), 'Must provide accessible password visibility toggle');

// 6. Export from features/auth/index.ts
const indexContent = fs.readFileSync(indexPath, 'utf8');
assert.ok(indexContent.includes('LabelInput'), 'features/auth/index.ts must export LabelInput');

console.log('✅ [CHECK PASSED] LabelInput satisfies all structural and architectural requirements!');
