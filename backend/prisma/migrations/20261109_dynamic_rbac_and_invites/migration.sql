-- Migration: 20261109_dynamic_rbac_and_invites
-- Description: Dynamic RBAC roles table and tokenized VIP reseller invites

-- 1. Create Master Roles Table
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

-- 2. Seed initial roles
INSERT INTO master.t_mtr_roles (id, name, description, discount_percent, can_access_admin, can_access_b2b, badge_style)
VALUES 
  ('customer', 'Customer', 'Pembeli ritel reguler', 0.00, FALSE, FALSE, '{"bg": "#18181B", "border": "#27272A", "text": "#A1A1AA"}'),
  ('reseller', 'Reseller Official', 'Bengkel rekanan resmi B2B', 20.00, FALSE, TRUE, '{"bg": "#1C180A", "border": "#B45309", "text": "#F59E0B"}'),
  ('admin', 'Administrator', 'Pengelola sistem & inventori', 0.00, TRUE, TRUE, '{"bg": "#1C0D0F", "border": "#7F1D1D", "text": "#E81828"}')
ON CONFLICT (id) DO NOTHING;

-- 3. Drop legacy static role check constraint from master.t_mtr_users
ALTER TABLE master.t_mtr_users DROP CONSTRAINT IF EXISTS t_mtr_users_role_check;

-- 4. Add foreign key constraint from master.t_mtr_users.role to master.t_mtr_roles.id
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

-- 5. Create Reseller Invites Table
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

-- 6. Indexes for Reseller Invites
CREATE INDEX IF NOT EXISTS idx_reseller_invites_token ON transaction.t_trx_reseller_invites(token);
CREATE INDEX IF NOT EXISTS idx_reseller_invites_active ON transaction.t_trx_reseller_invites(expires_at, is_revoked, used_count);
