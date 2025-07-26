-- FIX MATCHES TABLE RLS FOR last_message_at UPDATES
-- Allow users to update last_message_at when they send messages

-- Check current RLS policies on matches table
SELECT 
  policyname,
  cmd,
  permissive,
  qual as "USING condition",
  with_check as "WITH CHECK condition"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'matches'
ORDER BY cmd;

-- Create or replace UPDATE policy for matches table
DROP POLICY IF EXISTS "Users can update match timestamps" ON matches;

CREATE POLICY "Users can update match timestamps" ON matches
  FOR UPDATE 
  USING (
    -- User must be part of the match
    auth.uid() = user1_id OR auth.uid() = user2_id
  )
  WITH CHECK (
    -- User must still be part of the match after update
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  permissive,
  qual as "USING condition",
  with_check as "WITH CHECK condition"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'matches'
AND cmd = 'UPDATE';

-- Test the policy with a sample update (replace with actual match ID)
-- UPDATE matches SET last_message_at = NOW() WHERE id = 'your-match-id-here'; 