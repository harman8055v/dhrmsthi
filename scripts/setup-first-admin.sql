-- This script helps set up the first admin user
-- Replace 'your-email@example.com' with your actual email address

-- First, let's see what users exist
SELECT id, email, first_name, last_name, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Promote a user to super_admin (replace with your email)
-- SELECT promote_user_to_admin('your-email@example.com', 'super_admin');

-- Verify the promotion worked
-- SELECT id, email, first_name, last_name, role 
-- FROM users 
-- WHERE email = 'your-email@example.com';

-- If you need to create a new admin user account, you can do it manually:
-- (Uncomment and modify the following lines)

/*
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    email_verified,
    onboarding_completed,
    verification_status,
    account_status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin@dharmasaathi.com',  -- Replace with your email
    'Admin',                   -- Replace with your first name
    'User',                    -- Replace with your last name
    'super_admin',
    true,
    true,
    true,
    'verified',
    'premium',
    NOW(),
    NOW()
);
*/
