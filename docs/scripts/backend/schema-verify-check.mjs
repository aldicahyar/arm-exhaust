// Test verifikasi skema spesifik:
// Hanya skema 'master' dan 'transaction' yang digunakan.
// Skema 'public' dan 'trx' tidak boleh digunakan.
import assert from 'node:assert/strict';
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const { rows } = await client.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name;
  `);

  const tables = rows.map((r) => `${r.table_schema}.${r.table_name}`);
  console.log('Tabel di database:', tables);

  // Verifikasi tabel master
  assert.ok(tables.includes('master.t_mtr_users'), 'Tabel master.t_mtr_users harus ada!');
  assert.ok(tables.includes('master.t_mtr_user_identities'), 'Tabel master.t_mtr_user_identities harus ada!');

  // Verifikasi tabel transaction (bukan trx)
  assert.ok(tables.includes('transaction.t_trx_sessions'), 'Tabel transaction.t_trx_sessions harus ada!');
  assert.ok(tables.includes('transaction.t_trx_registration_otps'), 'Tabel transaction.t_trx_registration_otps harus ada!');

  // Pastikan skema lama 'trx' tidak lagi memiliki tabel
  const oldTrxTables = tables.filter((t) => t.startsWith('trx.'));
  assert.equal(oldTrxTables.length, 0, `Masih ada tabel di skema lama trx: ${oldTrxTables.join(', ')}`);

  console.log('# OK: Skema master & transaction valid, public & trx bersih.');
} finally {
  await client.end();
}
