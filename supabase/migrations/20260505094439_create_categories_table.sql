-- ============================================================
-- Categories table: replaces hardcoded category strings
-- Supports system defaults (user_id IS NULL) + user custom ones
-- ============================================================

CREATE TABLE categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL,
  type text NOT NULL CHECK (type IN ('expense', 'income', 'both')),
  color text,
  sort_order smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate category names per user (and per system defaults)
CREATE UNIQUE INDEX categories_user_name_unique
  ON categories (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), name);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Users can view system defaults + own categories
CREATE POLICY "Users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Users can only insert their own categories
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own categories
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only delete their own categories
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Seed system default categories (user_id = NULL)
-- ============================================================
INSERT INTO categories (user_id, name, icon, type, color, sort_order) VALUES
  (NULL, 'Groceries',       '🛒', 'expense', '#4CAF50', 1),
  (NULL, 'Food & Dining',   '🍜', 'expense', '#FF9800', 2),
  (NULL, 'Transport',       '🚗', 'expense', '#2196F3', 3),
  (NULL, 'Bills & Utilities','⚡', 'expense', '#9C27B0', 4),
  (NULL, 'Entertainment',   '🎬', 'expense', '#E91E63', 5),
  (NULL, 'Shopping',        '🛍', 'expense', '#FF5722', 6),
  (NULL, 'Health',          '✚',  'expense', '#00BCD4', 7),
  (NULL, 'Subscriptions',   '♪',  'expense', '#673AB7', 8),
  (NULL, 'Coffee',          '☕', 'expense', '#795548', 9),
  (NULL, 'Education',       '📚', 'expense', '#3F51B5', 10),
  (NULL, 'Salary',          '💰', 'income',  '#4CAF50', 11),
  (NULL, 'Freelance',       '💻', 'income',  '#2196F3', 12),
  (NULL, 'Investment',      '📈', 'income',  '#FF9800', 13),
  (NULL, 'Transfer',        '↔',  'both',    '#607D8B', 14);
