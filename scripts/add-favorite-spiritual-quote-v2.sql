-- Add favorite_spiritual_quote column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS favorite_spiritual_quote TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN users.favorite_spiritual_quote IS 'User''s favorite spiritual quote or verse that inspires them';

-- Create an index for better query performance (optional, since it's text search)
CREATE INDEX IF NOT EXISTS idx_users_spiritual_quote 
ON users USING gin(to_tsvector('english', favorite_spiritual_quote))
WHERE favorite_spiritual_quote IS NOT NULL;
