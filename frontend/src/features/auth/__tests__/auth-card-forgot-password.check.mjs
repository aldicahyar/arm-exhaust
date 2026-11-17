import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authCardPath = path.resolve(__dirname, '../AuthCard.tsx');

console.log('--- Checking AuthCard for Forgot Password integration ---');

const content = fs.readFileSync(authCardPath, 'utf8');

assert.ok(content.includes('Forgot password?'), 'AuthCard must contain "Forgot password?" button');
assert.ok(content.includes('isForgot'), 'AuthCard must handle isForgot state');

console.log('✅ AuthCard Forgot Password check passed!');
