import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../../..');
const pagePath = path.join(frontendDir, 'src/app/verify/[serialNumber]/page.tsx');

console.log('--- RUNNING TASK 1 VERIFY NOT-FOUND TRIGGER TEST ---');

const pageContent = fs.readFileSync(pagePath, 'utf-8');
assert.ok(pageContent.includes("import { notFound } from 'next/navigation'"), 'VerifyPage must import notFound from next/navigation');
assert.ok(pageContent.includes('notFound()'), 'VerifyPage must call notFound() when certificate is invalid');
assert.ok(pageContent.includes('!certificate || !certificate.isAuthentic'), 'VerifyPage must check certificate authenticity before notFound');

console.log('✓ Task 1: VerifyPage notFound trigger test passed');
