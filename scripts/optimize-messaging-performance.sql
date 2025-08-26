-- =====================================================
-- Optimize Messaging Performance with Proper Indexes
-- =====================================================
-- Run this script in your Supabase SQL Editor to dramatically improve messaging performance

-- 1. Optimize messages table indexes
-- ===================================

-- Index for fetching messages by match_id (most common query)
CREATE INDEX IF NOT EXISTS idx_messages_match_id_created_at 
ON messages(match_id, created_at DESC);

-- Index for unread messages queries (filtering by sender and read_at)
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(match_id, sender_id, read_at) 
WHERE read_at IS NULL;

-- Index for marking messages as read
CREATE INDEX IF NOT EXISTS idx_messages_mark_read 
ON messages(match_id, sender_id) 
WHERE read_at IS NULL;

-- Composite index for last message queries
CREATE INDEX IF NOT EXISTS idx_messages_last_message 
ON messages(match_id, created_at DESC) 
INCLUDE (content, sender_id);


-- 2. Optimize matches table indexes
-- ==================================

-- Index for user matches queries (both directions)
CREATE INDEX IF NOT EXISTS idx_matches_user1_id_last_message 
ON matches(user1_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_matches_user2_id_last_message 
ON matches(user2_id, last_message_at DESC NULLS LAST);

-- Composite index for conversation queries
CREATE INDEX IF NOT EXISTS idx_matches_conversation_lookup 
ON matches(user1_id, user2_id, last_message_at DESC);


-- 3. Optimize users table for profile lookups
-- ============================================

-- Index for batch user profile fetches
CREATE INDEX IF NOT EXISTS idx_users_profile_lookup 
ON users(id) 
INCLUDE (first_name, last_name, profile_photo_url, age, bio, city_id, state_id);


-- 4. Analyze tables for query optimizer
-- ======================================
ANALYZE messages;
ANALYZE matches;
ANALYZE users;


-- 5. Create materialized view for conversation stats (optional - for heavy usage)
-- ================================================================================
-- This can be refreshed periodically for even faster conversation list loading

DROP MATERIALIZED VIEW IF EXISTS conversation_stats CASCADE;

CREATE MATERIALIZED VIEW conversation_stats AS
SELECT 
    m.id as match_id,
    m.user1_id,
    m.user2_id,
    m.created_at as match_created_at,
    m.last_message_at,
    latest_msg.content as last_message_text,
    latest_msg.sender_id as last_message_sender,
    latest_msg.created_at as last_message_created,
    COALESCE(unread_counts.unread_count_user1, 0) as unread_count_user1,
    COALESCE(unread_counts.unread_count_user2, 0) as unread_count_user2
FROM matches m
-- Get latest message per match
LEFT JOIN LATERAL (
    SELECT content, sender_id, created_at
    FROM messages
    WHERE match_id = m.id
    ORDER BY created_at DESC
    LIMIT 1
) latest_msg ON true
-- Get unread counts for both users
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) FILTER (WHERE sender_id = m.user1_id AND read_at IS NULL) as unread_count_user2,
        COUNT(*) FILTER (WHERE sender_id = m.user2_id AND read_at IS NULL) as unread_count_user1
    FROM messages
    WHERE match_id = m.id
) unread_counts ON true;

-- Create indexes on the materialized view
CREATE UNIQUE INDEX idx_conversation_stats_match_id ON conversation_stats(match_id);
CREATE INDEX idx_conversation_stats_user1 ON conversation_stats(user1_id, last_message_at DESC);
CREATE INDEX idx_conversation_stats_user2 ON conversation_stats(user2_id, last_message_at DESC);

-- Refresh the materialized view (run this periodically or via trigger)
REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_stats;


-- 6. Create function for efficient conversation fetching
-- =======================================================
-- This function combines all the optimizations for super-fast conversation loading

CREATE OR REPLACE FUNCTION get_user_conversations(
    p_user_id UUID,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    match_id UUID,
    other_user_id UUID,
    created_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    last_message_text TEXT,
    last_message_sender UUID,
    unread_count INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.match_id,
        CASE 
            WHEN cs.user1_id = p_user_id THEN cs.user2_id 
            ELSE cs.user1_id 
        END as other_user_id,
        cs.match_created_at,
        cs.last_message_at,
        cs.last_message_text,
        cs.last_message_sender,
        CASE 
            WHEN cs.user1_id = p_user_id THEN cs.unread_count_user1
            ELSE cs.unread_count_user2
        END as unread_count
    FROM conversation_stats cs
    WHERE cs.user1_id = p_user_id OR cs.user2_id = p_user_id
    ORDER BY cs.last_message_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_conversations TO authenticated;


-- 7. Create trigger to refresh conversation stats on message insert/update
-- =========================================================================
CREATE OR REPLACE FUNCTION refresh_conversation_stats_for_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh only the affected match's stats
    REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_refresh_conversation_stats ON messages;
CREATE TRIGGER trigger_refresh_conversation_stats
AFTER INSERT OR UPDATE OF read_at ON messages
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_conversation_stats_for_match();


-- 8. Performance monitoring queries
-- ==================================
-- Run these to check the effectiveness of the optimizations

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'matches', 'users')
ORDER BY idx_scan DESC;

-- Check table statistics
SELECT 
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'matches', 'users');

-- Check slow queries (requires pg_stat_statements extension)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- SELECT 
--     query,
--     calls,
--     total_exec_time,
--     mean_exec_time,
--     stddev_exec_time,
--     rows
-- FROM pg_stat_statements
-- WHERE query ILIKE '%messages%' OR query ILIKE '%matches%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;


-- 9. Cleanup old/unused indexes (if any exist)
-- =============================================
-- List all indexes to review
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'matches')
ORDER BY tablename, indexname;

-- After review, drop any duplicate or unused indexes manually
-- Example: DROP INDEX IF EXISTS old_index_name;

