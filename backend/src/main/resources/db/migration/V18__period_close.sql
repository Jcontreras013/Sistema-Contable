ALTER TABLE accounts DROP CONSTRAINT accounts_system_role_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_system_role_check
    CHECK (system_role IN
           ('ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'SALES_REVENUE_DEFAULT', 'TAX_PAYABLE',
            'CASH_HNL', 'CASH_USD', 'WITHHOLDING_TAX_PAYABLE', 'RETAINED_EARNINGS'));

ALTER TABLE journal_entries DROP CONSTRAINT journal_entries_source_type_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_source_type_check
    CHECK (source_type IN
           ('MANUAL', 'INVOICE', 'EXPENSE', 'PAYMENT', 'REVERSAL', 'CREDIT_NOTE', 'DEBIT_NOTE',
            'DEPRECIATION', 'PERIOD_CLOSE'));

CREATE TABLE period_closes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_end_date  DATE NOT NULL UNIQUE,
    net_income       NUMERIC(19, 4) NOT NULL,
    journal_entry_id UUID REFERENCES journal_entries (id),
    closed_by        UUID NOT NULL REFERENCES users (id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_period_closes_period_end_date ON period_closes (period_end_date);
