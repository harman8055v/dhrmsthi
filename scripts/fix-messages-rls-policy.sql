-- Fix messages table RLS policy to allow marking messages as read
-- Drop the existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update messages in their matches" ON messages;

-- Create a new policy that allows users to update messages in their matches
-- This allows users to mark messages as read (update read_at field)
CREATE POLICY "Users can update messages in their matches" ON messages
  FOR UPDATE USING (
    -- User must be part of the match
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    -- User must be part of the match
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Alternative: More permissive policy specifically for read_at updates
-- Uncomment this if the above doesn't work
/*
DROP POLICY IF EXISTS "Users can update messages in their matches" ON messages;

CREATE POLICY "Users can mark messages as read in their matches" ON messages
  FOR UPDATE USING (
    -- User must be part of the match (can read the conversation)
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );
*/

-- Verify the policy is working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'messages'
AND cmd = 'UPDATE'; 