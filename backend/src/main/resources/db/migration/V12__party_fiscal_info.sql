-- Información fiscal del tercero (relevante para proveedores: retenciones a aplicar) y
-- correos adicionales de contacto (más allá del correo principal ya existente).
ALTER TABLE parties
    ADD COLUMN tax_regime           VARCHAR(20),
    ADD COLUMN isr_withholding_agent BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN isv_withholding_agent BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN withholding_rate     NUMERIC(5, 2);

CREATE TABLE party_emails (
    party_id UUID NOT NULL REFERENCES parties (id) ON DELETE CASCADE,
    email    VARCHAR(255) NOT NULL
);

CREATE INDEX idx_party_emails_party_id ON party_emails (party_id);
