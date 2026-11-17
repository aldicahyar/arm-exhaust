-- CreateTable
CREATE TABLE IF NOT EXISTS transaction.t_trx_password_resets (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    id_seq BIGSERIAL,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT t_trx_password_resets_pkey PRIMARY KEY (id)
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON transaction.t_trx_password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON transaction.t_trx_password_resets(token_hash);
