-- Add partner preference columns to users table
DO $$
BEGIN
    -- Add partner preference columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_age_min') THEN
        ALTER TABLE users ADD COLUMN preferred_age_min INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_age_max') THEN
        ALTER TABLE users ADD COLUMN preferred_age_max INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_gender') THEN
        ALTER TABLE users ADD COLUMN preferred_gender VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_location') THEN
        ALTER TABLE users ADD COLUMN preferred_location TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_education') THEN
        ALTER TABLE users ADD COLUMN preferred_education VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_profession') THEN
        ALTER TABLE users ADD COLUMN preferred_profession TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_diet') THEN
        ALTER TABLE users ADD COLUMN preferred_diet VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_spiritual_org') THEN
        ALTER TABLE users ADD COLUMN preferred_spiritual_org TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_temple_visit_freq') THEN
        ALTER TABLE users ADD COLUMN preferred_temple_visit_freq VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_height_min') THEN
        ALTER TABLE users ADD COLUMN preferred_height_min INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_height_max') THEN
        ALTER TABLE users ADD COLUMN preferred_height_max INTEGER;
    END IF;
    
    -- Add height column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'height') THEN
        ALTER TABLE users ADD COLUMN height VARCHAR(20);
    END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_preferred_age ON users(preferred_age_min, preferred_age_max);
CREATE INDEX IF NOT EXISTS idx_users_preferred_gender ON users(preferred_gender);
CREATE INDEX IF NOT EXISTS idx_users_preferred_location ON users(preferred_location);
CREATE INDEX IF NOT EXISTS idx_users_height ON users(height);
