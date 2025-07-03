-- Update referral system to handle verification-based rewards
-- This script updates the existing referral system with new reward structure

-- Update the referral completion trigger to only count verified users
CREATE OR REPLACE FUNCTION process_referral_completion() RETURNS TRIGGER AS $$
BEGIN
    -- Only process if user becomes verified
    IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
        -- Update referral status to completed for this user
        UPDATE referrals 
        SET status = 'completed', 
            completed_at = NOW(),
            updated_at = NOW()
        WHERE referred_id = NEW.id 
        AND status = 'pending';
        
        -- Update referrer's successful referral count
        UPDATE users 
        SET referral_count = (
            SELECT COUNT(*) 
            FROM referrals r 
            JOIN users u ON r.referred_id = u.id 
            WHERE r.referrer_id = users.id 
            AND r.status = 'completed' 
            AND u.verification_status = 'verified'
        ),
        updated_at = NOW()
        WHERE id IN (
            SELECT referrer_id 
            FROM referrals 
            WHERE referred_id = NEW.id 
            AND status = 'completed'
        );
        
        -- Check and award rewards based on successful referrals
        DECLARE
            referrer_id UUID;
            successful_count INTEGER;
        BEGIN
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
                
                -- Award Fast Track Verification (4 referrals)
                IF successful_count >= 4 THEN
                    UPDATE users 
                    SET fast_track_verification = TRUE,
                        updated_at = NOW()
                    WHERE id = referrer_id 
                    AND fast_track_verification = FALSE;
                    
                    INSERT INTO refer_rewards (
                        user_id, 
                        reward_type, 
                        referrals_required, 
                        status, 
                        created_at
                    ) VALUES (
                        referrer_id, 
                        'fast_track_verification', 
                        4, 
                        'active', 
                        NOW()
                    ) ON CONFLICT (user_id, reward_type) DO NOTHING;
                END IF;
                
                -- Award Sangam Plan (10 referrals)
                IF successful_count >= 10 THEN
                    INSERT INTO referral_rewards (
                        user_id, 
                        reward_type, 
                        referrals_required, 
                        status, 
                        expires_at,
                        created_at
                    ) VALUES (
                        referrer_id, 
                        'sangam_plan_free', 
                        10, 
                        'active', 
                        NOW() + INTERVAL '30 days',
                        NOW()
                    ) ON CONFLICT (user_id, reward_type) DO NOTHING;
                END IF;
                
                -- Award Samarpan Plan (20 referrals)
                IF successful_count >= 20 THEN
                    INSERT INTO referral_rewards (
                        user_id, 
                        reward_type, 
                        referrals_required, 
                        status, 
                        expires_at,
                        created_at
                    ) VALUES (
                        referrer_id, 
                        'samarpan_plan_free', 
                        20, 
                        'active', 
                        NOW() + INTERVAL '45 days',
                        NOW()
                    ) ON CONFLICT (user_id, reward_type) DO NOTHING;
                END IF;
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS referral_completion_trigger ON users;
CREATE TRIGGER referral_completion_trigger
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION process_referral_completion();

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
        );
        
        -- Update referrer's total referral count
        UPDATE users 
        SET total_referrals = COALESCE(total_referrals, 0) + 1,
            updated_at = NOW()
        WHERE id = referrer_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add total_referrals column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_referrals') THEN
        ALTER TABLE users ADD COLUMN total_referrals INTEGER DEFAULT 0;
    END IF;
    
    -- Add fast_track_verification column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fast_track_verification') THEN
        ALTER TABLE users ADD COLUMN fast_track_verification BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update existing users' referral counts
UPDATE users 
SET total_referrals = (
    SELECT COUNT(*) 
    FROM referrals 
    WHERE referrer_id = users.id
),
referral_count = (
    SELECT COUNT(*) 
    FROM referrals r 
    JOIN users u ON r.referred_id = u.id 
    WHERE r.referrer_id = users.id 
    AND r.status = 'completed' 
    AND u.verification_status = 'verified'
)
WHERE id IN (SELECT DISTINCT referrer_id FROM referrals);
