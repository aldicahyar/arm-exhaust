import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modalDir = path.resolve(__dirname, '../modal');
const layoutPath = path.resolve(__dirname, '../../../app/layout.tsx');

console.log('=== [TDD Test] Global ConfirmDialog & Context Contract ===\n');

// 1. Verify existence of files
assert.ok(fs.existsSync(path.join(modalDir, 'types.ts')), 'modal/types.ts must exist');
assert.ok(fs.existsSync(path.join(modalDir, 'ConfirmContext.tsx')), 'ConfirmContext.tsx must exist');
assert.ok(fs.existsSync(path.join(modalDir, 'ConfirmDialog.tsx')), 'ConfirmDialog.tsx must exist');

// 2. Verify ConfirmContext logic
const contextContent = fs.readFileSync(path.join(modalDir, 'ConfirmContext.tsx'), 'utf8');
assert.ok(contextContent.includes('useConfirm'), 'ConfirmContext must export useConfirm hook');
assert.ok(contextContent.includes('useMemo'), 'ConfirmContext must wrap context value in useMemo');

// 3. Verify ConfirmDialog accessibility & design tokens
const dialogContent = fs.readFileSync(path.join(modalDir, 'ConfirmDialog.tsx'), 'utf8');
assert.ok(dialogContent.includes('role="dialog"') && dialogContent.includes('aria-modal="true"'), 'ConfirmDialog must have dialog ARIA attributes');
assert.ok(dialogContent.includes('Escape') || dialogContent.includes('keydown'), 'ConfirmDialog must handle Escape key');
assert.ok(dialogContent.includes('useReducedMotion'), 'ConfirmDialog must respect motion preferences');

// 4. Verify layout.tsx wraps application in ConfirmProvider
const layoutContent = fs.readFileSync(layoutPath, 'utf8');
assert.ok(layoutContent.includes('ConfirmProvider'), 'layout.tsx must mount ConfirmProvider');

console.log('✅ ConfirmDialog & Context contracts verified.\n');
