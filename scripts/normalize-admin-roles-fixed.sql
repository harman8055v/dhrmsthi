-- Normalize existing admin roles to be case-consistent (Fixed Version)
-- This script will standardize all admin roles to lowercase

-- Update Admin to admin
UPDATE users 
SET role = 'admin' 
WHERE role = 'Admin';

-- Update Super_Admin to super_admin
UPDATE users 
SET role = 'super_admin' 
WHERE role IN ('Super_Admin', 'SuperAdmin', 'superadmin');

-- Show updated roles (without created_at to avoid errors)
SELECT id, email, first_name, last_name, role
FROM users 
WHERE role IN ('admin', 'super_admin');

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

-- Test the function (without created_at to avoid errors)
SELECT email, role, is_admin_role(role) as is_admin
FROM users 
WHERE role IS NOT NULL
LIMIT 10;

SELECT 'Admin roles normalized successfully!' as status; 