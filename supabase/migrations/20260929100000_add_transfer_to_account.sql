-- ============================================================
-- Transfers: one row moves `amount` from account_id to to_account_id
-- ============================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS to_account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS transactions_to_account_idx
  ON transactions (to_account_id);

-- Legacy Transfer rows have no destination; keep them as expenses rather than delete
UPDATE transactions
  SET type = 'Expense'
  WHERE type = 'Transfer' AND to_account_id IS NULL;

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_transfer_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_transfer_check CHECK (
  (type = 'Transfer' AND to_account_id IS NOT NULL AND to_account_id <> account_id)
  OR (type <> 'Transfer' AND to_account_id IS NULL)
);

-- --------------------------------
-- RLS: FK checks bypass RLS, so verify both accounts belong to the user
-- --------------------------------
DROP POLICY IF EXISTS "Users manage own transactions" ON transactions;
CREATE POLICY "Users manage own transactions" ON transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = transactions.account_id AND a.user_id = auth.uid()
    )
    AND (
      transactions.to_account_id IS NULL
      OR EXISTS (
        SELECT 1 FROM accounts a
        WHERE a.id = transactions.to_account_id AND a.user_id = auth.uid()
      )
    )
  );

-- --------------------------------
-- Balances: transfers subtract on the From side, add on the To side
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
      WHEN t.type = 'Transfer' AND t.account_id = a.id THEN -t.amount
      WHEN t.type = 'Transfer' AND t.to_account_id = a.id THEN t.amount
      ELSE 0
    END
  ), 0) AS balance
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id OR t.to_account_id = a.id
GROUP BY a.id, a.user_id, a.name, a.type, a.icon, a.color, a.is_active;
