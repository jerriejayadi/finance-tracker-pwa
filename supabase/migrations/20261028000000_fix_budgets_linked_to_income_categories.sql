-- ============================================================
-- Fix: budgets matched categories by name regardless of type, so a
-- budget named like an income-only category (e.g. the system default
-- "Investment") got linked to it. Expense transactions can't pick
-- income categories, so the budget's category was missing from the
-- transaction category picker and could never accumulate spending.
-- ============================================================

-- 1. User-owned income categories used by a budget become "both"
--    (unique per user + name, so they can't be duplicated as expense)
UPDATE categories c
SET type = 'both'
WHERE c.type = 'income'
  AND c.user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.category_id = c.id AND b.user_id = c.user_id
  );

-- 2. System income categories used by a budget get a user-owned expense copy
INSERT INTO categories (user_id, name, icon, type, color)
SELECT DISTINCT b.user_id, c.name, c.icon, 'expense', c.color
FROM budgets b
JOIN categories c ON c.id = b.category_id
WHERE c.type = 'income'
  AND c.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories own
    WHERE own.user_id = b.user_id AND own.name = c.name
  );

-- 3. Repoint those budgets, and any expense transactions linked to the
--    system income category, to the user's own category of the same name
UPDATE budgets b
SET category_id = own.id
FROM categories c, categories own
WHERE b.category_id = c.id
  AND c.type = 'income'
  AND c.user_id IS NULL
  AND own.user_id = b.user_id
  AND own.name = c.name
  AND own.type IN ('expense', 'both');

UPDATE transactions t
SET category_id = own.id
FROM categories c, categories own
WHERE t.category_id = c.id
  AND t.type = 'Expense'
  AND c.type = 'income'
  AND c.user_id IS NULL
  AND own.user_id = t.user_id
  AND own.name = c.name
  AND own.type IN ('expense', 'both');
