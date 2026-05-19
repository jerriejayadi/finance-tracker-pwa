ALTER TABLE profiles
ADD COLUMN language text NOT NULL DEFAULT 'en'
CHECK (language IN ('en', 'id'));
