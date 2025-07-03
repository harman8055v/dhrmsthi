-- Add privacy_settings column to users table
ALTER TABLE users 
ADD COLUMN privacy_settings JSONB DEFAULT '{
  "profile_visibility": true,
  "show_online_status": true,
  "allow_messages_from_matches_only": false,
  "show_distance": true,
  "show_last_active": true,
  "allow_profile_screenshots": false,
  "show_verification_badge": true,
  "allow_search_by_phone": false
}'::jsonb;

-- Add referral_code column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;

-- Generate referral codes for existing users
UPDATE users 
SET referral_code = 'DHARMA' || LPAD(id::text, 6, '0')
WHERE referral_code IS NULL;
