-- ============================================================
-- 1. Add currency column to budgets
--    Backfill existing rows from the user's current preference
-- ============================================================

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'IDR'
  CHECK (currency ~ '^[A-Z]{3}$');

-- Backfill existing budgets with each user's current currency preference
UPDATE budgets b
SET currency = p.currency_preference
FROM profiles p
WHERE b.user_id = p.id
  AND p.currency_preference IS NOT NULL;

-- ============================================================
-- 2. Change category_id FK from ON DELETE RESTRICT → SET NULL
-- ============================================================

ALTER TABLE budgets
  DROP CONSTRAINT IF EXISTS budgets_category_id_fkey;

ALTER TABLE budgets
  ADD CONSTRAINT budgets_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id)
  ON DELETE SET NULL;
