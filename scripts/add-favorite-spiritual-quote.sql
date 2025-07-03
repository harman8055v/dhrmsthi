-- Add favorite_spiritual_quote column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS favorite_spiritual_quote TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN users.favorite_spiritual_quote IS 'User''s favorite spiritual quote for inspiration';
