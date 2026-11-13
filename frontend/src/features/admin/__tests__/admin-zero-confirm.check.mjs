import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const componentsDir = path.resolve(__dirname, '../components');

console.log('=== [TDD Test] Admin Zero Native Confirm Audit ===\n');

const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.tsx'));

for (const file of files) {
  const content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
  assert.ok(
    !content.includes('window.confirm'),
    `File ${file} must not contain window.confirm`,
  );
  // Ensure native confirm() is not called directly (e.g. `!confirm(` or `if (confirm(`)
  assert.ok(
    !content.match(/[^a-zA-Z0-9_]confirm\s*\(/),
    `File ${file} must not call native confirm()`,
  );
}

// Assert adoption of ACTION_PRESETS
const heroContent = fs.readFileSync(path.join(componentsDir, 'HeroManagementPanel.tsx'), 'utf8');
assert.ok(heroContent.includes('ACTION_PRESETS'), 'HeroManagementPanel must use ACTION_PRESETS');

const eventContent = fs.readFileSync(path.join(componentsDir, 'EventManagementPanel.tsx'), 'utf8');
assert.ok(eventContent.includes('ACTION_PRESETS'), 'EventManagementPanel must use ACTION_PRESETS');

const vipContent = fs.readFileSync(path.join(componentsDir, 'VipInviteGenerator.tsx'), 'utf8');
assert.ok(vipContent.includes('ACTION_PRESETS'), 'VipInviteGenerator must use ACTION_PRESETS');

console.log('✅ All admin components verified with zero native confirm and adopting presets.\n');
