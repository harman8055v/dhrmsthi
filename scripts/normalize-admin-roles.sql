-- Normalize existing admin roles to be case-consistent
-- This script will standardize all admin roles to lowercase

-- Update Admin to admin
UPDATE users 
SET role = 'admin' 
WHERE role = 'Admin';

-- Update Super_Admin to super_admin
UPDATE users 
SET role = 'super_admin' 
WHERE role IN ('Super_Admin', 'SuperAdmin', 'superadmin');

-- Show updated roles
SELECT id, email, first_name, last_name, role, created_at 
FROM users 
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- Create a function to check admin roles (case-insensitive)
CREATE OR REPLACE FUNCTION is_admin_role(user_role text)
RETURNS boolean AS $$
BEGIN
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN LOWER(user_role) IN ('admin', 'super_admin', 'superadmin');
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT email, role, is_admin_role(role) as is_admin
FROM users 
WHERE role IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
