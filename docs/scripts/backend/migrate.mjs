// Skema auth terstandarisasi:
// Skema: master & transaction (bukan public, bukan trx)
// Prefiks: t_mtr_* & t_trx_*
// Kolom: id (UUID PK) + id_seq (BIGINT IDENTITY non-PK)
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';

const scryptAsync = promisify(scrypt);

const DDL = `
-- 1. Buat skema jika belum ada
CREATE SCHEMA IF NOT EXISTS master;
CREATE SCHEMA IF NOT EXISTS transaction;

-- 1b. Master Roles: master.t_mtr_roles
CREATE TABLE IF NOT EXISTS master.t_mtr_roles (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    can_access_admin BOOLEAN NOT NULL DEFAULT FALSE,
    can_access_b2b BOOLEAN NOT NULL DEFAULT FALSE,
    badge_style JSONB NOT NULL DEFAULT '{"bg": "#1C180A", "border": "#B45309", "text": "#F59E0B"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed role awal
INSERT INTO master.t_mtr_roles (id, name, description, discount_percent, can_access_admin, can_access_b2b, badge_style)
VALUES 
  ('customer', 'Customer', 'Pembeli ritel reguler', 0.00, FALSE, FALSE, '{"bg": "#18181B", "border": "#27272A", "text": "#A1A1AA"}'),
  ('reseller', 'Reseller Official', 'Bengkel rekanan resmi B2B', 20.00, FALSE, TRUE, '{"bg": "#1C180A", "border": "#B45309", "text": "#F59E0B"}'),
  ('admin', 'Administrator', 'Pengelola sistem & inventori', 0.00, TRUE, TRUE, '{"bg": "#1C0D0F", "border": "#7F1D1D", "text": "#E81828"}')
ON CONFLICT (id) DO NOTHING;

-- 2. Master Users: master.t_mtr_users
CREATE TABLE IF NOT EXISTS master.t_mtr_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_seq BIGINT GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT, -- NULLABLE untuk user Google
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hapus check constraint lama jika ada dan tautkan FK ke master.t_mtr_roles
ALTER TABLE master.t_mtr_users DROP CONSTRAINT IF EXISTS t_mtr_users_role_check;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_mtr_users_role'
  ) THEN
    ALTER TABLE master.t_mtr_users
      ADD CONSTRAINT fk_mtr_users_role
      FOREIGN KEY (role) REFERENCES master.t_mtr_roles(id)
      ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Master Identitas Akun: master.t_mtr_user_identities
CREATE TABLE IF NOT EXISTS master.t_mtr_user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_seq BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES master.t_mtr_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_mtr_user_identities_user_id ON master.t_mtr_user_identities(user_id);

-- 4. Transaksi Sesi Login: transaction.t_trx_sessions
CREATE TABLE IF NOT EXISTS transaction.t_trx_sessions (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES master.t_mtr_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trx_sessions_user_id ON transaction.t_trx_sessions(user_id);

-- 5. Transaksi OTP Registrasi: transaction.t_trx_registration_otps
CREATE TABLE IF NOT EXISTS transaction.t_trx_registration_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_seq BIGINT GENERATED ALWAYS AS IDENTITY,
  identifier TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  payload_enc TEXT,
  attempts INT NOT NULL DEFAULT 0,
  request_count INT NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  locked_until TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trx_reg_otps_identifier ON transaction.t_trx_registration_otps(identifier);

-- Alter/Add kolom jika tabel t_trx_registration_otps sudah ada sebelumnya
ALTER TABLE transaction.t_trx_registration_otps ADD COLUMN IF NOT EXISTS payload_enc TEXT;
ALTER TABLE transaction.t_trx_registration_otps ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- 6. Transaksi Rate Limits: transaction.t_trx_rate_limits
CREATE TABLE IF NOT EXISTS transaction.t_trx_rate_limits (
  ip_address INET NOT NULL,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INT NOT NULL DEFAULT 1,
  violation_count INT NOT NULL DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  PRIMARY KEY (ip_address, action)
);
CREATE INDEX IF NOT EXISTS idx_trx_rate_limits_blocked_until ON transaction.t_trx_rate_limits(blocked_until);

-- 7. Master Konfigurasi Aplikasi: master.t_mtr_app_config
CREATE TABLE IF NOT EXISTS master.t_mtr_app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed konfigurasi default jika belum ada
INSERT INTO master.t_mtr_app_config (key, value)
VALUES
  ('otp.ttl_minutes', '15'),
  ('otp.max_attempts', '3'),
  ('otp.lock_minutes', '5'),
  ('ratelimit.max_requests', '5'),
  ('ratelimit.window_minutes', '15'),
  ('ratelimit.block_minutes', '5'),
  ('ratelimit.repeat_window_minutes', '60'),
  ('ratelimit.repeat_block_minutes', '60')
ON CONFLICT (key) DO NOTHING;

-- 7b. Transaksi Undangan VIP Reseller: transaction.t_trx_reseller_invites
CREATE TABLE IF NOT EXISTS transaction.t_trx_reseller_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    partner_name VARCHAR(120) NOT NULL,
    partner_phone VARCHAR(30),
    role_to_grant VARCHAR(30) NOT NULL DEFAULT 'reseller' REFERENCES master.t_mtr_roles(id),
    created_by UUID REFERENCES master.t_mtr_users(id) ON DELETE SET NULL,
    max_uses INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    claimed_at TIMESTAMPTZ,
    claimed_by_user_id UUID REFERENCES master.t_mtr_users(id) ON DELETE SET NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reseller_invites_token ON transaction.t_trx_reseller_invites(token);
CREATE INDEX IF NOT EXISTS idx_reseller_invites_active ON transaction.t_trx_reseller_invites(expires_at, is_revoked, used_count);

-- 8. Migrasi data lama dari skema trx (jika ada) ke transaction
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'trx' AND table_name = 't_trx_sessions') THEN
    INSERT INTO transaction.t_trx_sessions (token, user_id, expires_at, created_at)
    SELECT token, user_id, expires_at, created_at
    FROM trx.t_trx_sessions
    ON CONFLICT (token) DO NOTHING;
    
    DROP TABLE IF EXISTS trx.t_trx_sessions CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'trx' AND table_name = 't_trx_registration_otps') THEN
    INSERT INTO transaction.t_trx_registration_otps (id, identifier, otp_hash, attempts, request_count, expires_at, verified_at, created_at)
    SELECT id, identifier, otp_hash, attempts, request_count, expires_at, verified_at, created_at
    FROM trx.t_trx_registration_otps
    ON CONFLICT (id) DO NOTHING;

    DROP TABLE IF EXISTS trx.t_trx_registration_otps CASCADE;
  END IF;

  -- Hapus skema lama trx jika kosong
  IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'trx') THEN
    DROP SCHEMA IF EXISTS trx CASCADE;
  END IF;
END $$;
`;

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, 64)).toString('hex');
  return `${salt}:${hash}`;
}

const email = process.env.ADMIN_EMAIL ?? 'admin@armexhaust.id';
const password = process.env.ADMIN_PASSWORD ?? 'admin12345';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(DDL);
  const hash = await hashPassword(password);
  const r = await client.query(
    `INSERT INTO master.t_mtr_users (name, email, password_hash, role)
     VALUES ('Admin ARM', $1, $2, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [email, hash],
  );
  console.log(r.rowCount ? `Admin dibuat di master.t_mtr_users: ${email}` : `Admin sudah ada: ${email}`);
  console.log('Migrasi skema (master & transaction) dengan prefiks (t_mtr_ & t_trx_) selesai.');
} finally {
  await client.end();
}
