-- Create referral system tables and columns
-- This script safely adds all necessary components for the referral program

-- First, let's add the missing columns to the users table
DO $$ 
BEGIN
    -- Add referral_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') THEN
        ALTER TABLE users ADD COLUMN referral_code VARCHAR(10) UNIQUE;
    END IF;
    
    -- Add referral_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_count') THEN
        ALTER TABLE users ADD COLUMN referral_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add fast_track_verification column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fast_track_verification') THEN
        ALTER TABLE users ADD COLUMN fast_track_verification BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add referred_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referred_by') THEN
        ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id);
    END IF;
END $$;

-- Create referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- Create referral_rewards table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL,
    reward_value TEXT,
    status VARCHAR(20) DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE
);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS VARCHAR(10) AS $$
DECLARE
    code VARCHAR(10);
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character code
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;
        
        -- If it doesn't exist, we can use it
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate referral codes for existing users who don't have one
UPDATE users 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- Function to process referral completion
CREATE OR REPLACE FUNCTION process_referral_completion() RETURNS TRIGGER AS $$
BEGIN
    -- Update referral status to completed
    UPDATE referrals 
    SET status = 'completed', 
        completed_at = NOW(),
        updated_at = NOW()
    WHERE referred_id = NEW.id 
    AND status = 'pending';
    
    -- Update referrer's count
    UPDATE users 
    SET referral_count = referral_count + 1,
        updated_at = NOW()
    WHERE id = (
        SELECT referrer_id 
        FROM referrals 
        WHERE referred_id = NEW.id 
        AND status = 'completed'
    );
    
    -- Check if referrer has reached 4 referrals for rewards
    INSERT INTO referral_rewards (user_id, reward_type, reward_value, expires_at)
    SELECT 
        u.id,
        'fast_track_verification',
        'Priority verification processing',
        NULL
    FROM users u
    WHERE u.referral_count >= 4 
    AND u.fast_track_verification = FALSE
    AND u.id = (
        SELECT referrer_id 
        FROM referrals 
        WHERE referred_id = NEW.id 
        AND status = 'completed'
    )
    ON CONFLICT DO NOTHING;
    
    -- Add Sangam Plan reward
    INSERT INTO referral_rewards (user_id, reward_type, reward_value, expires_at)
    SELECT 
        u.id,
        'sangam_plan_free',
        '14 days free premium access',
        NOW() + INTERVAL '14 days'
    FROM users u
    WHERE u.referral_count >= 4 
    AND u.id = (
        SELECT referrer_id 
        FROM referrals 
        WHERE referred_id = NEW.id 
        AND status = 'completed'
    )
    AND NOT EXISTS (
        SELECT 1 FROM referral_rewards 
        WHERE user_id = u.id 
        AND reward_type = 'sangam_plan_free' 
        AND status = 'active'
    )
    ON CONFLICT DO NOTHING;
    
    -- Update fast_track_verification flag
    UPDATE users 
    SET fast_track_verification = TRUE,
        updated_at = NOW()
    WHERE referral_count >= 4 
    AND fast_track_verification = FALSE
    AND id = (
        SELECT referrer_id 
        FROM referrals 
        WHERE referred_id = NEW.id 
        AND status = 'completed'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for referral completion (only if user completes onboarding)
DROP TRIGGER IF EXISTS referral_completion_trigger ON users;
CREATE TRIGGER referral_completion_trigger
    AFTER UPDATE OF onboarding_completed ON users
    FOR EACH ROW
    WHEN (NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE)
    EXECUTE FUNCTION process_referral_completion();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_type ON referral_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Insert some sample data for testing (optional)
-- This creates a referral relationship for testing purposes
DO $$
DECLARE
    test_referrer_id UUID;
    test_referred_id UUID;
BEGIN
    -- Only insert test data if we have users and no existing referrals
    IF EXISTS (SELECT 1 FROM users LIMIT 2) AND NOT EXISTS (SELECT 1 FROM referrals LIMIT 1) THEN
        -- Get two different user IDs for testing
        SELECT id INTO test_referrer_id FROM users ORDER BY created_at LIMIT 1;
        SELECT id INTO test_referred_id FROM users WHERE id != test_referrer_id ORDER BY created_at LIMIT 1;
        
        -- Create a test referral if we have two different users
        IF test_referrer_id IS NOT NULL AND test_referred_id IS NOT NULL THEN
            INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
            VALUES (
                test_referrer_id,
                test_referred_id,
                (SELECT referral_code FROM users WHERE id = test_referrer_id),
                'completed'
            )
            ON CONFLICT DO NOTHING;
            
            -- Update the referrer's count
            UPDATE users SET referral_count = 1 WHERE id = test_referrer_id;
        END IF;
    END IF;
END $$;
