-- Ensure the users table has proper constraints
-- The email field should allow updates but require a value on insert

-- First, let's check if we need to update the email constraint
-- If email is currently NOT NULL, we'll keep it that way but ensure it's populated

-- Update any existing records that might have null emails
UPDATE users 
SET email = COALESCE(email, 'placeholder@example.com') 
WHERE email IS NULL;

-- Ensure email is NOT NULL (this should already be the case)
ALTER TABLE users 
ALTER COLUMN email SET NOT NULL;

-- Add a comment to document the constraint
COMMENT ON COLUMN users.email IS 'User email address - required field, populated from auth.users';
