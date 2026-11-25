import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiPath = path.resolve(__dirname, '../../account/services/account.api.ts');
const typesPath = path.resolve(__dirname, '../../account/types.ts');

console.log('--- RUNNING TASK 4 FRONTEND TYPES & API CHECK ---');

const typesContent = fs.readFileSync(typesPath, 'utf-8');
assert.ok(typesContent.includes('isProtected?: boolean'), 'PublicCertificateData must include isProtected');
assert.ok(typesContent.includes('requiresToken?: boolean'), 'PublicCertificateData must include requiresToken');

const apiContent = fs.readFileSync(apiPath, 'utf-8');
assert.ok(
  apiContent.includes('fetchPublicCertificate(serialNumber: string, token?: string)') ||
  apiContent.includes('fetchPublicCertificate(\n  serialNumber: string,\n  token?: string') ||
  apiContent.includes('fetchPublicCertificate(serialNumber: string, token?: string | null)'),
  'fetchPublicCertificate must accept token parameter'
);
assert.ok(apiContent.includes('v_k9m2xLq1p8yT3w'), 'Fallback demo token must be handled in account.api.ts');
assert.ok(
  apiContent.includes('process.env.BACKEND_URL') || apiContent.includes('typeof window === \'undefined\''),
  'Must handle absolute baseUrl for SSR in fetchPublicCertificate'
);
assert.ok(
  apiContent.includes('return canonical === \'ARM-ZX25R-2026-0882\' ? fallback : null') ||
  apiContent.includes('if (canonical !== \'ARM-ZX25R-2026-0882\') {\n      return null;') ||
  apiContent.includes('if (canonical !== \'ARM-ZX25R-2026-0882\') return null;'),
  'Catch block must not return fallback for unknown serial numbers'
);

console.log('✓ Task 4: Frontend types and API token support test passed');
