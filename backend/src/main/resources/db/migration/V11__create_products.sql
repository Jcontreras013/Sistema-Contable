-- Catálogo de productos/servicios de compra, para agilizar el registro de gastos y
-- asegurar que siempre se contabilicen en la cuenta correcta.
CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(255) NOT NULL,
    account_id  UUID NOT NULL REFERENCES accounts (id),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_account_id ON products (account_id);

ALTER TABLE expenses ADD COLUMN product_id UUID REFERENCES products (id);
