-- Remove unused partner preference columns from users table
-- We're keeping only ideal_partner_notes and using AI matching instead

DO $$
BEGIN
    -- Remove specific partner preference columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_age_min') THEN
        ALTER TABLE users DROP COLUMN preferred_age_min;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_age_max') THEN
        ALTER TABLE users DROP COLUMN preferred_age_max;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_gender') THEN
        ALTER TABLE users DROP COLUMN preferred_gender;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_location') THEN
        ALTER TABLE users DROP COLUMN preferred_location;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_education') THEN
        ALTER TABLE users DROP COLUMN preferred_education;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_profession') THEN
        ALTER TABLE users DROP COLUMN preferred_profession;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_diet') THEN
        ALTER TABLE users DROP COLUMN preferred_diet;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_spiritual_org') THEN
        ALTER TABLE users DROP COLUMN preferred_spiritual_org;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_temple_visit_freq') THEN
        ALTER TABLE users DROP COLUMN preferred_temple_visit_freq;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_height_min') THEN
        ALTER TABLE users DROP COLUMN preferred_height_min;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_height_max') THEN
        ALTER TABLE users DROP COLUMN preferred_height_max;
    END IF;
    
    -- Remove any related indexes
    DROP INDEX IF EXISTS idx_users_preferred_age;
    DROP INDEX IF EXISTS idx_users_preferred_gender;
    DROP INDEX IF EXISTS idx_users_preferred_location;
    
    RAISE NOTICE 'Successfully removed unused partner preference columns. AI matching now relies on ideal_partner_notes field.';
END $$; 