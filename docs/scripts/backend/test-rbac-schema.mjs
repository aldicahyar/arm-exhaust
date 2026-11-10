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
  console.log('--- [1/4] Verifying master.t_mtr_roles schema ---');
  const rolesColsRes = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'master' AND table_name = 't_mtr_roles'
    ORDER BY ordinal_position;
  `);

  assert.ok(
    rolesColsRes.rows.length > 0,
    'Tabel master.t_mtr_roles tidak ditemukan! Harap jalankan migrasi terlebih dahulu.'
  );

  const roleColumns = rolesColsRes.rows.map((r) => r.column_name);
  console.log('Columns found in master.t_mtr_roles:', roleColumns);

  const requiredRoleCols = [
    'id',
    'name',
    'description',
    'can_access_admin',
    'can_access_b2b',
    'badge_style',
    'created_at',
    'updated_at',
  ];

  for (const col of requiredRoleCols) {
    assert.ok(
      roleColumns.includes(col),
      `Kolom '${col}' wajib ada pada tabel master.t_mtr_roles!`
    );
  }
  console.log('[PASS] master.t_mtr_roles schema structure verified.');

  console.log('\n--- [2/4] Verifying seed data in master.t_mtr_roles ---');
  const rolesDataRes = await client.query(`
    SELECT id, name, can_access_admin, can_access_b2b, badge_style
    FROM master.t_mtr_roles
    ORDER BY id;
  `);

  const seededIds = rolesDataRes.rows.map((r) => r.id);
  console.log('Seeded roles in master.t_mtr_roles:', seededIds);

  const requiredRoles = ['customer', 'reseller', 'admin'];
  for (const roleId of requiredRoles) {
    assert.ok(
      seededIds.includes(roleId),
      `Seed role '${roleId}' tidak ditemukan di master.t_mtr_roles!`
    );
  }

  const resellerRole = rolesDataRes.rows.find((r) => r.id === 'reseller');
  assert.equal(resellerRole.can_access_b2b, true, 'Reseller must have can_access_b2b = true');

  const adminRole = rolesDataRes.rows.find((r) => r.id === 'admin');
  assert.equal(adminRole.can_access_admin, true, 'Admin must have can_access_admin = true');

  console.log('[PASS] master.t_mtr_roles seed data verified.');

  console.log('\n--- [3/4] Verifying transaction.t_trx_reseller_invites schema ---');
  const invitesColsRes = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'transaction' AND table_name = 't_trx_reseller_invites'
    ORDER BY ordinal_position;
  `);

  assert.ok(
    invitesColsRes.rows.length > 0,
    'Tabel transaction.t_trx_reseller_invites tidak ditemukan! Harap jalankan migrasi terlebih dahulu.'
  );

  const inviteColumns = invitesColsRes.rows.map((r) => r.column_name);
  console.log('Columns found in transaction.t_trx_reseller_invites:', inviteColumns);

  const requiredInviteCols = [
    'id',
    'token',
    'partner_name',
    'partner_phone',
    'role_to_grant',
    'created_by',
    'max_uses',
    'used_count',
    'expires_at',
    'claimed_at',
    'claimed_by_user_id',
    'is_revoked',
    'created_at',
  ];

  for (const col of requiredInviteCols) {
    assert.ok(
      inviteColumns.includes(col),
      `Kolom '${col}' wajib ada pada tabel transaction.t_trx_reseller_invites!`
    );
  }
  console.log('[PASS] transaction.t_trx_reseller_invites schema structure verified.');

  console.log('\n--- [4/4] Verifying Foreign Key Constraints and Check Constraint Removal ---');
  // Check foreign keys
  const fkeysRes = await client.query(`
    SELECT 
      tc.table_schema, 
      tc.table_name, 
      kcu.column_name, 
      ccu.table_schema AS foreign_table_schema, 
      ccu.table_name AS foreign_table_name, 
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu 
      ON tc.constraint_name = kcu.constraint_name 
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_schema, tc.table_name, kcu.column_name;
  `);

  const fkeys = fkeysRes.rows;
  console.log('Active Foreign Keys in database:', fkeys);

  // 1. role_to_grant -> master.t_mtr_roles(id)
  const roleToGrantFk = fkeys.find(
    (fk) =>
      fk.table_name === 't_trx_reseller_invites' &&
      fk.column_name === 'role_to_grant' &&
      fk.foreign_table_name === 't_mtr_roles' &&
      fk.foreign_column_name === 'id'
  );
  assert.ok(
    roleToGrantFk,
    'Foreign key dari transaction.t_trx_reseller_invites(role_to_grant) ke master.t_mtr_roles(id) wajib ada!'
  );

  // 2. created_by -> master.t_mtr_users(id)
  const createdByFk = fkeys.find(
    (fk) =>
      fk.table_name === 't_trx_reseller_invites' &&
      fk.column_name === 'created_by' &&
      fk.foreign_table_name === 't_mtr_users' &&
      fk.foreign_column_name === 'id'
  );
  assert.ok(
    createdByFk,
    'Foreign key dari transaction.t_trx_reseller_invites(created_by) ke master.t_mtr_users(id) wajib ada!'
  );

  // 3. claimed_by_user_id -> master.t_mtr_users(id)
  const claimedByFk = fkeys.find(
    (fk) =>
      fk.table_name === 't_trx_reseller_invites' &&
      fk.column_name === 'claimed_by_user_id' &&
      fk.foreign_table_name === 't_mtr_users' &&
      fk.foreign_column_name === 'id'
  );
  assert.ok(
    claimedByFk,
    'Foreign key dari transaction.t_trx_reseller_invites(claimed_by_user_id) ke master.t_mtr_users(id) wajib ada!'
  );

  // 4. master.t_mtr_users(role) -> master.t_mtr_roles(id)
  const userRoleFk = fkeys.find(
    (fk) =>
      fk.table_name === 't_mtr_users' &&
      fk.column_name === 'role' &&
      fk.foreign_table_name === 't_mtr_roles' &&
      fk.foreign_column_name === 'id'
  );
  assert.ok(
    userRoleFk,
    'Foreign key dari master.t_mtr_users(role) ke master.t_mtr_roles(id) wajib ada!'
  );

  // 5. Verify legacy check constraint t_mtr_users_role_check is removed
  const legacyCheckRes = await client.query(`
    SELECT conname 
    FROM pg_constraint 
    WHERE conname = 't_mtr_users_role_check';
  `);
  assert.equal(
    legacyCheckRes.rows.length,
    0,
    'Constraint lama t_mtr_users_role_check harus dihapus agar role dinamis seperti reseller dapat disimpan!'
  );

  console.log('[PASS] Foreign key constraints and dynamic role capability verified.');

  console.log('\n========================================');
  console.log('SUCCESS: All RBAC and Invite schema assertions passed 100%!');
  console.log('========================================');
} finally {
  await client.end();
}
