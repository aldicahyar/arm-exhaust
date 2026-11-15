import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const heroPanelPath = path.resolve(__dirname, '../components/HeroManagementPanel.tsx');
const content = fs.readFileSync(heroPanelPath, 'utf8');

console.log('=== [TDD Test] Multi-Select Bulk Delete with Floating Action Bar ===\n');

// 1. Assert selection state and handlers
assert.ok(content.includes('selectedSlideIds'), 'Must track selected slide IDs in state');
assert.ok(content.includes('handleSelectAll'), 'Must have select all handler');
assert.ok(content.includes('handleSelectSlide'), 'Must have select slide handler');

// 2. Assert floating action bar with monochrome dock styling
assert.ok(
  content.includes('fixed bottom-') && content.includes('bg-[#141416]'),
  'Must render bottom floating action bar with #141416 background'
);

// 3. Assert safety check / guard for active slides
assert.ok(
  content.includes('activeSlides') || content.includes('is_active'),
  'Must guard active slides status'
);

// 4. Assert batch delete execution
assert.ok(
  content.includes('handleBulkDelete') || content.includes('handleExecuteBulkDelete'),
  'Must have bulk delete execution handler'
);

console.log('✅ Hero bulk delete contract verified.\n');
