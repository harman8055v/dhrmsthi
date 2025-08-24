-- Script to fix messaging real-time issues
-- Run this in your Supabase SQL Editor

-- 1. Check if real-time is enabled for messages table
SELECT 
    schemaname, 
    tablename, 
    hasinserts, 
    hasupdates, 
    hasdeletes 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('messages', 'matches');

-- 2. Enable real-time if not already enabled
DO $$
BEGIN
    -- Enable for messages table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
        RAISE NOTICE 'Enabled real-time for messages table';
    ELSE
        RAISE NOTICE 'Real-time already enabled for messages table';
    END IF;

    -- Enable for matches table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'matches'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE matches;
        RAISE NOTICE 'Enabled real-time for matches table';
    ELSE
        RAISE NOTICE 'Real-time already enabled for matches table';
    END IF;
END $$;

-- 3. Verify RLS policies are not blocking real-time
-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('messages', 'matches');

-- 4. List all policies on messages table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- 5. Create a more permissive SELECT policy for real-time (if needed)
-- This ensures users can see messages in their matches via real-time
DROP POLICY IF EXISTS "Users can view messages in their matches via realtime" ON messages;

CREATE POLICY "Users can view messages in their matches via realtime" ON messages
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = messages.match_id 
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
        )
    );

-- 6. Test real-time by inserting a test message (optional - replace with your actual IDs)
-- INSERT INTO messages (match_id, sender_id, content, created_at)
-- VALUES ('your-match-id', 'your-user-id', 'Test real-time message', NOW());

-- 7. Verify the notification_jobs table is working
SELECT 
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_jobs,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_jobs,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs
FROM notification_jobs
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 8. Check recent notification jobs for messages
SELECT 
    id,
    type,
    status,
    scheduled_at,
    created_at,
    updated_at,
    payload
FROM notification_jobs
WHERE type = 'message'
ORDER BY created_at DESC
LIMIT 10;

NOTIFY pgrst, 'reload schema';
