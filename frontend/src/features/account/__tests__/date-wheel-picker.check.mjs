import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../../..');

console.log('--- RUNNING DATE WHEEL PICKER AUDIT CHECK ---');

const componentPath = path.join(
  frontendDir,
  'src/features/account/components/DateWheelPicker.tsx'
);

assert.ok(fs.existsSync(componentPath), 'Missing required file: DateWheelPicker.tsx');
console.log('✓ DateWheelPicker.tsx exists');

const code = fs.readFileSync(componentPath, 'utf-8');

// 1. Strict geometry and zero AI slop
assert.ok(
  !code.includes('rounded-md') &&
    !code.includes('rounded-lg') &&
    !code.includes('rounded-xl') &&
    !code.includes('rounded-2xl'),
  'DateWheelPicker must enforce strict 0px geometry (rounded-none / sharp corners)'
);
assert.ok(
  !code.includes('#4ade80') && !code.includes('#22c55e') && !code.includes('text-green'),
  'DateWheelPicker must not include green AI-slop color accents'
);
assert.ok(
  !code.includes('🔒'),
  'DateWheelPicker must not contain emojis or informal symbols'
);
console.log('✓ Strict 0px geometry, stealth palette, and zero emojis verified');

// 2. Framer Motion 3D Physics
assert.ok(
  code.includes('framer-motion') &&
    code.includes('useMotionValue') &&
    code.includes('useTransform') &&
    code.includes('rotateX'),
  'DateWheelPicker must implement 3D cylindrical rotation with framer-motion'
);
console.log('✓ 3D perspective rotation and motion physics verified');

// 3. Day, Month, Year Wheel Columns
assert.ok(
  code.includes('WheelColumn') &&
    code.includes('days') &&
    code.includes('months') &&
    code.includes('years'),
  'DateWheelPicker must manage days, months, and years columns'
);
console.log('✓ Day, Month, and Year wheel structures verified');

// 4. Accessibility and Semantic Roles
assert.ok(
  code.includes('role="spinbutton"') || code.includes('role="group"'),
  'DateWheelPicker must include accessible ARIA roles'
);
assert.ok(
  code.includes('aria-label='),
  'DateWheelPicker must provide accessible labels'
);
console.log('✓ Accessibility roles and labels verified');

// 5. TypeScript Contracts
assert.ok(
  code.includes('readonly value?:') && code.includes('Readonly<DateWheelPickerProps>'),
  'DateWheelPicker must use strict Readonly props as per AGENTS.md'
);
console.log('✓ Strict TypeScript Readonly contracts verified');

// 6. DateWheelPickerModal Overlay Audit
const modalPath = path.join(
  frontendDir,
  'src/features/account/components/DateWheelPickerModal.tsx'
);
assert.ok(fs.existsSync(modalPath), 'Missing required file: DateWheelPickerModal.tsx');
const modalCode = fs.readFileSync(modalPath, 'utf-8');
assert.ok(
  modalCode.includes('role="dialog"') && modalCode.includes('aria-modal="true"'),
  'DateWheelPickerModal must include accessible dialog attributes'
);
assert.ok(
  modalCode.includes('Set Date') && modalCode.includes('Cancel'),
  'DateWheelPickerModal must provide explicit Cancel and Set Date buttons'
);
assert.ok(
  modalCode.includes('rounded-none') && !modalCode.includes('rounded-md'),
  'DateWheelPickerModal must enforce 0px geometry'
);
console.log('✓ Dedicated DateWheelPickerModal overlay verified');

console.log('=== ALL DATE WHEEL PICKER CHECKS PASSED SUCCESSFULLY ===');
