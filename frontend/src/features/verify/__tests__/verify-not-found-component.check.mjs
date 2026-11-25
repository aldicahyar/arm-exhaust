import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const notFoundPath = path.resolve(__dirname, '../../../../src/app/verify/not-found.tsx');

console.log('--- RUNNING TASK 2 DEDICATED NOT-FOUND COMPONENT TEST ---');

assert.ok(fs.existsSync(notFoundPath), 'frontend/src/app/verify/not-found.tsx must exist');
const content = fs.readFileSync(notFoundPath, 'utf-8');

assert.ok(content.includes("'use client'"), 'Must be a client component for pathname/interactivity');
assert.ok(content.includes('usePathname'), 'Must consume usePathname to extract rejected serial');
assert.ok(content.includes('404'), 'Must mention 404 status indicator');
assert.ok(content.includes('UNVERIFIED') || content.includes('Unverified'), 'Must have unverified badge/notice');
assert.ok(content.includes('input') || content.includes('form'), 'Must have re-verify input form');
assert.ok(content.includes('/catalog'), 'Must provide link to official catalog');
assert.ok(!content.includes('!important'), 'No !important allowed in styles');

console.log('✓ Task 2: Dedicated verify not-found component test passed');
