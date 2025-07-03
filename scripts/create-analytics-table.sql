-- Create analytics_events table for tracking user engagement
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    session_id VARCHAR(100),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_timestamp ON analytics_events(event_name, timestamp);

-- Add RLS (Row Level Security) policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy for inserting analytics events (allow all)
CREATE POLICY "Allow analytics event insertion" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Policy for reading analytics events (admin only)
CREATE POLICY "Admin can read analytics events" ON analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.admin_role IN ('super_admin', 'admin')
        )
    );

-- Create a view for analytics summary
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
    event_name,
    COUNT(*) as event_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    DATE_TRUNC('day', timestamp) as event_date,
    MIN(timestamp) as first_occurrence,
    MAX(timestamp) as last_occurrence
FROM analytics_events
GROUP BY event_name, DATE_TRUNC('day', timestamp)
ORDER BY event_date DESC, event_count DESC;

-- Create a view for button click analytics
CREATE OR REPLACE VIEW button_click_analytics AS
SELECT 
    properties->>'button_name' as button_name,
    properties->>'location' as location,
    COUNT(*) as click_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    DATE_TRUNC('day', timestamp) as click_date
FROM analytics_events
WHERE event_name = 'button_click'
    AND properties->>'button_name' IS NOT NULL
GROUP BY properties->>'button_name', properties->>'location', DATE_TRUNC('day', timestamp)
ORDER BY click_date DESC, click_count DESC;

-- Create a function to get popular pages
CREATE OR REPLACE FUNCTION get_popular_pages(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    page VARCHAR,
    view_count BIGINT,
    unique_sessions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (properties->>'page')::VARCHAR as page,
        COUNT(*) as view_count,
        COUNT(DISTINCT session_id) as unique_sessions
    FROM analytics_events
    WHERE event_name = 'page_view'
        AND timestamp >= NOW() - INTERVAL '1 day' * days_back
        AND properties->>'page' IS NOT NULL
    GROUP BY properties->>'page'
    ORDER BY view_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get engagement metrics
CREATE OR REPLACE FUNCTION get_engagement_metrics(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    metric_name VARCHAR,
    metric_value BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'total_events'::VARCHAR, COUNT(*)::BIGINT FROM analytics_events 
    WHERE timestamp >= NOW() - INTERVAL '1 day' * days_back
    
    UNION ALL
    
    SELECT 'unique_sessions'::VARCHAR, COUNT(DISTINCT session_id)::BIGINT FROM analytics_events 
    WHERE timestamp >= NOW() - INTERVAL '1 day' * days_back
    
    UNION ALL
    
    SELECT 'button_clicks'::VARCHAR, COUNT(*)::BIGINT FROM analytics_events 
    WHERE event_name = 'button_click' AND timestamp >= NOW() - INTERVAL '1 day' * days_back
    
    UNION ALL
    
    SELECT 'page_views'::VARCHAR, COUNT(*)::BIGINT FROM analytics_events 
    WHERE event_name = 'page_view' AND timestamp >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;
