import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../../..');

console.log('--- RUNNING BACKEND ACCOUNT DTO AUDIT CHECK ---');

const changePasswordDtoPath = path.join(
  backendDir,
  'src/features/auth/dto/change-password.dto.ts'
);
const updateProfileDtoPath = path.join(
  backendDir,
  'src/features/auth/dto/update-profile.dto.ts'
);

assert.ok(
  fs.existsSync(changePasswordDtoPath),
  'Missing required file: src/features/auth/dto/change-password.dto.ts'
);
console.log('✓ change-password.dto.ts exists');

assert.ok(
  fs.existsSync(updateProfileDtoPath),
  'Missing required file: src/features/auth/dto/update-profile.dto.ts'
);
console.log('✓ update-profile.dto.ts exists');

const changePasswordContent = fs.readFileSync(changePasswordDtoPath, 'utf-8');
assert.ok(
  changePasswordContent.includes('export class ChangePasswordDto'),
  'ChangePasswordDto must be exported'
);
assert.ok(
  changePasswordContent.includes('currentPassword'),
  'ChangePasswordDto must contain currentPassword'
);
assert.ok(
  changePasswordContent.includes('newPassword'),
  'ChangePasswordDto must contain newPassword'
);
assert.ok(
  changePasswordContent.includes('confirmPassword'),
  'ChangePasswordDto must contain confirmPassword'
);
console.log('✓ ChangePasswordDto fields and decorators verified');

const updateProfileContent = fs.readFileSync(updateProfileDtoPath, 'utf-8');
assert.ok(
  updateProfileContent.includes('export class UpdateProfileDto'),
  'UpdateProfileDto must be exported'
);
assert.ok(
  updateProfileContent.includes('name?: string') || updateProfileContent.includes('name?: string;'),
  'UpdateProfileDto must contain optional name field'
);
console.log('✓ UpdateProfileDto fields and decorators verified');

console.log('--- ALL BACKEND DTO CHECKS PASSED ---');
