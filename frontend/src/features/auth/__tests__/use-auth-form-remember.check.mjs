import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const typesPath = path.resolve(__dirname, '../types.ts');
const hookPath = path.resolve(__dirname, '../useAuthForm.ts');

console.log('[CHECK] Verifying Remember Me state support in types.ts and useAuthForm.ts...');

const typesContent = fs.readFileSync(typesPath, 'utf8');
const hookContent = fs.readFileSync(hookPath, 'utf8');

// 1. Types contract
assert.ok(typesContent.includes('rememberMe?: boolean'), 'AuthFormState or types.ts must define rememberMe?: boolean');

// 2. Hook returns rememberMe and setRememberMe
assert.ok(hookContent.includes('rememberMe,'), 'useAuthForm must return rememberMe');
assert.ok(hookContent.includes('setRememberMe,'), 'useAuthForm must return setRememberMe');

// 3. LocalStorage persistence check
assert.ok(hookContent.includes('arm_remember_email'), 'useAuthForm must reference arm_remember_email for persistence');

console.log('✅ [CHECK PASSED] Remember Me contracts and hook integration verified!');
