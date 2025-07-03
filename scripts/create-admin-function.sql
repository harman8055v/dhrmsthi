-- Create the missing is_admin_role function
CREATE OR REPLACE FUNCTION is_admin_role(user_role text)
RETURNS boolean AS $$
BEGIN
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN LOWER(user_role) IN ('admin', 'super_admin', 'superadmin');
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin_role(TEXT) TO authenticated;

-- Test the function
SELECT 'Testing admin role function:' as test_info;
SELECT email, role, is_admin_role(role) as is_admin
FROM users 
WHERE role IS NOT NULL
LIMIT 5;

SELECT 'Admin function created successfully!' as status; 