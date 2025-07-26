-- Enable real-time for matches table to support live conversation updates
-- Add matches table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Verify matches table RLS policies exist for real-time to work
-- Check if policies exist, if not create them
DO $$
BEGIN
    -- Check if SELECT policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'matches' 
        AND policyname = 'Users can view their matches'
    ) THEN
        -- Create the SELECT policy if it doesn't exist
        CREATE POLICY "Users can view their matches" ON matches
          FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
    END IF;

    -- Check if UPDATE policy exists for last_message_at updates
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'matches' 
        AND policyname = 'System can update match timestamps'
    ) THEN
        -- Create the UPDATE policy for last_message_at updates
        CREATE POLICY "System can update match timestamps" ON matches
          FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
    END IF;
END
$$;

-- Verify real-time is working for both tables
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('messages', 'matches')
ORDER BY tablename; 