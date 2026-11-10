import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, 64)).toString('hex');
  return `${salt}:${hash}`;
}

const email = process.env.SUPERADMIN_EMAIL ?? 'superadmin@armexhaust.id';
const password = process.env.SUPERADMIN_PASSWORD ?? 'SuperAdmin123!';

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  console.log('--- [1/2] Upserting role superadmin into master.t_mtr_roles ---');
  await client.query(`
    INSERT INTO master.t_mtr_roles (id, name, description, can_access_admin, can_access_b2b, badge_style)
    VALUES (
      'superadmin',
      'Super Administrator',
      'Pemilik sistem, konfigurasi pajak, dynamic pricing, dan kontrol penuh',
      TRUE,
      TRUE,
      '{"bg": "#18181B", "border": "#D97706", "text": "#D97706"}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      can_access_admin = TRUE,
      can_access_b2b = TRUE,
      badge_style = EXCLUDED.badge_style,
      updated_at = now();
  `);
  console.log('Role superadmin berhasil diupsert ke master.t_mtr_roles.');

  console.log('--- [2/2] Seeding user superadmin@armexhaust.id into master.t_mtr_users ---');
  const passwordHash = await hashPassword(password);
  const userRes = await client.query(`
    INSERT INTO master.t_mtr_users (name, email, password_hash, role)
    VALUES ('Superadmin ARM', $1, $2, 'superadmin')
    ON CONFLICT (email) DO UPDATE SET
      role = 'superadmin',
      password_hash = $2,
      updated_at = now()
    RETURNING id, name, email, role;
  `, [email, passwordHash]);

  console.log(`User superadmin berhasil disimpan: ${userRes.rows[0].email} (ID: ${userRes.rows[0].id})`);
  console.log('Migrasi superadmin role dan default credentials selesai.');
} finally {
  await client.end();
}
