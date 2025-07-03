-- Simple script to create referrals system tables and columns
-- This ensures the referral program page works correctly

DO $$ 
BEGIN
    -- Create referrals table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        CREATE TABLE referrals (
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
        RAISE NOTICE 'Created referrals table';
    ELSE
        RAISE NOTICE 'Referrals table already exists';
    END IF;

    -- Create referral_rewards table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_rewards') THEN
        CREATE TABLE referral_rewards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
            reward_type VARCHAR(50) NOT NULL,
            reward_value TEXT,
            status VARCHAR(20) DEFAULT 'active',
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created referral_rewards table';
    ELSE
        RAISE NOTICE 'Referral_rewards table already exists';
    END IF;

    -- Add referral_code column to users if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') THEN
        ALTER TABLE users ADD COLUMN referral_code VARCHAR(10) UNIQUE;
        RAISE NOTICE 'Added referral_code column to users table';
    END IF;

    -- Add referral_count column to users if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_count') THEN
        ALTER TABLE users ADD COLUMN referral_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added referral_count column to users table';
    END IF;

    -- Add fast_track_verification column to users if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fast_track_verification') THEN
        ALTER TABLE users ADD COLUMN fast_track_verification BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added fast_track_verification column to users table';
    END IF;

    -- Add referrer_id column to referral_rewards if it doesn't exist (for existing tables)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_rewards') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_rewards' AND column_name = 'referrer_id') THEN
            ALTER TABLE referral_rewards ADD COLUMN referrer_id UUID REFERENCES users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added referrer_id column to referral_rewards table';
        END IF;
    END IF;

    -- Create indexes for referrals table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
        CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
        CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
        RAISE NOTICE 'Created indexes for referrals table';
    END IF;

    -- Create indexes for referral_rewards table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_rewards') THEN
        CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
        CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
        
        -- Only create referrer_id index if the column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_rewards' AND column_name = 'referrer_id') THEN
            CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
        END IF;
        
        RAISE NOTICE 'Created indexes for referral_rewards table';
    END IF;
END $$;

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