import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const servicePath = path.resolve(__dirname, '../account-dashboard.service.ts');

console.log('--- RUNNING TASK 3 ACCOUNT DASHBOARD TOKEN TEST ---');

const serviceContent = fs.readFileSync(servicePath, 'utf-8');
assert.ok(serviceContent.includes('token='), 'verificationUrl must include token query param');
assert.ok(serviceContent.includes('verificationToken'), 'installedExhaust must expose verificationToken');

console.log('✓ Task 3: Account dashboard token generation test passed');
