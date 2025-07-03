-- Create referral system tables
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_email VARCHAR(255),
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('fast_verification', 'premium_days', 'profile_boost')),
  reward_value INTEGER NOT NULL, -- days for premium, boost points for profile
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'used', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add referral tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fast_track_verification BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  code VARCHAR(20);
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code with letters and numbers
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral count and rewards
CREATE OR REPLACE FUNCTION process_referral_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if user just completed onboarding
  IF OLD.onboarding_completed = FALSE AND NEW.onboarding_completed = TRUE AND NEW.referred_by IS NOT NULL THEN
    -- Update referrer's referral count
    UPDATE users 
    SET referral_count = referral_count + 1,
        updated_at = NOW()
    WHERE id = NEW.referred_by;
    
    -- Mark referral as completed
    UPDATE referrals 
    SET status = 'completed',
        completed_at = NOW(),
        referred_user_id = NEW.id,
        updated_at = NOW()
    WHERE referrer_id = NEW.referred_by 
      AND (referred_email = NEW.email OR referred_user_id = NEW.id)
      AND status = 'pending';
    
    -- Check if referrer has reached 4 referrals for rewards
    DECLARE
      referrer_count INTEGER;
    BEGIN
      SELECT referral_count INTO referrer_count 
      FROM users 
      WHERE id = NEW.referred_by;
      
      IF referrer_count >= 4 THEN
        -- Enable fast track verification
        UPDATE users 
        SET fast_track_verification = TRUE,
            updated_at = NOW()
        WHERE id = NEW.referred_by;
        
        -- Add premium reward (14 days)
        INSERT INTO referral_rewards (user_id, reward_type, reward_value, expires_at)
        VALUES (NEW.referred_by, 'premium_days', 14, NOW() + INTERVAL '90 days')
        ON CONFLICT DO NOTHING;
        
        -- Add verification boost reward
        INSERT INTO referral_rewards (user_id, reward_type, reward_value, expires_at)
        VALUES (NEW.referred_by, 'fast_verification', 1, NOW() + INTERVAL '30 days')
        ON CONFLICT DO NOTHING;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for referral completion
DROP TRIGGER IF EXISTS trigger_referral_completion ON users;
CREATE TRIGGER trigger_referral_completion
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION process_referral_completion();

-- Generate referral codes for existing users
UPDATE users 
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;
