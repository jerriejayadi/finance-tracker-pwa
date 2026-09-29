-- ============================================================
-- Backfill: budgets created with a custom category name never got a
-- categories row (category_id IS NULL), so those categories were
-- missing from the transaction category picker.
-- ============================================================

-- 1. Create the missing categories as the user's own expense categories
INSERT INTO categories (user_id, name, icon, type)
SELECT DISTINCT b.user_id, b.category, '📝', 'expense'
FROM budgets b
WHERE b.category_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.name = b.category
      AND (c.user_id = b.user_id OR c.user_id IS NULL)
  );

-- 2. Link budgets to their category (user's own row wins over a system default)
UPDATE budgets b
SET category_id = (
  SELECT c.id FROM categories c
  WHERE c.name = b.category
    AND (c.user_id = b.user_id OR c.user_id IS NULL)
  ORDER BY c.user_id NULLS LAST
  LIMIT 1
)
WHERE b.category_id IS NULL;

-- 3. Link transactions saved with only a category name to an existing category,
--    so budget "spent" (keyed by category_id) keeps counting them.
--    Only matches existing categories; never creates new ones.
UPDATE transactions t
SET category_id = (
  SELECT c.id FROM categories c
  WHERE c.name = t.category
    AND (c.user_id = t.user_id OR c.user_id IS NULL)
  ORDER BY c.user_id NULLS LAST
  LIMIT 1
)
WHERE t.category_id IS NULL
  AND t.category <> 'Uncategorized';
