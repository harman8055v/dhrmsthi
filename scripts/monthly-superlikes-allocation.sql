-- Monthly Super Likes allocation system based on account_status
-- This script should be run monthly (via cron job or scheduled task)

-- Function to allocate monthly Super Likes based on plan
CREATE OR REPLACE FUNCTION allocate_monthly_superlikes()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Loop through all active users and allocate Super Likes based on their plan
    FOR user_record IN 
        SELECT id, account_status, super_likes_count 
        FROM users 
        WHERE account_status IN ('drishti', 'sparsh', 'sangam', 'samarpan')
        AND (premium_expires_at IS NULL OR premium_expires_at > NOW())
    LOOP
        -- Allocate Super Likes based on plan
        CASE user_record.account_status
            WHEN 'drishti' THEN
                -- Drishti: 0 Super Likes per month (no allocation)
                NULL;
            WHEN 'sparsh' THEN
                -- Sparsh: 0 Super Likes per month (no allocation)
                NULL;
            WHEN 'sangam' THEN
                -- Sangam: 5 Super Likes per month
                UPDATE users 
                SET super_likes_count = 5,
                    updated_at = NOW()
                WHERE id = user_record.id;
                updated_count := updated_count + 1;
            WHEN 'samarpan' THEN
                -- Samarpan: 15 Super Likes per month
                UPDATE users 
                SET super_likes_count = 15,
                    updated_at = NOW()
                WHERE id = user_record.id;
                updated_count := updated_count + 1;
        END CASE;
    END LOOP;
    
    -- Log the allocation
    INSERT INTO system_logs (event_type, message, created_at)
    VALUES (
        'monthly_superlikes_allocation',
        'Allocated monthly Super Likes to ' || updated_count || ' users',
        NOW()
    );
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to allocate Super Likes for a specific user (useful for plan upgrades)
CREATE OR REPLACE FUNCTION allocate_user_superlikes(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    user_plan TEXT;
BEGIN
    -- Get user's current plan
    SELECT account_status INTO user_plan 
    FROM users 
    WHERE id = p_user_id;
    
    -- Allocate based on plan
    CASE user_plan
        WHEN 'drishti' THEN
            -- Drishti: 0 Super Likes
            UPDATE users SET super_likes_count = 0 WHERE id = p_user_id;
        WHEN 'sparsh' THEN
            -- Sparsh: 0 Super Likes
            UPDATE users SET super_likes_count = 0 WHERE id = p_user_id;
        WHEN 'sangam' THEN
            -- Sangam: 5 Super Likes
            UPDATE users SET super_likes_count = 5 WHERE id = p_user_id;
        WHEN 'samarpan' THEN
            -- Samarpan: 15 Super Likes
            UPDATE users SET super_likes_count = 15 WHERE id = p_user_id;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on system_logs for performance
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Grant permissions
GRANT EXECUTE ON FUNCTION allocate_monthly_superlikes() TO authenticated;
GRANT EXECUTE ON FUNCTION allocate_user_superlikes(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION allocate_monthly_superlikes IS 'Allocates monthly Super Likes to all users based on their account_status. Should be run monthly via cron job.';
COMMENT ON FUNCTION allocate_user_superlikes IS 'Allocates Super Likes for a specific user based on their current plan. Useful for immediate allocation after plan changes.';