ALTER TABLE accounts DROP CONSTRAINT accounts_system_role_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_system_role_check
    CHECK (system_role IN
           ('ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'SALES_REVENUE_DEFAULT', 'TAX_PAYABLE',
            'CASH_HNL', 'CASH_USD', 'WITHHOLDING_TAX_PAYABLE'));

ALTER TABLE expenses ADD COLUMN withheld_in_base NUMERIC(19, 4) NOT NULL DEFAULT 0;
