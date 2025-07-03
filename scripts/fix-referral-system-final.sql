-- Fix Referral System - Handle actual table structure
-- This script works with whatever columns actually exist

DO $$
DECLARE
    referrals_table_exists boolean;
    referred_id_exists boolean;
    referred_user_id_exists boolean;
    verification_status_exists boolean;
BEGIN
    -- Check if referrals table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'referrals'
    ) INTO referrals_table_exists;
    
    IF referrals_table_exists THEN
        -- Check which referred columns exist
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'referrals' AND column_name = 'referred_id'
        ) INTO referred_id_exists;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'referrals' AND column_name = 'referred_user_id'
        ) INTO referred_user_id_exists;
        
        RAISE NOTICE 'Referrals table exists. referred_id: %, referred_user_id: %', referred_id_exists, referred_user_id_exists;
    ELSE
        RAISE NOTICE 'Referrals table does not exist';
    END IF;
    
    -- Check if verification_status exists in users table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verification_status'
    ) INTO verification_status_exists;
    
    RAISE NOTICE 'Users verification_status exists: %', verification_status_exists;
END $$;

-- Create verification_status enum and column if needed
DO $$
BEGIN
    -- Create enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_enum') THEN
        CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected');
        RAISE NOTICE 'Created verification_status_enum';
    END IF;
    
    -- Add verification_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_status') THEN
        ALTER TABLE users ADD COLUMN verification_status verification_status_enum DEFAULT 'pending';
        RAISE NOTICE 'Added verification_status column to users';
        
        -- Set verified status for users with email_verified = true
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
            UPDATE users SET verification_status = 'verified' WHERE email_verified = true;
            RAISE NOTICE 'Updated verification_status based on email_verified';
        END IF;
        
        -- Set verified status for users with account_status = 'active'
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_status') THEN
            UPDATE users SET verification_status = 'verified' WHERE account_status = 'active';
            RAISE NOTICE 'Updated verification_status based on account_status';
        END IF;
    END IF;
END $$;

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL DEFAULT 'super_likes',
    reward_value INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_user_id, reward_type)
);

-- Add missing columns to referrals table if they don't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        -- Add reward_given column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_given') THEN
            ALTER TABLE referrals ADD COLUMN reward_given BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Added reward_given column to referrals';
        END IF;
        
        -- Add reward_amount column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_amount') THEN
            ALTER TABLE referrals ADD COLUMN reward_amount INTEGER DEFAULT 0;
            RAISE NOTICE 'Added reward_amount column to referrals';
        END IF;
    END IF;
END $$;

-- Create function that works with actual table structure
CREATE OR REPLACE FUNCTION get_referral_stats_safe(user_id UUID)
RETURNS TABLE (
    total_referrals INTEGER,
    successful_referrals INTEGER,
    pending_referrals INTEGER,
    total_rewards INTEGER
) AS $$
DECLARE
    has_referred_id boolean;
    has_referred_user_id boolean;
    query_text text;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referred_id'
    ) INTO has_referred_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referred_user_id'
    ) INTO has_referred_user_id;
    
    -- Build query based on available columns
    IF has_referred_id THEN
        query_text := 'SELECT 
            COUNT(*)::INTEGER as total_referrals,
            COUNT(CASE WHEN r.status = ''completed'' THEN 1 END)::INTEGER as successful_referrals,
            COUNT(CASE WHEN r.status = ''pending'' THEN 1 END)::INTEGER as pending_referrals,
            COALESCE(SUM(COALESCE(r.reward_amount, 0)), 0)::INTEGER as total_rewards
        FROM referrals r
        WHERE r.referrer_id = $1';
    ELSIF has_referred_user_id THEN
        query_text := 'SELECT 
            COUNT(*)::INTEGER as total_referrals,
            COUNT(CASE WHEN r.status = ''completed'' THEN 1 END)::INTEGER as successful_referrals,
            COUNT(CASE WHEN r.status = ''pending'' THEN 1 END)::INTEGER as pending_referrals,
            COALESCE(SUM(COALESCE(r.reward_amount, 0)), 0)::INTEGER as total_rewards
        FROM referrals r
        WHERE r.referrer_id = $1';
    ELSE
        -- Return zeros if no referrals table structure is recognized
        RETURN QUERY SELECT 0, 0, 0, 0;
        RETURN;
    END IF;
    
    RETURN QUERY EXECUTE query_text USING user_id;
