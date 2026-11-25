import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');

console.log('--- RUNNING TASK 1 SCHEMA CHECK ---');

const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// 1. Verify model ExhaustCertificate exists
const certModelStart = schemaContent.indexOf('model ExhaustCertificate {');
assert.ok(certModelStart !== -1, 'Model ExhaustCertificate must exist in schema.prisma');

const certModelEnd = schemaContent.indexOf('}', certModelStart);
const certModelBody = schemaContent.slice(certModelStart, certModelEnd);

// 2. Verify verification_token exists in model
assert.ok(certModelBody.includes('verification_token'), 'verification_token field must exist in ExhaustCertificate');
assert.ok(certModelBody.includes('@map("verification_token")'), 'verification_token must map to column verification_token');
assert.ok(certModelBody.includes('@@index([serial_number, verification_token])'), 'Index on [serial_number, verification_token] must exist');

console.log('✓ Task 1: Prisma schema verification_token validation test passed');
