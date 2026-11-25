import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../../..');

console.log('--- RUNNING PUBLIC CERTIFICATE VIEW AUDIT CHECK ---');

const viewPath = path.join(
  frontendDir,
  'src/features/verify/components/PublicCertificateView.tsx'
);
const pagePath = path.join(
  frontendDir,
  'src/app/verify/[serialNumber]/page.tsx'
);

assert.ok(fs.existsSync(viewPath), 'PublicCertificateView.tsx must exist');
console.log('✓ PublicCertificateView.tsx exists');

assert.ok(fs.existsSync(pagePath), 'src/app/verify/[serialNumber]/page.tsx must exist');
console.log('✓ Public verification dynamic route page.tsx exists');

const viewContent = fs.readFileSync(viewPath, 'utf-8');

assert.ok(viewContent.includes('Readonly<PublicCertificateViewProps>'), 'Props must be wrapped with Readonly');
assert.ok(!viewContent.includes('UU PDP'), 'Developer compliance disclaimers should not appear in customer UI');
assert.ok(viewContent.includes('VERIFIED AUTHENTIC'), 'Must have authenticity badge');
assert.ok(!viewContent.includes('!important'), 'No !important allowed in styles');

// Challenge view & token unlock tests
assert.ok(viewContent.includes('isProtected'), 'Must handle isProtected challenge view');
assert.ok(viewContent.includes('input') || viewContent.includes('form'), 'Must have token unlock input');

const pageContent = fs.readFileSync(pagePath, 'utf-8');
assert.ok(pageContent.includes('searchParams'), 'Verify dynamic route page.tsx must consume searchParams for token');
assert.ok(pageContent.includes('token'), 'Verify dynamic route must forward token');

console.log('✓ PublicCertificateView semantics, challenge state, and clean luxury UI verified');
console.log('ALL PUBLIC CERTIFICATE VIEW CHECKS PASSED!');