END;
$$ LANGUAGE plpgsql;

-- Create safe reward processing function
CREATE OR REPLACE FUNCTION process_referral_reward_safe(referrer_uuid UUID, referred_uuid UUID)
RETURNS VOID AS $$
DECLARE
    referrer_plan TEXT;
    reward_amount INTEGER := 1; -- Default reward in super_likes
    has_referred_id boolean;
    has_referred_user_id boolean;
    update_query text;
BEGIN
    -- Get referrer's current plan
    SELECT COALESCE(current_plan, 'drishti') INTO referrer_plan
    FROM users WHERE id = referrer_uuid;
    
    -- Set reward based on plan
    CASE referrer_plan
        WHEN 'samarpan' THEN reward_amount := 5;
        WHEN 'sangam' THEN reward_amount := 3;
        WHEN 'sparsh' THEN reward_amount := 2;
        ELSE reward_amount := 1;
    END CASE;
    
    -- Check which columns exist in referrals table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referred_id'
    ) INTO has_referred_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referred_user_id'
    ) INTO has_referred_user_id;
    
    -- Update referral record based on available columns
    IF has_referred_id THEN
        UPDATE referrals 
        SET 
            reward_given = TRUE,
            reward_amount = reward_amount,
            status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE referrer_id = referrer_uuid 
        AND referred_id = referred_uuid;
    ELSIF has_referred_user_id THEN
        UPDATE referrals 
        SET 
            reward_given = TRUE,
            reward_amount = reward_amount,
            status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE referrer_id = referrer_uuid 
        AND referred_user_id = referred_uuid;
    END IF;
    
    -- Add reward to referrer's account
    UPDATE users 
    SET 
        super_likes = COALESCE(super_likes, 0) + reward_amount,
        updated_at = NOW()
    WHERE id = referrer_uuid;
    
    -- Insert reward record
    INSERT INTO referral_rewards (referrer_id, referred_user_id, reward_type, reward_value, status)
    VALUES (referrer_uuid, referred_uuid, 'super_likes', reward_amount, 'completed')
    ON CONFLICT (referrer_id, referred_user_id, reward_type) DO NOTHING;
    
END;
$$ LANGUAGE plpgsql;

-- Create safe trigger function
CREATE OR REPLACE FUNCTION trigger_referral_reward_safe()
RETURNS TRIGGER AS $$
DECLARE
    has_referred_id boolean;
    has_referred_user_id boolean;
BEGIN
    -- Check if user just got verified
    IF OLD.verification_status != 'verified' AND NEW.verification_status = 'verified' THEN
        -- Check which columns exist
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'referrals' AND column_name = 'referred_id'
        ) INTO has_referred_id;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'referrals' AND column_name = 'referred_user_id'
        ) INTO has_referred_user_id;
        
        -- Process reward based on available columns
        IF has_referred_id THEN
            PERFORM process_referral_reward_safe(r.referrer_id, NEW.id)
            FROM referrals r 
            WHERE r.referred_id = NEW.id AND r.status = 'pending';
        ELSIF has_referred_user_id THEN
            PERFORM process_referral_reward_safe(r.referrer_id, NEW.id)
            FROM referrals r 
            WHERE r.referred_user_id = NEW.id AND r.status = 'pending';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS referral_reward_trigger ON users;
CREATE TRIGGER referral_reward_trigger
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_referral_reward_safe();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to referral_rewards
DROP TRIGGER IF EXISTS update_referral_rewards_updated_at ON referral_rewards;
CREATE TRIGGER update_referral_rewards_updated_at
    BEFORE UPDATE ON referral_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes safely
DO $$
BEGIN
    -- Only create indexes if tables and columns exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referrer_id') THEN
            CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
        END IF;

        -- Create index on referred_user_id if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referred_user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
        END IF;

        -- Create index on referred_id if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referred_id') THEN
            CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_rewards') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_rewards' AND column_name = 'referrer_id') THEN
            CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_status') THEN
        CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
    END IF;
END $$;

COMMIT;
