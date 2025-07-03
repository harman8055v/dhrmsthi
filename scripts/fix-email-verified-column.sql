-- Add the missing email_verified column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add comment explaining the field
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address during onboarding';

-- Update existing users to have email_verified = true if they have email_confirmed_at in auth.users
UPDATE users 
SET email_verified = TRUE 
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email_confirmed_at IS NOT NULL
);
