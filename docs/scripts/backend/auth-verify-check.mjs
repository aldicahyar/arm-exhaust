import assert from 'node:assert/strict';
import { verifyPassword, hashPassword } from '../../prototypes/backend-mjs/auth.mjs';

// Test edge cases: null, undefined, empty string
assert.equal(await verifyPassword('any', null), false);
assert.equal(await verifyPassword('any', undefined), false);
assert.equal(await verifyPassword('any', ''), false);

// Test normal valid password
const hashed = await hashPassword('secret123');
assert.equal(await verifyPassword('secret123', hashed), true);
assert.equal(await verifyPassword('wrongpassword', hashed), false);

console.log('auth-verify-check passed');
