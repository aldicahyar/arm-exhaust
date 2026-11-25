import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const schemaPath = path.resolve(backendDir, 'prisma/schema.prisma');
const migrationPath = path.resolve(
  backendDir,
  '../docs/migrations/20261125_add_campaign_slide_mobile_image/migration.sql',
);
const dtoPath = path.resolve(backendDir, 'src/features/admin/dto/campaign-slide.dto.ts');
const servicePath = path.resolve(backendDir, 'src/features/admin/content-management.service.ts');

console.log('=== [TDD Test] Campaign Slide Mobile Image (image_mobile_url) ===\n');

function readFile(filePath, label) {
  assert.ok(fs.existsSync(filePath), `${label} must exist at ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function extractBlock(source, startRegex) {
  const match = startRegex.exec(source);
  if (!match) return null;
  const openIdx = source.indexOf('{', match.index);
  let depth = 0;
  for (let i = openIdx; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(openIdx + 1, i);
  }
  return null;
}

// 1. Prisma schema
console.log('--- [1/4] schema.prisma: model CampaignSlide ---');
const schema = readFile(schemaPath, 'schema.prisma');
const campaignBlock = extractBlock(schema, /model\s+CampaignSlide\s+\{/m);
assert.ok(campaignBlock, "Model 'CampaignSlide' must be defined");
assert.match(
  campaignBlock,
  /image_mobile_url\s+String\?\s+@map\("image_mobile_url"\)\s+@db\.VarChar\(255\)/,
  'CampaignSlide must declare image_mobile_url String? @map("image_mobile_url") @db.VarChar(255)',
);
console.log('✅ schema OK');

// 2. Migration
console.log('--- [2/4] migration.sql ---');
const migration = readFile(migrationPath, 'migration.sql');
assert.ok(
  migration.includes('ALTER TABLE master.t_mtr_campaign_slides'),
  'Migration must ALTER TABLE master.t_mtr_campaign_slides',
);
assert.ok(
  migration.includes('ADD COLUMN IF NOT EXISTS image_mobile_url VARCHAR(255)'),
  'Migration must ADD COLUMN IF NOT EXISTS image_mobile_url VARCHAR(255)',
);
console.log('✅ migration OK');

// 3. DTOs
console.log('--- [3/4] campaign-slide.dto.ts ---');
const dto = readFile(dtoPath, 'campaign-slide.dto.ts');
for (const className of ['CreateCampaignSlideDto', 'UpdateCampaignSlideDto']) {
  const block = extractBlock(dto, new RegExp(`export\\s+class\\s+${className}\\s*\\{`, 'm'));
  assert.ok(block, `${className} must be defined`);
  const propMatch = /((?:\s*@[\w]+\([^)]*\)\s*)+)\s*image_mobile_url\?:\s*string\s*\|\s*null;/m.exec(block);
  assert.ok(propMatch, `${className} must declare image_mobile_url?: string | null`);
  const decorators = propMatch[1];
  assert.ok(decorators.includes('@IsOptional()'), `${className}.image_mobile_url must be @IsOptional()`);
  assert.ok(decorators.includes('@MaxLength(255'), `${className}.image_mobile_url must use @MaxLength(255`);
}
console.log('✅ DTOs OK');

// 4. Service normalizers
console.log('--- [4/4] content-management.service.ts normalizers ---');
const service = readFile(servicePath, 'content-management.service.ts');
for (const fnName of ['normalizeSlidePayload', 'normalizeSlideUpdatePayload']) {
  const body = extractBlock(service, new RegExp(`private\\s+${fnName}\\s*\\(`, 'm'));
  assert.ok(body, `${fnName} must be defined`);
  assert.ok(body.includes('image_mobile_url'), `${fnName} must map image_mobile_url`);
}
console.log('✅ service OK');

console.log('\n🎉 All campaign slide mobile image checks passed!');
