-- Add height fields to users table
DO $$
BEGIN
    -- Drop the existing height column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'height') THEN
        ALTER TABLE users DROP COLUMN height;
    END IF;
    
    -- Add height_ft column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'height_ft') THEN
        ALTER TABLE users ADD COLUMN height_ft INTEGER CHECK (height_ft >= 4 AND height_ft <= 7);
    END IF;
    
    -- Add height_in column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'height_in') THEN
        ALTER TABLE users ADD COLUMN height_in INTEGER CHECK (height_in >= 0 AND height_in <= 11);
    END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_height_ft ON users(height_ft);
CREATE INDEX IF NOT EXISTS idx_users_height_in ON users(height_in);
CREATE INDEX IF NOT EXISTS idx_users_height_composite ON users(height_ft, height_in);

-- Add comments explaining the fields
COMMENT ON COLUMN users.height_ft IS 'Height in feet (4-7 feet)';
COMMENT ON COLUMN users.height_in IS 'Height in inches (0-11 inches)'; 