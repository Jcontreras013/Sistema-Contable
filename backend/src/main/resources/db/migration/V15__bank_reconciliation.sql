CREATE TABLE bank_reconciliations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id        UUID NOT NULL REFERENCES accounts (id),
    statement_date    DATE NOT NULL,
    statement_balance NUMERIC(19, 4) NOT NULL,
    status            VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'COMPLETED')),
    created_by        UUID NOT NULL REFERENCES users (id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_reconciliations_account_id ON bank_reconciliations (account_id);
-- Solo puede haber una conciliación abierta a la vez por cuenta.
CREATE UNIQUE INDEX idx_bank_reconciliations_open_per_account
    ON bank_reconciliations (account_id) WHERE status = 'OPEN';

ALTER TABLE journal_entry_lines ADD COLUMN reconciled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE journal_entry_lines ADD COLUMN reconciliation_id UUID REFERENCES bank_reconciliations (id);
CREATE INDEX idx_jel_reconciliation_id ON journal_entry_lines (reconciliation_id);
