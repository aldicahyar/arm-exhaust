import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const heroPanelPath = path.resolve(__dirname, '../components/HeroManagementPanel.tsx');
const content = fs.readFileSync(heroPanelPath, 'utf8');

console.log('=== [TDD Test] Collapsible Storefront Live Preview ===\n');

// 1. Assert Lucide Panel toggle icons imported
assert.ok(
  content.includes('PanelRightClose') && content.includes('PanelRightOpen'),
  'Must import PanelRightClose and PanelRightOpen icons'
);

// 2. Assert isPreviewVisible state and localStorage key
assert.ok(
  content.includes('arm_admin_hero_preview_visible'),
  'Must persist preview visibility to localStorage'
);

// 3. Assert dynamic grid with col-span-12 when hidden
assert.ok(
  content.includes('lg:col-span-12'),
  'Must expand to col-span-12 when preview is hidden'
);

// 4. Assert toggle button label or title
assert.ok(
  content.includes('Pratinjau') || content.includes('pratinjau'),
  'Must include preview toggle button'
);

console.log('✅ Hero preview toggle contract verified.\n');
