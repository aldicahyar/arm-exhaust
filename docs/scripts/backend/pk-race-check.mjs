// Uji empiris dua opsi primary key di bawah beban konkurensi:
//   Opsi 1: UUID PK + id_seq BIGINT GENERATED ALWAYS AS IDENTITY
//   Opsi 2: PK string USRA{timestamp}{3 digit random}
// Jalankan: npm run check:pk  (di folder backend)
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL wajib diisi (lewat .env).');
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ---- Opsi 2: generator ID string (timestamp + 3 digit acak) ----
function usrId(now = new Date()) {
  const t = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14); // yyyyMMddHHmmss
  return `USRA${t}${String(randomInt(1000)).padStart(3, '0')}`;
}

// Simulasi burst 200 registrasi pada detik yang sama
const BURST_APP = 200;
const fixedNow = new Date('2026-11-04T10:00:00Z');
const ids = Array.from({ length: BURST_APP }, () => usrId(fixedNow));
const uniqueApp = new Set(ids);
console.log(
  `Opsi 2 (USRA{ts}{rand3}) : ${BURST_APP} ID dalam detik yang sama → unik ${uniqueApp.size}, DUPLIKAT ${BURST_APP - uniqueApp.size}`,
);
// Probabilitas nol-duplikat ≈ e^(-200·199/2000) ≈ 2e-9 → duplikat pasti muncul
assert.ok(uniqueApp.size < BURST_APP, 'harus ada duplikat pada burst 200/detik');

// Burst kecil pun tetap berisiko: 5 registrasi/detik → P(tabrakan) ≈ 1%
let collide5 = 0;
for (let trial = 0; trial < 100_000; trial++) {
  const set = new Set(Array.from({ length: 5 }, () => usrId(fixedNow)));
  if (set.size < 5) collide5++;
}
console.log(`Opsi 2 burst kecil      : dari 100.000x percobaan 5 insert/detik, ${collide5} kali terjadi tabrakan (${(collide5 / 1000).toFixed(2)}%)`);

// ---- Opsi 1: 50 insert paralel NYATA ke PostgreSQL ----
const BURST_DB = 50;
try {
  await pool.query('DROP TABLE IF EXISTS _race_test');
  await pool.query(`
    CREATE TABLE _race_test (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      id_seq BIGINT GENERATED ALWAYS AS IDENTITY,
      label TEXT NOT NULL
    )`);
  const results = await Promise.allSettled(
    Array.from({ length: BURST_DB }, (_, i) =>
      pool.query('INSERT INTO _race_test (label) VALUES ($1)', [`row-${i}`])),
  );
  const failed = results.filter((r) => r.status === 'rejected');
  assert.equal(failed.length, 0, `ada insert gagal: ${failed[0]?.reason?.message ?? ''}`);

  const { rows } = await pool.query(
    'SELECT count(*)::int AS n, count(DISTINCT id)::int AS ids, count(DISTINCT id_seq)::int AS seqs FROM _race_test',
  );
  assert.equal(rows[0].n, BURST_DB, 'jumlah baris salah');
  assert.equal(rows[0].ids, BURST_DB, 'PK UUID duplikat!');
  assert.equal(rows[0].seqs, BURST_DB, 'id_seq duplikat saat insert paralel!');
  console.log(`Opsi 1 (UUID + identity): ${BURST_DB} insert paralel → 0 gagal, 0 duplikat PK, 0 duplikat id_seq`);
} finally {
  await pool.query('DROP TABLE IF EXISTS _race_test').catch(() => {});
  await pool.end();
}

console.log('# OK: uji race-condition primary key selesai.');
