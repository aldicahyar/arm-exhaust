CREATE TABLE IF NOT EXISTS master.t_mtr_discount_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
    discount_value NUMERIC(10, 2) NOT NULL,
    target_roles TEXT[] NULL,
    target_categories TEXT[] NULL,
    target_product_ids TEXT[] NULL,
    min_order_qty INT NOT NULL DEFAULT 1,
    min_order_amount NUMERIC(12, 2) DEFAULT 0,
    coupon_code VARCHAR(50) NULL,
    criteria_rules JSONB DEFAULT '{}'::jsonb,
    priority INT NOT NULL DEFAULT 0,
    stacking_mode VARCHAR(20) NOT NULL DEFAULT 'EXCLUSIVE',
    valid_from TIMESTAMPTZ NULL,
    valid_until TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_target_roles ON master.t_mtr_discount_policies USING GIN (target_roles);
CREATE INDEX IF NOT EXISTS idx_discount_is_active_priority ON master.t_mtr_discount_policies (is_active, priority DESC);

INSERT INTO master.t_mtr_discount_policies (code, name, description, discount_type, discount_value, target_roles, priority, is_active)
VALUES 
  ('RESELLER_BASE_20', 'Diskon Kemitraan Reseller Resmi', 'Diskon margin dasar B2B untuk bengkel rekanan resmi', 'PERCENTAGE', 20.00, ARRAY['reseller'], 10, TRUE),
  ('DISTRIBUTOR_TIER_35', 'Diskon Distributor Regional', 'Diskon margin tier 1 untuk distributor wilayah', 'PERCENTAGE', 35.00, ARRAY['distributor'], 20, TRUE)
ON CONFLICT (code) DO UPDATE SET discount_value = EXCLUDED.discount_value, target_roles = EXCLUDED.target_roles;

ALTER TABLE master.t_mtr_roles DROP COLUMN IF EXISTS discount_percent;
