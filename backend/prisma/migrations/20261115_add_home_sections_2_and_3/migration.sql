-- Migration: Add Home Value Props (Section 2) and Home New Arrivals (Section 3) tables for dynamic homepage content management

CREATE TABLE IF NOT EXISTS master.t_mtr_home_value_props (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_number VARCHAR(10) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_value_props_active_sort ON master.t_mtr_home_value_props (is_active, sort_order);

CREATE TABLE IF NOT EXISTS master.t_mtr_home_new_arrivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(50) NOT NULL,
    badge_text VARCHAR(50) NULL,
    name VARCHAR(100) NOT NULL,
    category_label VARCHAR(50) NOT NULL,
    inlet VARCHAR(30) NULL,
    material VARCHAR(50) NULL,
    price_display VARCHAR(50) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    href VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_new_arrivals_active_sort ON master.t_mtr_home_new_arrivals (is_active, sort_order);
