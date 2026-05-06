-- ============================================================
-- Alter existing tables to add missing columns & FK references
-- ============================================================

-- --------------------------------
-- accounts: add icon, color, is_active, sort_order, type constraint, timestamps
-- --------------------------------
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  ALTER TABLE accounts
    ADD CONSTRAINT accounts_type_check
    CHECK (type IN ('bank', 'cash', 'e-wallet', 'credit-card', 'investment'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS set_accounts_updated_at ON accounts;
CREATE TRIGGER set_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------
-- transactions: add category_id FK, recurring_transaction_id FK, merchant
-- --------------------------------
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS recurring_transaction_id uuid REFERENCES recurring_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS merchant text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Index for date-range queries (dashboard, history)
CREATE INDEX IF NOT EXISTS transactions_user_date_idx
  ON transactions (user_id, date DESC);

-- Index for category aggregation (budget spent calculation)
CREATE INDEX IF NOT EXISTS transactions_user_category_idx
  ON transactions (user_id, category_id, date);

-- --------------------------------
-- budgets: add category_id FK, timestamps
-- --------------------------------
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_budgets_updated_at ON budgets;
CREATE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Unique constraint: one budget per category per month per user
CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month_category_unique
  ON budgets (user_id, month_year, category_id);

-- --------------------------------
-- Update account_balances view to include new columns
-- --------------------------------
DROP VIEW IF EXISTS account_balances;
CREATE VIEW account_balances WITH (security_invoker = true) AS
SELECT
  a.id AS account_id,
  a.user_id,
  a.name,
  a.type,
  a.icon,
  a.color,
  a.is_active,
  COALESCE(SUM(
    CASE
      WHEN t.type = 'Income' THEN t.amount
      WHEN t.type = 'Expense' THEN -t.amount
      ELSE 0
    END
  ), 0) AS balance
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY a.id, a.user_id, a.name, a.type, a.icon, a.color, a.is_active;
