import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const heroPanelPath = path.resolve(__dirname, '../components/HeroManagementPanel.tsx');
const content = fs.readFileSync(heroPanelPath, 'utf8');

console.log('=== [TDD Test] Hero Actions Monochrome Expanding Pill ===\n');

// 1. Assert Lucide icons Pencil and Trash2 imported and used
assert.ok(content.includes('Pencil'), 'Must import and use Pencil icon');
assert.ok(content.includes('Trash2'), 'Must import and use Trash2 icon');

// 2. Assert zero text-red or bg-red in delete button
assert.ok(!content.includes('text-red-600'), 'Delete button must not use red text color');
assert.ok(!content.includes('bg-red-50'), 'Delete button must not use red background');

// 3. Assert expanding pill classes
assert.ok(content.includes('group/btn'), 'Action buttons must use group/btn expanding structure');
assert.ok(
  content.includes('max-w-0') && (content.includes('group-hover/btn:max-w-') || content.includes('group-hover/btn:max-w')),
  'Label must smoothly expand on hover/focus'
);

console.log('✅ Hero actions monochrome contract verified.\n');
