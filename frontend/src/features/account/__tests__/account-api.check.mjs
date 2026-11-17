import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../../..');

console.log('--- RUNNING FRONTEND ACCOUNT API AUDIT CHECK ---');

const apiPath = path.join(frontendDir, 'src/features/account/services/account.api.ts');
const typesPath = path.join(frontendDir, 'src/features/account/types.ts');

assert.ok(fs.existsSync(apiPath), 'Missing required file: src/features/account/services/account.api.ts');
console.log('✓ account.api.ts exists');

const typesContent = fs.readFileSync(typesPath, 'utf-8');
assert.ok(
  typesContent.includes('AccountDrawerMode'),
  'types.ts must define AccountDrawerMode'
);
assert.ok(
  typesContent.includes('ChangePasswordPayload'),
  'types.ts must define ChangePasswordPayload'
);
assert.ok(
  typesContent.includes('UpdateProfilePayload'),
  'types.ts must define UpdateProfilePayload'
);
console.log('✓ Account types verified');

const apiContent = fs.readFileSync(apiPath, 'utf-8');
assert.ok(
  apiContent.includes('changeAccountPassword'),
  'account.api.ts must export changeAccountPassword'
);
assert.ok(
  apiContent.includes('updateAccountProfile'),
  'account.api.ts must export updateAccountProfile'
);
assert.ok(
  apiContent.includes('fetchCurrentAccountData'),
  'account.api.ts must export fetchCurrentAccountData'
);
console.log('✓ account.api.ts methods verified');

console.log('--- ALL FRONTEND ACCOUNT API CHECKS PASSED ---');
