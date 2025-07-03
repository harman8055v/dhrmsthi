-- Add user_photos column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'user_photos'
    ) THEN
        ALTER TABLE users ADD COLUMN user_photos TEXT[];
    END IF;
END $$;

-- Add comment for the column
COMMENT ON COLUMN users.user_photos IS 'Array of user profile photos (base64 or URLs)';
