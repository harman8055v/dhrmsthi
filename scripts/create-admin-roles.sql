-- Create admin roles and permissions system
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '[]'::jsonb,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create admin sessions table for tracking admin logins
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON admin_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = user_uuid 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user admin role
CREATE OR REPLACE FUNCTION get_user_admin_role(user_uuid UUID)
RETURNS TABLE(role VARCHAR, permissions JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT ar.role, ar.permissions
    FROM admin_roles ar
    WHERE ar.user_id = user_uuid 
    AND ar.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on admin tables
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_roles
CREATE POLICY "Admin roles are viewable by admins" ON admin_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.is_active = true
        )
    );

CREATE POLICY "Admin roles are manageable by super admins" ON admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role = 'super_admin' 
            AND ar.is_active = true
        )
    );

-- Create RLS policies for admin_sessions
CREATE POLICY "Admin sessions are viewable by owner" ON admin_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin sessions are manageable by owner" ON admin_sessions
    FOR ALL USING (user_id = auth.uid());

-- Insert a default super admin (replace with your email)
-- You'll need to update this with the actual user ID after creating the admin account
-- INSERT INTO admin_roles (user_id, role, permissions, is_active)
-- VALUES (
--     'YOUR_USER_ID_HERE',
--     'super_admin',
--     '["users:read", "users:write", "users:delete", "admin:manage", "system:manage"]'::jsonb,
--     true
-- );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_roles_updated_at
    BEFORE UPDATE ON admin_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
