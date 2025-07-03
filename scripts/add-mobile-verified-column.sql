-- Add mobile_verified column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT FALSE;

-- Update mobile_verified for existing users who have phone_confirmed_at in auth.users
UPDATE users 
SET mobile_verified = TRUE 
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE phone_confirmed_at IS NOT NULL
);

-- Add comment for documentation
COMMENT ON COLUMN users.mobile_verified IS 'Indicates if the user has verified their mobile number via OTP';
