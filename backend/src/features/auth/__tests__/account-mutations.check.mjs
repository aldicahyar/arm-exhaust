import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../../..');

console.log('--- RUNNING BACKEND ACCOUNT MUTATIONS AUDIT CHECK ---');

const authServicePath = path.join(backendDir, 'src/features/auth/auth.service.ts');
const authControllerPath = path.join(backendDir, 'src/features/auth/auth.controller.ts');

const serviceCode = fs.readFileSync(authServicePath, 'utf-8');
const controllerCode = fs.readFileSync(authControllerPath, 'utf-8');

assert.ok(
  serviceCode.includes('changePassword('),
  'AuthService must implement changePassword'
);
assert.ok(
  serviceCode.includes('DELETE FROM transaction.t_trx_sessions WHERE user_id = $1'),
  'changePassword must revoke all user sessions across all devices for security'
);
assert.ok(
  serviceCode.includes('clearSessionCookie(res)'),
  'changePassword must clear the session cookie for the current response'
);
assert.ok(
  serviceCode.includes('updateProfile('),
  'AuthService must implement updateProfile'
);
console.log('✓ AuthService methods and session revocation verified');

assert.ok(
  controllerCode.includes("@Post('change-password')"),
  'AuthController must declare POST change-password endpoint'
);
assert.ok(
  controllerCode.includes("@Patch('profile')"),
  'AuthController must declare PATCH profile endpoint'
);
assert.ok(
  controllerCode.includes('SessionAuthGuard'),
  'AuthController mutations must be guarded with SessionAuthGuard'
);
console.log('✓ AuthController endpoints and session guards verified');

console.log('--- ALL BACKEND ACCOUNT MUTATION CHECKS PASSED ---');
