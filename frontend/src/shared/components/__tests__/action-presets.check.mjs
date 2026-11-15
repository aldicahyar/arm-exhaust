import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modalDir = path.resolve(__dirname, '../modal');
const presetsPath = path.join(modalDir, 'action-presets.ts');

console.log('=== [TDD Test] Action Presets Catalog Contract ===\n');

assert.ok(fs.existsSync(presetsPath), 'action-presets.ts must exist');

const content = fs.readFileSync(presetsPath, 'utf8');

// Assert key presets
const requiredPresets = [
  'HERO_SLIDE_DELETE',
  'COMMUNITY_EVENT_DELETE',
  'VIP_INVITE_REVOKE',
  'SECURITY_CONFIG_RESET',
  'HERO_SLIDE_TOGGLE',
  'COMMUNITY_EVENT_TOGGLE',
  'USER_ROLE_CHANGE',
  'ADMIN_LOGOUT',
];

for (const preset of requiredPresets) {
  assert.ok(content.includes(preset), `action-presets.ts must define ${preset}`);
}

assert.ok(content.includes("'confirm_and_undo'"), 'Must support confirm_and_undo mode');
assert.ok(content.includes("'direct_undo'"), 'Must support direct_undo mode');
assert.ok(content.includes("'confirm_only'"), 'Must support confirm_only mode');

console.log('✅ Action Presets catalog contract verified.\n');
