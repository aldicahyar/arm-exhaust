import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modalPath = path.resolve(__dirname, '../components/AccountCertificateModal.tsx');
const portalPath = path.resolve(__dirname, '../components/AccountPortal.tsx');

console.log('--- RUNNING TASK 6 ACCOUNT CERTIFICATE MODAL CHECK ---');

const modalContent = fs.readFileSync(modalPath, 'utf-8');
assert.ok(modalContent.includes('verificationToken?: string'), 'Modal props must accept verificationToken');
assert.ok(modalContent.includes('token='), 'publicUrl in modal must construct token query parameter');

const portalContent = fs.readFileSync(portalPath, 'utf-8');
assert.ok(portalContent.includes('verificationToken'), 'AccountPortal must pass verificationToken to modal');

console.log('✓ Task 6: Account certificate modal token binding test passed');
