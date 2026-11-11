import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authCardPath = path.resolve(__dirname, '../AuthCard.tsx');

console.log('[CHECK] Verifying AuthCard smooth transitions and AuthCheckbox integration...');

assert.ok(fs.existsSync(authCardPath), 'AuthCard.tsx must exist');

const content = fs.readFileSync(authCardPath, 'utf8');

// 1. AuthCheckbox integration
assert.ok(
  content.includes("import { AuthCheckbox }") || content.includes("AuthCheckbox"),
  'AuthCard must import AuthCheckbox'
);
assert.ok(
  content.includes('<AuthCheckbox'),
  'AuthCard must render <AuthCheckbox component'
);
assert.ok(
  !content.includes('<input\n                      type="checkbox"') &&
  !content.includes('<input type="checkbox"'),
  'AuthCard must not use raw unstyled HTML checkbox'
);

// 2. Framer Motion integration
assert.ok(
  content.includes('framer-motion'),
  'AuthCard must import from framer-motion'
);
assert.ok(
  content.includes('AnimatePresence'),
  'AuthCard must import and use AnimatePresence'
);
assert.ok(
  content.includes('motion'),
  'AuthCard must import and use motion'
);

// 3. Fluid transitions for mode switching
assert.ok(
  content.includes('<motion.div') || content.includes('<motion.'),
  'AuthCard must wrap conditional sections in motion elements'
);
assert.ok(
  content.includes('initial=') && content.includes('animate=') && content.includes('exit='),
  'AuthCard must define initial, animate, and exit states for seamless morphing'
);
assert.ok(
  content.includes('overflow-hidden'),
  'AuthCard animated wrappers must include overflow-hidden to prevent layout clipping and scrollbars'
);

console.log('✅ [CHECK PASSED] AuthCard transitions and AuthCheckbox verified!');
