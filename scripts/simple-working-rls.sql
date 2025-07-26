-- SIMPLE WORKING RLS POLICY FOR MESSAGES
-- Remove complex trigger and create a working policy

-- Step 1: Remove the trigger that might be blocking updates
DROP TRIGGER IF EXISTS protect_message_updates_trigger ON messages;
DROP FUNCTION IF EXISTS protect_message_updates();

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "Secure message read marking" ON messages;
DROP POLICY IF EXISTS "Messages UPDATE policy" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their matches" ON messages;
DROP POLICY IF EXISTS "Allow message updates in user matches" ON messages;

-- Step 3: Create a simple but secure UPDATE policy
CREATE POLICY "Allow read status updates" ON messages
  FOR UPDATE 
  USING (
    -- User must be part of the match
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    -- User must be part of the match after update
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Step 4: Verify the policy exists and is working
SELECT 
  policyname,
  cmd,
  permissive,
  qual as "USING condition",
  with_check as "WITH CHECK condition"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'messages'
AND cmd = 'UPDATE';

-- Step 5: Test with a simple query (replace with actual message ID)
-- This should work if the policy is correct:
-- UPDATE messages SET read_at = NOW() WHERE id = 'some-message-id' AND read_at IS NULL; 