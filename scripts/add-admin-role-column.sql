-- Add role column to users table if it doesn't exist
DO $$ 
BEGIN
    -- Check if role column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        
        -- Add constraint to ensure valid roles
        ALTER TABLE users ADD CONSTRAINT check_user_role 
        CHECK (role IN ('user', 'admin', 'super_admin'));
    END IF;
END $$;

-- Update RLS policies to include role-based access
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Recreate policies with admin access
CREATE POLICY "Users can view own profile or admins can view all" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can update own profile or admins can update all" ON users
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Allow admins to insert new users
CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Function to promote user to admin (for initial setup)
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT, new_role TEXT DEFAULT 'admin')
RETURNS BOOLEAN AS $$
DECLARE
    user_found BOOLEAN := FALSE;
BEGIN
    -- Validate role
    IF new_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role. Must be admin or super_admin';
    END IF;
    
    -- Update user role
    UPDATE users 
    SET role = new_role, updated_at = NOW()
    WHERE email = user_email;
    
    GET DIAGNOSTICS user_found = FOUND;
    
    IF user_found THEN
        RAISE NOTICE 'User % promoted to %', user_email, new_role;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'User with email % not found', user_email;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for initial setup only)
GRANT EXECUTE ON FUNCTION promote_user_to_admin(TEXT, TEXT) TO authenticated;
