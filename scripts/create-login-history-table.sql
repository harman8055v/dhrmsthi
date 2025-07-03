-- Create login_history table to track user logins
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON login_history(login_at);

-- Add last_login_at column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create function to update last_login_at when login_history is inserted
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's last_login_at timestamp
    UPDATE users 
    SET last_login_at = NEW.login_at,
        is_active = true  -- Ensure user is marked as active on login
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_login_at
DROP TRIGGER IF EXISTS trigger_update_last_login ON login_history;
CREATE TRIGGER trigger_update_last_login
    AFTER INSERT ON login_history
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_login();

-- Enable RLS on login_history table
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for login_history (only admins can view all, users can view their own)
CREATE POLICY "Users can view their own login history" ON login_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage login history" ON login_history
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT ON login_history TO authenticated;
GRANT ALL ON login_history TO service_role;
