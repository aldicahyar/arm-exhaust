import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const checkboxPath = path.resolve(__dirname, '../AuthCheckbox.tsx');
const indexPath = path.resolve(__dirname, '../index.ts');

console.log('[CHECK] Verifying AuthCheckbox component implementation...');

// 1. File existence
assert.ok(fs.existsSync(checkboxPath), 'AuthCheckbox.tsx must exist');

const content = fs.readFileSync(checkboxPath, 'utf8');

// 2. Export check
assert.ok(content.includes('export function AuthCheckbox'), 'Must export AuthCheckbox function');
assert.ok(content.includes('AuthCheckboxProps'), 'Must declare AuthCheckboxProps interface');

// 3. Accessibility & structure check
assert.ok(content.includes('type="checkbox"'), 'Must contain input type="checkbox"');
assert.ok(content.includes('sr-only'), 'Input must be visually hidden via sr-only for accessibility');

// 4. Bencho tactile styling check
assert.ok(content.includes('rounded-[5px]'), 'Custom box must use rounded-[5px]');
assert.ok(content.includes('bg-white') && content.includes('border-white'), 'Checked state must use solid white styling');
assert.ok(content.includes('stroke-black') || content.includes('text-black'), 'Checkmark must be black on white background');

// 5. Exported from index.ts
const indexContent = fs.readFileSync(indexPath, 'utf8');
assert.ok(indexContent.includes('AuthCheckbox'), 'features/auth/index.ts must export AuthCheckbox');

console.log('✅ [CHECK PASSED] AuthCheckbox component verified!');
