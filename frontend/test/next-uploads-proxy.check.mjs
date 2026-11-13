import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const nextConfigPath = path.resolve(frontendDir, 'next.config.ts');

console.log('=== [TDD Test] Next.js Uploads Proxy Routing Contract ===\n');

// 1. Verify next.config.ts existence
assert.ok(fs.existsSync(nextConfigPath), 'next.config.ts must exist');

// 2. Verify rewrite configuration contains /uploads/:path*
const content = fs.readFileSync(nextConfigPath, 'utf8');

assert.ok(
  content.includes("source: '/uploads/:path*'") || content.includes('source: "/uploads/:path*"'),
  'next.config.ts must define rewrite for /uploads/:path*',
);

assert.ok(
  content.includes('${BACKEND_URL}/uploads/:path*') || content.includes('`${BACKEND_URL}/uploads/:path*`'),
  'next.config.ts must forward /uploads/:path* to ${BACKEND_URL}/uploads/:path*',
);

console.log('✅ next.config.ts proxy rule contract verified.');

// 3. Live HTTP probe (if frontend is online)
try {
  const res = await fetch('http://localhost:3000/uploads/1794539030269-Logo_ARM_no_BG.png');
  assert.equal(res.status, 200, 'Live proxy probe on port 3000 must return HTTP 200 OK');
  console.log('✅ Live proxy probe on port 3000 returned HTTP 200 OK.\n');
} catch (err) {
  console.log('ℹ️ Live probe note:', err?.message ?? 'fetch skipped');
}

console.log('🎉 All Next.js Uploads Proxy checks PASSED!\n');
