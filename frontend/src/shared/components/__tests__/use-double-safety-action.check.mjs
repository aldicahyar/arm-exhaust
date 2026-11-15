import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hookPath = path.resolve(__dirname, '../modal/useDoubleSafetyAction.ts');

console.log('=== [TDD Test] useDoubleSafetyAction Engine Contract ===\n');

assert.ok(fs.existsSync(hookPath), 'useDoubleSafetyAction.ts must exist');

const content = fs.readFileSync(hookPath, 'utf8');

assert.ok(content.includes('useDoubleSafetyAction'), 'Must export useDoubleSafetyAction hook');
assert.ok(content.includes('useConfirm'), 'Must consume useConfirm');
assert.ok(content.includes('useNotice'), 'Must consume useNotice');
assert.ok(content.includes('actionButton'), 'Must wire actionButton for undo notice');
assert.ok(content.includes('confirm_and_undo') && content.includes('direct_undo'), 'Must handle both undo modes');
assert.ok(content.includes('clearTimeout'), 'Must clean up pending timers');

console.log('✅ useDoubleSafetyAction hook contract verified.\n');
