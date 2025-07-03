-- Production-Ready Referral System Setup
-- This script sets up the complete referral system for DharmaSaathi
-- Run this script to enable referral tracking in production

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's ensure all necessary columns exist in the users table
DO $$ 
BEGIN
    -- Add referral_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') THEN
        ALTER TABLE users ADD COLUMN referral_code VARCHAR(10) UNIQUE;
        RAISE NOTICE 'Added referral_code column to users table';
    END IF;
    
    -- Add referral_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_count') THEN
        ALTER TABLE users ADD COLUMN referral_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added referral_count column to users table';
    END IF;
    
    -- Add total_referrals column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_referrals') THEN
        ALTER TABLE users ADD COLUMN total_referrals INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_referrals column to users table';
    END IF;
    
    -- Add fast_track_verification column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fast_track_verification') THEN
        ALTER TABLE users ADD COLUMN fast_track_verification BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added fast_track_verification column to users table';
    END IF;
END $$;

-- Create referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
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
    referrals_required INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, reward_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);

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

-- Function to handle new user signup with referral code
CREATE OR REPLACE FUNCTION handle_referral_signup(
    new_user_id UUID,
    referral_code TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    referrer_id UUID;
BEGIN
    -- Find referrer by referral code
    SELECT id INTO referrer_id 
    FROM users 
    WHERE users.referral_code = handle_referral_signup.referral_code 
    AND id != new_user_id;
    
    IF referrer_id IS NOT NULL THEN
        -- Create referral record
        INSERT INTO referrals (
            referrer_id,
            referred_id,
            referral_code,
            status,
            created_at
        ) VALUES (
            referrer_id,
            new_user_id,
            handle_referral_signup.referral_code,
            'pending',
            NOW()
        ) ON CONFLICT (referrer_id, referred_id) DO NOTHING;
        
        -- Update referrer's total referral count
        UPDATE users 
        SET total_referrals = COALESCE(total_referrals, 0) + 1,
            updated_at = NOW()
        WHERE id = referrer_id;
        
        RAISE NOTICE 'Referral created: User % referred by % with code %', new_user_id, referrer_id, referral_code;
        RETURN TRUE;
    END IF;
    
    RAISE NOTICE 'Referral code % not found or invalid', referral_code;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to process referral completion when user gets verified
CREATE OR REPLACE FUNCTION process_referral_completion() RETURNS TRIGGER AS $$
DECLARE
    referrer_id UUID;
    successful_count INTEGER;
BEGIN
    -- Only process if user becomes verified
    IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
        
        -- Update referral status to completed for this user
        UPDATE referrals 
        SET status = 'completed', 
            completed_at = NOW(),
            updated_at = NOW()
        WHERE referred_id = NEW.id 
        AND status = 'pending';
        
        -- Get referrer info
        SELECT r.referrer_id INTO referrer_id
        FROM referrals r 
        WHERE r.referred_id = NEW.id 
        AND r.status = 'completed'
        LIMIT 1;
        
        IF referrer_id IS NOT NULL THEN
            -- Get current successful referral count
            SELECT COUNT(*) INTO successful_count
            FROM referrals r 
            JOIN users u ON r.referred_id = u.id 
            WHERE r.referrer_id = referrer_id 
            AND r.status = 'completed' 
            AND u.verification_status = 'verified';
            
            -- Update referrer's successful referral count
            UPDATE users 
            SET referral_count = successful_count,
                updated_at = NOW()
            WHERE id = referrer_id;
            
            -- Award Fast Track Verification (4 referrals)
            IF successful_count >= 4 AND successful_count < 10 THEN
                UPDATE users 
                SET fast_track_verification = TRUE,
                    updated_at = NOW()
                WHERE id = referrer_id 
                AND fast_track_verification = FALSE;
                
                INSERT INTO referral_rewards (
                    user_id, 
                    reward_type, 
                    reward_value,
                    referrals_required,
                    status, 
                    created_at
                ) VALUES (
                    referrer_id, 
                    'fast_track_verification', 
                    'Priority verification processing',
                    4,
                    'active', 
                    NOW()
                ) ON CONFLICT (user_id, reward_type) DO NOTHING;
                
                RAISE NOTICE 'Fast track verification awarded to user %', referrer_id;
            END IF;
            
            -- Award Sangam Plan (10 referrals)
            IF successful_count >= 10 AND successful_count < 20 THEN
                INSERT INTO referral_rewards (
                    user_id, 
                    reward_type, 
                    reward_value,
                    referrals_required,
                    status, 
                    expires_at,
                    created_at
                ) VALUES (
                    referrer_id, 
                    'sangam_plan_free', 
                    '30 days free Sangam plan access',
                    10,
                    'active', 
                    NOW() + INTERVAL '90 days',
                    NOW()
                ) ON CONFLICT (user_id, reward_type) DO NOTHING;
                
                RAISE NOTICE 'Sangam plan reward awarded to user %', referrer_id;
            END IF;
            
            -- Award Samarpan Plan (20 referrals)
            IF successful_count >= 20 THEN
                INSERT INTO referral_rewards (
                    user_id, 
                    reward_type, 
                    reward_value,
                    referrals_required,
                    status, 
                    expires_at,
                    created_at
                ) VALUES (
                    referrer_id, 
                    'samarpan_plan_free', 
                    '45 days free Samarpan plan access',
                    20,
                    'active', 
                    NOW() + INTERVAL '120 days',
                    NOW()
                ) ON CONFLICT (user_id, reward_type) DO NOTHING;
                
                RAISE NOTICE 'Samarpan plan reward awarded to user %', referrer_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger for verification completion
DROP TRIGGER IF EXISTS referral_completion_trigger ON users;
CREATE TRIGGER referral_completion_trigger
    AFTER UPDATE OF verification_status ON users
    FOR EACH ROW
    EXECUTE FUNCTION process_referral_completion();

-- Generate referral codes for existing users who don't have one
UPDATE users 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- Update existing users' referral counts from actual data
UPDATE users 
SET total_referrals = COALESCE((
    SELECT COUNT(*) 
    FROM referrals 
    WHERE referrer_id = users.id
), 0),
referral_count = COALESCE((
    SELECT COUNT(*) 
    FROM referrals r 
    JOIN users u ON r.referred_id = u.id 
    WHERE r.referrer_id = users.id 
    AND r.status = 'completed' 
    AND u.verification_status = 'verified'
), 0)
WHERE EXISTS (SELECT 1 FROM referrals WHERE referrer_id = users.id);

-- Clean up any orphaned referral records
DELETE FROM referrals 
WHERE referrer_id NOT IN (SELECT id FROM users)
OR referred_id NOT IN (SELECT id FROM users);

-- Create a view for easy referral analytics
CREATE OR REPLACE VIEW referral_analytics AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.referral_code,
    u.total_referrals,
    u.referral_count as successful_referrals,
    u.fast_track_verification,
    u.verification_status,
    COUNT(rr.id) as active_rewards
FROM users u
LEFT JOIN referral_rewards rr ON u.id = rr.user_id AND rr.status = 'active'
WHERE u.total_referrals > 0 OR u.referral_count > 0
GROUP BY u.id, u.first_name, u.last_name, u.email, u.referral_code, 
         u.total_referrals, u.referral_count, u.fast_track_verification, u.verification_status
ORDER BY u.referral_count DESC, u.total_referrals DESC;

-- Grant necessary permissions (adjust as needed for your setup)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON referral_rewards TO authenticated;
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT EXECUTE ON FUNCTION handle_referral_signup(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code() TO authenticated;

-- Final verification
DO $$
DECLARE
    ref_table_exists BOOLEAN;
    rewards_table_exists BOOLEAN;
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') INTO ref_table_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_rewards') INTO rewards_table_exists;
    
    -- Check if function exists
    SELECT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_referral_signup') INTO function_exists;
    
    -- Check if trigger exists
    SELECT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'referral_completion_trigger') INTO trigger_exists;
    
    RAISE NOTICE '=== REFERRAL SYSTEM SETUP COMPLETE ===';
    RAISE NOTICE 'Referrals table: %', CASE WHEN ref_table_exists THEN '✓ Created' ELSE '✗ Missing' END;
    RAISE NOTICE 'Referral rewards table: %', CASE WHEN rewards_table_exists THEN '✓ Created' ELSE '✗ Missing' END;
    RAISE NOTICE 'Signup function: %', CASE WHEN function_exists THEN '✓ Created' ELSE '✗ Missing' END;
    RAISE NOTICE 'Completion trigger: %', CASE WHEN trigger_exists THEN '✓ Created' ELSE '✗ Missing' END;
    RAISE NOTICE '========================================';
    
    IF ref_table_exists AND rewards_table_exists AND function_exists AND trigger_exists THEN
        RAISE NOTICE 'SUCCESS: Referral system is ready for production!';
    ELSE
        RAISE WARNING 'Some components are missing. Please review the script execution.';
    END IF;
END $$; 