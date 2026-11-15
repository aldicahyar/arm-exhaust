import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const eventPanelPath = path.resolve(__dirname, '../components/EventManagementPanel.tsx');
const content = fs.readFileSync(eventPanelPath, 'utf8');

console.log('=== [TDD Test] Event Actions Monochrome Expanding Pill ===\n');

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

// 4. Assert 800ms gentle luxury timing and motion-reduce
assert.ok(content.includes('duration-[800ms]'), 'Action buttons must use 800ms luxury duration');
assert.ok(content.includes('motion-reduce:transition-none'), 'Action buttons must support motion-reduce');

console.log('✅ Event actions monochrome contract verified.\n');
