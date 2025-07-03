-- Create admin functions (Fixed for Supabase)
CREATE OR REPLACE FUNCTION is_admin_role(user_role text)
RETURNS boolean AS $$
BEGIN
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN LOWER(user_role) IN ('admin', 'super_admin', 'superadmin');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT, new_role TEXT DEFAULT 'admin')
RETURNS BOOLEAN AS $$
DECLARE
    user_found BOOLEAN := FALSE;
BEGIN
    IF new_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role. Must be admin or super_admin';
    END IF;
    
    UPDATE users 
    SET role = new_role, 
        is_active = true,
        updated_at = NOW()
    WHERE email = user_email;
    
    -- Check if any rows were affected
    IF FOUND THEN
        user_found := TRUE;
        RAISE NOTICE 'User % promoted to %', user_email, new_role;
    ELSE
        user_found := FALSE;
        RAISE NOTICE 'User with email % not found', user_email;
    END IF;
    
    RETURN user_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION promote_user_to_admin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_role(TEXT) TO authenticated;

SELECT 'Admin functions created successfully!' as status; 