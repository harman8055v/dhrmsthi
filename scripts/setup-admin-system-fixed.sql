-- Comprehensive Admin System Setup (Fixed Version)
-- This script sets up all necessary components for admin authentication

-- 1. Add role column to users table if it doesn't exist
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
        
        RAISE NOTICE 'Added role column to users table';
    END IF;
END $$;

-- 2. Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to users table';
    END IF;
END $$;

-- 3. Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to users table';
    END IF;
END $$;

-- 4. Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to users table';
    END IF;
END $$;

-- 5. Create login_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    login_type VARCHAR(50) DEFAULT 'regular',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for login_history
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at);

-- 6. Function to promote user to admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT, new_role TEXT DEFAULT 'admin')
RETURNS BOOLEAN AS $$
DECLARE
    user_found BOOLEAN := FALSE;
BEGIN
    -- Validate role
    IF new_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role. Must be admin or super_admin';
    END IF;
    
    -- Update user role (handle missing updated_at column)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        UPDATE users 
        SET role = new_role, 
            is_active = true,
            updated_at = NOW()
        WHERE email = user_email;
    ELSE
        UPDATE users 
        SET role = new_role, 
            is_active = true
        WHERE email = user_email;
    END IF;
    
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

-- 7. Function to check if user is admin (case-insensitive)
CREATE OR REPLACE FUNCTION is_admin_role(user_role text)
RETURNS boolean AS $$
BEGIN
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN LOWER(user_role) IN ('admin', 'super_admin', 'superadmin');
END;
$$ LANGUAGE plpgsql;

-- 8. Update RLS policies to include admin access
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON users;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON users;

-- Recreate policies with admin access
CREATE POLICY "Users can view own profile or admins can view all" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND is_admin_role(u.role)
        )
    );

CREATE POLICY "Users can update own profile or admins can update all" ON users
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND is_admin_role(u.role)
        )
    );

-- 9. Show current users (simplified - without created_at to avoid errors)
SELECT 'Current users in database:' as info;
SELECT id, email, first_name, last_name, role 
FROM users 
LIMIT 10;

-- 10. Instructions for creating admin user
SELECT 'To create an admin user, run one of these commands:' as instruction;

-- Option 1: Promote existing user to admin
-- SELECT promote_user_to_admin('your-email@example.com', 'super_admin');

-- Option 2: Create new admin user (uncomment and modify)
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
    account_status
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
    'premium'
);
*/

-- 11. Test the admin role function
SELECT 'Testing admin role function:' as test_info;
SELECT email, role, is_admin_role(role) as is_admin
FROM users 
WHERE role IS NOT NULL
LIMIT 5;

-- 12. Grant necessary permissions
GRANT EXECUTE ON FUNCTION promote_user_to_admin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_role(TEXT) TO authenticated;

-- 13. Enable RLS on login_history
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for login_history
CREATE POLICY "Users can view their own login history" ON login_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage login history" ON login_history
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT ON login_history TO authenticated;
GRANT ALL ON login_history TO service_role;

SELECT 'Admin system setup completed successfully!' as status; 