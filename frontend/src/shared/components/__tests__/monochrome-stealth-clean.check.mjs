import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../../');

function resolvePath(relPath) {
  const fromCwd = path.resolve(process.cwd(), relPath);
  if (fs.existsSync(fromCwd)) return fromCwd;
  return path.resolve(repoRoot, relPath);
}

const filesToCheck = [
  {
    path: 'frontend/src/app/page.tsx',
    expectedClass: 'selection:bg-zinc-800',
  },
  {
    path: 'frontend/src/features/catalog/ProductCard.tsx',
    expectedClass: 'focus-visible:ring-zinc-400',
  },
  {
    path: 'frontend/src/shared/components/SiteFooter.tsx',
    expectedClass: 'focus-visible:ring-zinc-400',
  },
];

for (const target of filesToCheck) {
  const absPath = resolvePath(target.path);
  assert(fs.existsSync(absPath), `File not found: ${target.path}`);
  const content = fs.readFileSync(absPath, 'utf-8');

  // Must not contain leftover #2E6BFF blue color
  assert(
    !content.includes('#2E6BFF') && !content.includes('#2e6bff'),
    `File ${target.path} still contains residual blue accent #2E6BFF! It must be purged for pure monochrome stealth.`
  );

  // Must contain expected monochrome classes
  assert(
    content.includes(target.expectedClass),
    `File ${target.path} must contain ${target.expectedClass}`
  );
}

console.log('PASS: All target customer-facing files are free of #2E6BFF and adhere to monochrome stealth design.');
