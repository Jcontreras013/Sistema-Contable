-- Datos del emisor (una sola fila) impresos en las facturas.
CREATE TABLE company_profile (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    rtn        VARCHAR(20) NOT NULL,
    address    VARCHAR(500),
    phone      VARCHAR(50),
    email      VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Autorizaciones CAI del SAR: habilitan un rango de correlativos por tipo de documento.
CREATE TABLE cai_authorizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cai_code            VARCHAR(50) NOT NULL,
    establishment_code  VARCHAR(3) NOT NULL,
    emission_point_code VARCHAR(3) NOT NULL,
    document_type_code  VARCHAR(2) NOT NULL,
    range_start         BIGINT NOT NULL,
    range_end           BIGINT NOT NULL CHECK (range_end >= range_start),
    current_number      BIGINT NOT NULL,
    emission_limit_date DATE NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_by          UUID NOT NULL REFERENCES users (id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cai_authorizations_lookup ON cai_authorizations (document_type_code, is_active);

-- Correlativo y CAI asignados a cada factura al emitirla.
ALTER TABLE invoices
    ADD COLUMN cai_code             VARCHAR(50),
    ADD COLUMN correlativo          VARCHAR(20) UNIQUE,
    ADD COLUMN cai_emission_limit_date DATE;
