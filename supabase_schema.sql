-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Households Table
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts Table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL, -- e.g., 'CHECKING', 'SAVINGS', 'CREDIT'
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'MXN')),
    current_interest_rate NUMERIC(15, 6),
    is_cash_flow BOOLEAN DEFAULT TRUE, -- TRUE for accounts that move bank balance (Debit/Checking)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    original_amount NUMERIC(15, 2) NOT NULL,
    original_currency TEXT NOT NULL,
    normalized_usd_amount NUMERIC(15, 2),
    transaction_type TEXT CHECK (transaction_type IN ('CREDIT', 'DEBIT')), -- 'CREDIT' is income, 'DEBIT' is expense
    is_remittance BOOLEAN DEFAULT FALSE, -- TRUE for Wise/Transferwise
    is_essential BOOLEAN DEFAULT TRUE, -- TRUE for Rent/Groceries/Loans
    is_recurring BOOLEAN DEFAULT FALSE, -- TRUE if this is a subscription or regular utility
    is_transfer BOOLEAN DEFAULT FALSE, -- TRUE for CC payments or internal account moves
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Statement Metadata (Audit Log)
CREATE TABLE statement_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_hash TEXT UNIQUE,
    beginning_balance NUMERIC(15, 2) NOT NULL,
    ending_balance NUMERIC(15, 2) NOT NULL,
    reported_interest_rate NUMERIC(15, 6),
    statement_date DATE NOT NULL,
    is_valid BOOLEAN DEFAULT FALSE,
    audit_log JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, file_name)
);

-- Household Profile (Strategic context)
CREATE TABLE household_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    owner_info TEXT,
    long_term_goals TEXT[],
    budgeting_rules JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_household_profile UNIQUE (household_id)
);

-- Exchange Rates Table
CREATE TABLE exchange_rates (
    rate_date DATE PRIMARY KEY,
    usd_to_mxn NUMERIC(15, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
