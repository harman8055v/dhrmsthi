-- Update Referral System V5 - Handle missing verification_status column
-- This script safely handles different database states

DO $$
DECLARE
    verification_col_exists boolean;
    account_status_col_exists boolean;
    email_verified_col_exists boolean;
BEGIN
    -- Check if verification_status column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verification_status'
    ) INTO verification_col_exists;
    
    -- Check if account_status column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'account_status'
    ) INTO account_status_col_exists;
    
    -- Check if email_verified column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) INTO email_verified_col_exists;
    
    -- Create verification_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_enum') THEN
        CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected');
    END IF;
    
    -- Add verification_status column if it doesn't exist
    IF NOT verification_col_exists THEN
        ALTER TABLE users ADD COLUMN verification_status verification_status_enum DEFAULT 'pending';
        
        -- Migrate data from existing columns
        IF account_status_col_exists THEN
            UPDATE users SET verification_status = 'verified' WHERE account_status = 'active';
        ELSIF email_verified_col_exists THEN
            UPDATE users SET verification_status = 'verified' WHERE email_verified = true;
        END IF;
    END IF;
END $$;

-- Create referral_rewards table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL,
    reward_value INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id, reward_type)
);

-- Add missing columns to referrals table if they don't exist
DO $$
BEGIN
    -- Add reward_given column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_given') THEN
        ALTER TABLE referrals ADD COLUMN reward_given BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add reward_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_amount') THEN
        ALTER TABLE referrals ADD COLUMN reward_amount INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create or replace function to get referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(user_id UUID)
RETURNS TABLE (
    total_referrals INTEGER,
    successful_referrals INTEGER,
    pending_referrals INTEGER,
    total_rewards INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_referrals,
        COUNT(CASE WHEN r.status = 'completed' THEN 1 END)::INTEGER as successful_referrals,
        COUNT(CASE WHEN r.status = 'pending' THEN 1 END)::INTEGER as pending_referrals,
        COALESCE(SUM(r.reward_amount), 0)::INTEGER as total_rewards
    FROM referrals r
    WHERE r.referrer_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to process referral rewards
CREATE OR REPLACE FUNCTION process_referral_reward(referrer_uuid UUID, referred_uuid UUID)
RETURNS VOID AS $$
DECLARE
    referrer_plan TEXT;
    reward_amount INTEGER := 10; -- Default reward
BEGIN
    -- Get referrer's current plan
    SELECT COALESCE(current_plan, 'drishti') INTO referrer_plan
    FROM users WHERE id = referrer_uuid;
    
    -- Set reward based on plan
    CASE referrer_plan
        WHEN 'samarpan' THEN reward_amount := 50;
        WHEN 'sangam' THEN reward_amount := 30;
        WHEN 'sparsh' THEN reward_amount := 20;
        ELSE reward_amount := 10;
    END CASE;
    
    -- Update referral record
    UPDATE referrals 
    SET 
        reward_given = TRUE,
        reward_amount = reward_amount,
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE referrer_id = referrer_uuid 
    AND (referred_id = referred_uuid OR referred_user_id = referred_uuid);
    
    -- Add reward to referrer's account
    UPDATE users 
    SET 
        super_likes = COALESCE(super_likes, 0) + (reward_amount / 10),
        updated_at = NOW()
    WHERE id = referrer_uuid;
    
    -- Insert reward record
    INSERT INTO referral_rewards (referrer_id, referred_id, reward_type, reward_value, status)
    VALUES (referrer_uuid, referred_uuid, 'super_likes', reward_amount / 10, 'completed')
    ON CONFLICT (referrer_id, referred_id, reward_type) DO NOTHING;
    
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic reward processing
CREATE OR REPLACE FUNCTION trigger_referral_reward()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user just got verified
    IF OLD.verification_status != 'verified' AND NEW.verification_status = 'verified' THEN
        -- Find referral record and process reward
        PERFORM process_referral_reward(r.referrer_id, NEW.id)
        FROM referrals r 
        WHERE (r.referred_id = NEW.id OR r.referred_user_id = NEW.id)
        AND r.status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS referral_reward_trigger ON users;

-- Create the trigger
CREATE TRIGGER referral_reward_trigger
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_referral_reward();

-- Create updated_at trigger for referral_rewards
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);

-- Update existing referral records to handle both column names
DO $$
BEGIN
    -- Update referrals where referred_user_id exists but referred_id is null
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referred_user_id') THEN
        UPDATE referrals 
        SET referred_id = referred_user_id 
        WHERE referred_id IS NULL AND referred_user_id IS NOT NULL;
    END IF;
END $$;

-- Clean up any orphaned referral records
DELETE FROM referrals 
WHERE referrer_id NOT IN (SELECT id FROM users)
OR (referred_id IS NOT NULL AND referred_id NOT IN (SELECT id FROM users))
OR (referred_user_id IS NOT NULL AND referred_user_id NOT IN (SELECT id FROM users));

COMMIT;
