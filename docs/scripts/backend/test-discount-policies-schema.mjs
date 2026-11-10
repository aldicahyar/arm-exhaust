import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Resolve database URL from environment or backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../../../backend/.env');

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && fs.existsSync(backendEnvPath)) {
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      databaseUrl = trimmed.slice('DATABASE_URL='.length).trim();
      break;
    }
  }
}
if (!databaseUrl) {
  databaseUrl = 'postgresql://postgres:admin@localhost:5432/ARM_EXHAUST';
}

// Load pg package
let pg;
try {
  pg = (await import('pg')).default;
} catch {
  const require = createRequire(import.meta.url);
  try {
    pg = require('../../backend/node_modules/pg');
  } catch {
    pg = require('../../../backend/node_modules/pg');
  }
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  console.log('=== [TDD Test] Decoupled Discount Policies Schema & Seed Verification ===\n');

  // 1. Verify master.t_mtr_discount_policies exists
  console.log('--- [1/4] Verifying master.t_mtr_discount_policies table & columns ---');
  const tableColsRes = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'master' AND table_name = 't_mtr_discount_policies'
    ORDER BY ordinal_position;
  `);

  assert.ok(
    tableColsRes.rows.length > 0,
    'Tabel master.t_mtr_discount_policies TIDAK DITEMUKAN! Harap jalankan migrasi decouple discount policies.'
  );

  const foundCols = tableColsRes.rows.map((r) => r.column_name);
  console.log('Columns found in master.t_mtr_discount_policies:', foundCols);

  const requiredColumns = [
    'code',
    'name',
    'discount_type',
    'discount_value',
    'target_roles',
    'target_categories',
    'min_order_qty',
    'criteria_rules',
    'stacking_mode',
    'is_active',
  ];

  for (const col of requiredColumns) {
    assert.ok(
      foundCols.includes(col),
      `Kolom wajib '${col}' tidak ditemukan di master.t_mtr_discount_policies!`
    );
  }
  console.log('✅ Semua kolom wajib di master.t_mtr_discount_policies valid.\n');

  // 2. Verify GIN index idx_discount_target_roles exists
  console.log('--- [2/4] Verifying GIN index idx_discount_target_roles ---');
  const indexRes = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'master' AND tablename = 't_mtr_discount_policies' AND indexname = 'idx_discount_target_roles';
  `);

  assert.ok(
    indexRes.rows.length > 0,
    'GIN index idx_discount_target_roles TIDAK DITEMUKAN pada master.t_mtr_discount_policies!'
  );
  assert.match(
    indexRes.rows[0].indexdef.toLowerCase(),
    /using\s+gin/i,
    'idx_discount_target_roles harus bertipe GIN index!'
  );
  console.log('✅ Index idx_discount_target_roles (GIN) terverifikasi.\n');

  // 3. Verify seed data
  console.log('--- [3/4] Verifying seed discount policies data ---');
  const seedRes = await client.query(`
    SELECT code, name, discount_type, discount_value, target_roles, is_active
    FROM master.t_mtr_discount_policies
    WHERE code IN ('RESELLER_BASE_20', 'DISTRIBUTOR_TIER_35');
  `);

  const seedMap = new Map(seedRes.rows.map((r) => [r.code, r]));

  // RESELLER_BASE_20
  assert.ok(seedMap.has('RESELLER_BASE_20'), 'Seed RESELLER_BASE_20 tidak ditemukan!');
  const resellerSeed = seedMap.get('RESELLER_BASE_20');
  assert.strictEqual(
    Number(resellerSeed.discount_value),
    20.00,
    'RESELLER_BASE_20 discount_value harus 20.00'
  );
  assert.ok(
    Array.isArray(resellerSeed.target_roles) && resellerSeed.target_roles.includes('reseller'),
    "RESELLER_BASE_20 target_roles harus berupa array yang memuat 'reseller'"
  );
  assert.strictEqual(resellerSeed.is_active, true, 'RESELLER_BASE_20 is_active harus true');

  // DISTRIBUTOR_TIER_35
  assert.ok(seedMap.has('DISTRIBUTOR_TIER_35'), 'Seed DISTRIBUTOR_TIER_35 tidak ditemukan!');
  const distributorSeed = seedMap.get('DISTRIBUTOR_TIER_35');
  assert.strictEqual(
    Number(distributorSeed.discount_value),
    35.00,
    'DISTRIBUTOR_TIER_35 discount_value harus 35.00'
  );
  assert.ok(
    Array.isArray(distributorSeed.target_roles) && distributorSeed.target_roles.includes('distributor'),
    "DISTRIBUTOR_TIER_35 target_roles harus berupa array yang memuat 'distributor'"
  );
  assert.strictEqual(distributorSeed.is_active, true, 'DISTRIBUTOR_TIER_35 is_active harus true');
  console.log('✅ Seed policies RESELLER_BASE_20 dan DISTRIBUTOR_TIER_35 terverifikasi valid.\n');

  // 4. Verify discount_percent column is COMPLETELY REMOVED from master.t_mtr_roles
  console.log('--- [4/4] Verifying discount_percent is removed from master.t_mtr_roles ---');
  const roleDiscountColRes = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'master' AND table_name = 't_mtr_roles' AND column_name = 'discount_percent';
  `);

  assert.strictEqual(
    roleDiscountColRes.rows.length,
    0,
    'Kolom discount_percent MASIH ADA di master.t_mtr_roles! Harap hapus kolom tersebut.'
  );
  console.log('✅ Kolom discount_percent telah berhasil dihapus dari master.t_mtr_roles.\n');

  console.log('🎉 [SUCCESS] All Decoupled Discount Policies schema & seed checks PASSED 100%!');
} finally {
  await client.end();
}
