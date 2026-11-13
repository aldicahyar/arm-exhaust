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
  'prisma/migrations/20261112_add_campaign_slides_and_community_events/migration.sql'
);

console.log('=== [TDD Test] Backend Content Schema & Migration Verification ===\n');

// 1. Check schema.prisma
console.log('--- [1/3] Verifying backend/prisma/schema.prisma ---');
assert.ok(fs.existsSync(schemaPath), 'schema.prisma file must exist');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Helper to extract a model block from prisma schema
function getModelBlock(schema, modelName) {
  const regex = new RegExp(`model\\s+${modelName}\\s+\\{([^}]+)\\}`, 'm');
  const match = schema.match(regex);
  return match ? match[1] : null;
}

// CampaignSlide checks
const campaignBlock = getModelBlock(schemaContent, 'CampaignSlide');
assert.ok(campaignBlock, "Model 'CampaignSlide' must be defined in schema.prisma");

const campaignRequiredFields = [
  'id',
  'category',
  'tag',
  'title',
  'strip_title',
  'href',
  'image_url',
  'sort_order',
  'is_active',
  'created_at',
  'updated_at',
];

for (const field of campaignRequiredFields) {
  const fieldRegex = new RegExp(`\\b${field}\\b`);
  assert.ok(
    fieldRegex.test(campaignBlock),
    `CampaignSlide must include field '${field}'`
  );
}

assert.ok(
  campaignBlock.includes('@@map("t_mtr_campaign_slides")'),
  'CampaignSlide must map to t_mtr_campaign_slides'
);
assert.ok(
  campaignBlock.includes('@@schema("master")'),
  'CampaignSlide must belong to schema "master"'
);
assert.ok(
  campaignBlock.includes('@@index([is_active, sort_order])'),
  'CampaignSlide must define @@index([is_active, sort_order])'
);

console.log('✅ Model CampaignSlide definition in schema.prisma is valid.');

// CommunityEvent checks
const eventBlock = getModelBlock(schemaContent, 'CommunityEvent');
assert.ok(eventBlock, "Model 'CommunityEvent' must be defined in schema.prisma");

const eventRequiredFields = [
  'id',
  'category',
  'tag',
  'event_date',
  'title',
  'description',
  'image_url',
  'href',
  'sort_order',
  'is_active',
  'created_at',
  'updated_at',
];

for (const field of eventRequiredFields) {
  const fieldRegex = new RegExp(`\\b${field}\\b`);
  assert.ok(
    fieldRegex.test(eventBlock),
    `CommunityEvent must include field '${field}'`
  );
}

assert.ok(
  eventBlock.includes('@@map("t_mtr_community_events")'),
  'CommunityEvent must map to t_mtr_community_events'
);
assert.ok(
  eventBlock.includes('@@schema("master")'),
  'CommunityEvent must belong to schema "master"'
);
assert.ok(
  eventBlock.includes('@@index([is_active, sort_order])'),
  'CommunityEvent must define @@index([is_active, sort_order])'
);

console.log('✅ Model CommunityEvent definition in schema.prisma is valid.\n');

// 2. Check Migration SQL file
console.log('--- [2/3] Verifying migration SQL file ---');
assert.ok(
  fs.existsSync(migrationPath),
  `Migration SQL file must exist at ${migrationPath}`
);

const migrationContent = fs.readFileSync(migrationPath, 'utf8');
assert.ok(
  migrationContent.includes('master.t_mtr_campaign_slides'),
  'Migration SQL must create table master.t_mtr_campaign_slides'
);
assert.ok(
  migrationContent.includes('master.t_mtr_community_events'),
  'Migration SQL must create table master.t_mtr_community_events'
);
assert.ok(
  /CREATE INDEX.*?master\.t_mtr_campaign_slides.*?\(is_active,\s*sort_order\)/is.test(migrationContent),
  'Migration SQL must create index on master.t_mtr_campaign_slides(is_active, sort_order)'
);
assert.ok(
  /CREATE INDEX.*?master\.t_mtr_community_events.*?\(is_active,\s*sort_order\)/is.test(migrationContent),
  'Migration SQL must create index on master.t_mtr_community_events(is_active, sort_order)'
);

console.log('✅ Migration SQL definition is valid.\n');

// 3. Check PostgreSQL database tables (if DB reachable)
console.log('--- [3/3] Verifying PostgreSQL database tables & indexes ---');
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  const backendEnvPath = path.resolve(backendDir, '.env');
  if (fs.existsSync(backendEnvPath)) {
    const envLines = fs.readFileSync(backendEnvPath, 'utf8').split(/\r?\n/);
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL=')) {
        databaseUrl = trimmed.slice('DATABASE_URL='.length).trim();
        break;
      }
    }
  }
}

if (!databaseUrl) {
  databaseUrl = 'postgresql://postgres:admin@localhost:5432/ARM_EXHAUST';
}

let pg;
try {
  pg = (await import('pg')).default;
} catch {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  pg = require('../node_modules/pg');
}

const client = new pg.Client({ connectionString: databaseUrl });
try {
  await client.connect();

  // Verify master.t_mtr_campaign_slides columns
  const csColsRes = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'master' AND table_name = 't_mtr_campaign_slides';
  `);
  assert.ok(
    csColsRes.rows.length > 0,
    'Table master.t_mtr_campaign_slides must exist in PostgreSQL database'
  );
  const csColNames = csColsRes.rows.map((r) => r.column_name);
  for (const col of campaignRequiredFields) {
    assert.ok(
      csColNames.includes(col),
      `Column '${col}' must exist in master.t_mtr_campaign_slides`
    );
  }

  // Verify master.t_mtr_community_events columns
  const ceColsRes = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'master' AND table_name = 't_mtr_community_events';
  `);
  assert.ok(
    ceColsRes.rows.length > 0,
    'Table master.t_mtr_community_events must exist in PostgreSQL database'
  );
  const ceColNames = ceColsRes.rows.map((r) => r.column_name);
  for (const col of eventRequiredFields) {
    assert.ok(
      ceColNames.includes(col),
      `Column '${col}' must exist in master.t_mtr_community_events`
    );
  }

  // Verify indexes
  const indexRes = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'master' AND tablename IN ('t_mtr_campaign_slides', 't_mtr_community_events');
  `);
  const indexDefs = indexRes.rows.map((r) => `${r.tablename}:${r.indexdef}`);
  const hasCsIndex = indexDefs.some(
    (d) => d.includes('t_mtr_campaign_slides') && d.includes('is_active') && d.includes('sort_order')
  );
  const hasCeIndex = indexDefs.some(
    (d) => d.includes('t_mtr_community_events') && d.includes('is_active') && d.includes('sort_order')
  );
  assert.ok(hasCsIndex, 'Index on (is_active, sort_order) must exist for master.t_mtr_campaign_slides');
  assert.ok(hasCeIndex, 'Index on (is_active, sort_order) must exist for master.t_mtr_community_events');

  console.log('✅ PostgreSQL database tables and indexes verified successfully!\n');
} finally {
  await client.end().catch(() => {});
}

console.log('🎉 [SUCCESS] Content schema and migration checks PASSED!');
