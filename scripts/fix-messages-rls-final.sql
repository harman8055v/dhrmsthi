-- FINAL FIX: Simple RLS policy for messages UPDATE
-- Remove all existing UPDATE policies
DROP POLICY IF EXISTS "Users can update messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read in their matches" ON messages;

-- Create a simple, permissive policy for marking messages as read
CREATE POLICY "Allow message updates in user matches" ON messages
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Alternative: If still not working, temporarily disable RLS for testing
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- To re-enable later if needed:
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY; 