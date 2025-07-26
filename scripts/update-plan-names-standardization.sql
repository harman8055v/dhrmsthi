-- Update plan names to standardized format: drishti, sparsh, sangam, samarpan
-- This migration updates the account_status enum and existing data

-- First, update existing user data to use new plan names
UPDATE users SET account_status = 'drishti' WHERE account_status IN ('free', 'active') OR account_status IS NULL;
UPDATE users SET account_status = 'sangam' WHERE account_status = 'premium';
UPDATE users SET account_status = 'samarpan' WHERE account_status = 'elite';

-- Update account_status enum to use standardized plan names
DO $$ 
BEGIN
    -- Drop the existing enum type if it exists and recreate with new values
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
        -- Create a new enum with updated values
        CREATE TYPE account_status_enum_new AS ENUM ('drishti', 'sparsh', 'sangam', 'samarpan', 'suspended', 'deleted');
        
        -- Update the column to use the new enum
        ALTER TABLE users ALTER COLUMN account_status TYPE account_status_enum_new USING 
            CASE 
                WHEN account_status = 'active' THEN 'drishti'::account_status_enum_new
                WHEN account_status = 'free' THEN 'drishti'::account_status_enum_new
                WHEN account_status = 'premium' THEN 'sangam'::account_status_enum_new
                WHEN account_status = 'elite' THEN 'samarpan'::account_status_enum_new
                WHEN account_status = 'suspended' THEN 'suspended'::account_status_enum_new
                WHEN account_status = 'deleted' THEN 'deleted'::account_status_enum_new
                ELSE 'drishti'::account_status_enum_new
            END;
        
        -- Drop the old enum and rename the new one
        DROP TYPE account_status_enum;
        ALTER TYPE account_status_enum_new RENAME TO account_status_enum;
    ELSE
        -- Create the enum type if it doesn't exist
        CREATE TYPE account_status_enum AS ENUM ('drishti', 'sparsh', 'sangam', 'samarpan', 'suspended', 'deleted');
        ALTER TABLE users ALTER COLUMN account_status TYPE account_status_enum USING account_status::account_status_enum;
    END IF;
END $$;

-- Update the default value for new users
ALTER TABLE users ALTER COLUMN account_status SET DEFAULT 'drishti';

-- Update any constraint checks
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users ADD CONSTRAINT users_account_status_check 
    CHECK (account_status IN ('drishti', 'sparsh', 'sangam', 'samarpan', 'suspended', 'deleted'));

-- Update swipe limit functions to use new plan names
CREATE OR REPLACE FUNCTION can_user_swipe(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  daily_limit INTEGER;
  swipes_used INTEGER;
BEGIN
  -- Get user's current plan
  SELECT account_status INTO user_plan FROM users WHERE id = p_user_id;
  
  -- Set daily limits based on plan
  CASE user_plan
    WHEN 'sparsh' THEN daily_limit := 20;
    WHEN 'sangam' THEN daily_limit := 50;
    WHEN 'samarpan' THEN daily_limit := -1; -- Unlimited
    ELSE daily_limit := 5; -- Free plan (drishti)
  END CASE;
  
  -- If unlimited, return true
  IF daily_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Get today's swipe count
  SELECT COALESCE(swipes_used, 0) INTO swipes_used 
  FROM user_daily_stats 
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  RETURN swipes_used < daily_limit;
END;
$$ LANGUAGE plpgsql;

-- Update get user swipe limit function
CREATE OR REPLACE FUNCTION get_user_swipe_limit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_plan TEXT;
BEGIN
  SELECT account_status INTO user_plan FROM users WHERE id = p_user_id;
  
  CASE user_plan
    WHEN 'sparsh' THEN RETURN 20;
    WHEN 'sangam' THEN RETURN 50;
    WHEN 'samarpan' THEN RETURN -1; -- Unlimited
    ELSE RETURN 5; -- Free plan (drishti)
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update elite verification function to use new plan names
CREATE OR REPLACE FUNCTION is_eligible_for_elite_profiles(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_status TEXT;
BEGIN
    SELECT account_status INTO user_status FROM users WHERE id = user_id;
    RETURN user_status = 'samarpan'; -- samarpan is the new elite plan
END;
$$ LANGUAGE plpgsql;

-- Update get elite profiles function
CREATE OR REPLACE FUNCTION get_elite_profiles(current_user_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    age INTEGER,
    gender TEXT,
    city TEXT,
    state TEXT,
    spiritual_background TEXT,
    photos JSONB,
    income_verified BOOLEAN,
    family_verified BOOLEAN,
    location_verified BOOLEAN,
    credit_score_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        EXTRACT(YEAR FROM AGE(u.birthdate))::INTEGER as age,
        u.gender,
        c.name as city,
        s.name as state,
        array_to_string(u.spiritual_org, ', ') as spiritual_background,
        u.user_photos as photos,
        ev.income_verified,
        ev.family_verified,
        ev.location_verified,
        ev.credit_score_verified
    FROM users u
    LEFT JOIN cities c ON u.city_id = c.id
    LEFT JOIN states s ON u.state_id = s.id
    LEFT JOIN elite_verification_requests ev ON u.id = ev.user_id
    WHERE u.account_status IN ('sangam', 'samarpan') -- Updated to use new plan names
    AND u.id != current_user_id
    ORDER BY 
        (CASE WHEN u.account_status = 'samarpan' THEN 0 ELSE 1 END), -- samarpan users first
        u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update payment plans table to reflect new naming
UPDATE payment_plans SET name = 'Sparsh Monthly' WHERE name LIKE '%Sparsh%' OR (price = 39900 AND duration_days = 30);
UPDATE payment_plans SET name = 'Sparsh Quarterly' WHERE name LIKE '%Sparsh%' OR (price = 99900 AND duration_days = 90);
UPDATE payment_plans SET name = 'Sangam Monthly' WHERE name LIKE '%Sangam%' OR (price = 69900 AND duration_days = 30);
UPDATE payment_plans SET name = 'Sangam Quarterly' WHERE name LIKE '%Sangam%' OR (price = 174900 AND duration_days = 90);
UPDATE payment_plans SET name = 'Samarpan Monthly' WHERE name LIKE '%Samarpan%' OR (price = 129900 AND duration_days = 30);
UPDATE payment_plans SET name = 'Samarpan Quarterly' WHERE name LIKE '%Samarpan%' OR (price = 324900 && duration_days = 90);

RAISE NOTICE 'Plan names standardization completed. Updated to: drishti (free), sparsh, sangam, samarpan'; 