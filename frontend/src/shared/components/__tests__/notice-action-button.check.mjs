import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const noticeDir = path.resolve(__dirname, '../notice');

console.log('=== [TDD Test] DynamicIslandNotice Action Button Contract ===\n');

// 1. Verify types.ts
const typesPath = path.join(noticeDir, 'types.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

assert.ok(
  typesContent.includes('NoticeActionButton'),
  'types.ts must define NoticeActionButton interface',
);
assert.ok(
  typesContent.includes('actionButton?: NoticeActionButton'),
  'NoticeOptions and NoticeItem must support optional actionButton',
);

// 2. Verify DynamicIslandNotice.tsx renders actionButton
const dynamicNoticePath = path.join(noticeDir, 'DynamicIslandNotice.tsx');
const dynamicContent = fs.readFileSync(dynamicNoticePath, 'utf8');

assert.ok(
  dynamicContent.includes('notice.actionButton') && dynamicContent.includes('onClick'),
  'DynamicIslandNotice must render and wire notice.actionButton',
);
assert.ok(
  dynamicContent.includes('stopPropagation'),
  'DynamicIslandNotice actionButton must call stopPropagation to prevent drag interference',
);

console.log('✅ Notice Action Button contract verified.\n');
