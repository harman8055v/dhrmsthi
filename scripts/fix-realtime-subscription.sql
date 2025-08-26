-- =====================================================
-- Fix Real-time Subscription Issues for Messaging
-- =====================================================
-- Run this script in your Supabase SQL Editor to fix real-time subscription errors

-- 1. Drop and recreate the real-time publication
-- ================================================
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;

-- Create publication with only necessary tables
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.messages,
  public.matches;

-- 2. Ensure real-time is enabled for messages table
-- ===================================================
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE matches REPLICA IDENTITY FULL;

-- 3. Fix RLS policies that might block real-time
-- ================================================

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view messages from their matches" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view their matches" ON matches;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for messages
CREATE POLICY "Users can view messages from their matches"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can insert messages in their matches"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
)
WITH CHECK (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Create policy for matches
CREATE POLICY "Users can view their matches"
ON matches FOR SELECT
USING (
  user1_id = auth.uid() OR user2_id = auth.uid()
);

-- 4. Grant necessary permissions
-- ===============================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Verify real-time is working
-- ===============================
-- Check if tables are in the publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Check replica identity
SELECT 
  c.relname AS table_name,
  c.relreplident AS replica_identity
FROM pg_class c
WHERE c.relname IN ('messages', 'matches')
AND c.relkind = 'r';

-- 6. Create helper function for debugging real-time issues
-- =========================================================
CREATE OR REPLACE FUNCTION check_realtime_setup()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if publication exists
  RETURN QUERY
  SELECT 
    'Publication exists'::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
      THEN 'PASS'::TEXT ELSE 'FAIL'::TEXT END,
    'supabase_realtime publication '::TEXT || 
    CASE WHEN EXISTS(SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
      THEN 'found' ELSE 'not found' END;

  -- Check if messages table is in publication
  RETURN QUERY
  SELECT 
    'Messages table in publication'::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN 'PASS'::TEXT ELSE 'FAIL'::TEXT END,
    'messages table '::TEXT || 
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN 'is published' ELSE 'not published' END;

  -- Check RLS on messages
  RETURN QUERY
  SELECT 
    'RLS enabled on messages'::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'messages' AND rowsecurity = true
    ) THEN 'PASS'::TEXT ELSE 'FAIL'::TEXT END,
    'Row Level Security is '::TEXT || 
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'messages' AND rowsecurity = true
    ) THEN 'enabled' ELSE 'disabled' END;

  -- Check replica identity
  RETURN QUERY
  SELECT 
    'Replica identity on messages'::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_class 
      WHERE relname = 'messages' AND relreplident = 'f'
    ) THEN 'PASS'::TEXT ELSE 'WARN'::TEXT END,
    'Replica identity is '::TEXT || 
    CASE 
      WHEN EXISTS(SELECT 1 FROM pg_class WHERE relname = 'messages' AND relreplident = 'f') THEN 'FULL'
      WHEN EXISTS(SELECT 1 FROM pg_class WHERE relname = 'messages' AND relreplident = 'd') THEN 'DEFAULT'
      ELSE 'UNKNOWN' 
    END;
END;
$$;

-- Run the check
SELECT * FROM check_realtime_setup();

-- 7. Optional: Force refresh the real-time system
-- ================================================
-- Sometimes you need to notify the real-time system to refresh
-- This creates a dummy record and deletes it to trigger a refresh
DO $$
DECLARE
  dummy_match_id UUID;
BEGIN
  -- Only do this if there are existing matches
  SELECT id INTO dummy_match_id FROM matches LIMIT 1;
  
  IF dummy_match_id IS NOT NULL THEN
    -- Insert and immediately delete a dummy message to trigger real-time refresh
    INSERT INTO messages (match_id, sender_id, content, created_at)
    VALUES (dummy_match_id, auth.uid(), 'realtime_test', NOW())
    ON CONFLICT DO NOTHING;
    
    DELETE FROM messages 
    WHERE content = 'realtime_test' 
    AND sender_id = auth.uid()
    AND created_at >= NOW() - INTERVAL '1 minute';
  END IF;
END;
$$;

-- 8. Create index for real-time performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_messages_realtime 
ON messages(match_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Final message
DO $$
BEGIN
  RAISE NOTICE 'Real-time setup completed. Please check the results above.';
  RAISE NOTICE 'If issues persist, try:';
  RAISE NOTICE '1. Restart your Supabase project';
  RAISE NOTICE '2. Check Supabase dashboard -> Database -> Replication';
  RAISE NOTICE '3. Ensure Realtime is enabled in project settings';
END;
$$;
