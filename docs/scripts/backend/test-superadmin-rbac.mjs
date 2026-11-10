import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../../backend');
const backendEnvPath = path.resolve(backendDir, '.env');

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

let pg;
try {
  pg = (await import('pg')).default;
} catch {
  const pgPath = (await import('node:url')).pathToFileURL(
    path.resolve(backendDir, 'node_modules/pg/lib/index.js'),
  ).href;
  const mod = await import(pgPath);
  pg = mod.default || mod;
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const roleRes = await client.query("SELECT * FROM master.t_mtr_roles WHERE id = 'superadmin'");
  assert.strictEqual(roleRes.rowCount, 1, "Role superadmin harus terdaftar di master.t_mtr_roles");
  assert.strictEqual(roleRes.rows[0].can_access_admin, true, "superadmin harus memiliki can_access_admin = true");

  const userRes = await client.query("SELECT * FROM master.t_mtr_users WHERE email = 'superadmin@armexhaust.id'");
  assert.strictEqual(userRes.rowCount, 1, "User superadmin@armexhaust.id harus terdaftar di master.t_mtr_users");
  assert.strictEqual(userRes.rows[0].role, 'superadmin', "Role user harus superadmin");
  console.log("PASS: Role superadmin dan user default valid di database.");
} finally {
  await client.end();
}
