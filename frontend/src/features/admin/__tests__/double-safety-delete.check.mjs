import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminComponentsDir = path.resolve(__dirname, '../components');

console.log('=== [TDD Test] Double-Safety Deletion in Admin Panels ===\n');

const heroPanelPath = path.join(adminComponentsDir, 'HeroManagementPanel.tsx');
const eventPanelPath = path.join(adminComponentsDir, 'EventManagementPanel.tsx');

const heroContent = fs.readFileSync(heroPanelPath, 'utf8');
const eventContent = fs.readFileSync(eventPanelPath, 'utf8');

// 1. Assert zero usage of window.confirm
assert.ok(!heroContent.includes('window.confirm'), 'HeroManagementPanel must not use window.confirm');
assert.ok(!eventContent.includes('window.confirm'), 'EventManagementPanel must not use window.confirm');

// 2. Assert consumption of useDoubleSafetyAction and ACTION_PRESETS
assert.ok(
  heroContent.includes('useDoubleSafetyAction') && heroContent.includes('ACTION_PRESETS'),
  'HeroManagementPanel must use useDoubleSafetyAction and ACTION_PRESETS'
);
assert.ok(
  eventContent.includes('useDoubleSafetyAction') && eventContent.includes('ACTION_PRESETS'),
  'EventManagementPanel must use useDoubleSafetyAction and ACTION_PRESETS'
);

console.log('✅ Double-safety deletion contract verified.\n');
