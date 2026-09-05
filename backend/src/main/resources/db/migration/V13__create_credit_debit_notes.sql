-- Notas de crédito y débito: ajustan una factura ya emitida (devoluciones, descuentos,
-- cargos adicionales) sin modificar el documento original — cada una es su propio
-- documento fiscal, con su propio correlativo/CAI (tipo de documento distinto al de
-- la factura) y su propio asiento contable.
ALTER TABLE journal_entries DROP CONSTRAINT journal_entries_source_type_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_source_type_check
    CHECK (source_type IN ('MANUAL', 'INVOICE', 'EXPENSE', 'PAYMENT', 'REVERSAL', 'CREDIT_NOTE', 'DEBIT_NOTE'));

CREATE SEQUENCE credit_debit_note_number_seq START WITH 1;

CREATE TABLE credit_debit_notes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_number             BIGINT NOT NULL UNIQUE DEFAULT nextval('credit_debit_note_number_seq'),
    invoice_id              UUID NOT NULL REFERENCES invoices (id),
    type                    VARCHAR(10) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    issue_date              DATE NOT NULL,
    reason                  VARCHAR(500) NOT NULL,
    account_id              UUID NOT NULL REFERENCES accounts (id),
    subtotal                NUMERIC(19, 4) NOT NULL,
    tax_amount              NUMERIC(19, 4) NOT NULL DEFAULT 0,
    total                   NUMERIC(19, 4) NOT NULL,
    amount_in_base          NUMERIC(19, 4) NOT NULL,
    status                  VARCHAR(20) NOT NULL CHECK (status IN ('ISSUED', 'CANCELLED')),
    journal_entry_id        UUID REFERENCES journal_entries (id),
    correlativo             VARCHAR(20) UNIQUE,
    cai_code                VARCHAR(50),
    cai_emission_limit_date DATE,
    created_by              UUID NOT NULL REFERENCES users (id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_debit_notes_invoice_id ON credit_debit_notes (invoice_id);
