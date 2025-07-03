-- Create user reports table
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('inappropriate_content', 'harassment', 'fake_profile', 'spam', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reporter_id, reported_id)
);

-- Create blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- Add RLS policies for user_reports
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reports (as reporter)
CREATE POLICY "Users can view their own reports" ON user_reports
    FOR SELECT USING (reporter_id = auth.uid());

-- Users can create reports
CREATE POLICY "Users can create reports" ON user_reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Add RLS policies for blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own blocks (as blocker)
CREATE POLICY "Users can view their own blocks" ON blocked_users
    FOR SELECT USING (blocker_id = auth.uid());

-- Users can create blocks
CREATE POLICY "Users can create blocks" ON blocked_users
    FOR INSERT WITH CHECK (blocker_id = auth.uid());

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete their own blocks" ON blocked_users
    FOR DELETE USING (blocker_id = auth.uid());

-- Create function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_uuid UUID, blocked_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE blocker_id = blocker_uuid AND blocked_id = blocked_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's blocked list
CREATE OR REPLACE FUNCTION get_blocked_users(user_uuid UUID)
RETURNS TABLE(blocked_user_id UUID, blocked_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT blocked_id, created_at
    FROM blocked_users
    WHERE blocker_id = user_uuid
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at on user_reports
CREATE OR REPLACE FUNCTION update_user_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_reports_updated_at
    BEFORE UPDATE ON user_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_user_reports_updated_at();

-- Add some sample data for testing (optional)
-- INSERT INTO user_reports (reporter_id, reported_id, reason, description) VALUES
-- ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'inappropriate_content', 'Inappropriate profile content');

COMMENT ON TABLE user_reports IS 'Stores user reports for inappropriate behavior';
COMMENT ON TABLE blocked_users IS 'Stores blocked user relationships';
COMMENT ON FUNCTION is_user_blocked IS 'Checks if a user is blocked by another user';
COMMENT ON FUNCTION get_blocked_users IS 'Returns list of users blocked by a specific user';
