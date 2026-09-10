ALTER TABLE journal_entries DROP CONSTRAINT journal_entries_source_type_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_source_type_check
    CHECK (source_type IN
           ('MANUAL', 'INVOICE', 'EXPENSE', 'PAYMENT', 'REVERSAL', 'CREDIT_NOTE', 'DEBIT_NOTE', 'DEPRECIATION'));

CREATE TABLE fixed_assets (
    id                                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description                          VARCHAR(255) NOT NULL,
    account_id                           UUID NOT NULL REFERENCES accounts (id),
    depreciation_expense_account_id      UUID NOT NULL REFERENCES accounts (id),
    accumulated_depreciation_account_id  UUID NOT NULL REFERENCES accounts (id),
    acquisition_date                     DATE NOT NULL,
    cost                                 NUMERIC(19, 4) NOT NULL,
    residual_value                       NUMERIC(19, 4) NOT NULL DEFAULT 0,
    useful_life_months                   INT NOT NULL,
    accumulated_depreciation             NUMERIC(19, 4) NOT NULL DEFAULT 0,
    last_depreciation_period             DATE,
    status                               VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'FULLY_DEPRECIATED', 'DISPOSED')),
    disposal_date                        DATE,
    created_by                           UUID NOT NULL REFERENCES users (id),
    created_at                           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fixed_assets_status ON fixed_assets (status);
