-- ============================================================
-- 1. Add currency column to transactions
--    Backfill existing rows from the user's current preference
-- ============================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'IDR'
  CHECK (currency ~ '^[A-Z]{3}$');

-- Backfill existing transactions with each user's current currency preference
UPDATE transactions t
SET currency = p.currency_preference
FROM profiles p
WHERE t.user_id = p.id
  AND p.currency_preference IS NOT NULL;

-- ============================================================
-- 2. Change category_id FK from ON DELETE RESTRICT → SET NULL
-- ============================================================

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_category_id_fkey;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id)
  ON DELETE SET NULL;
