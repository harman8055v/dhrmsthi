-- Fix Matches Table RLS - Allow last_message_at Updates
DROP POLICY IF EXISTS "Users can update match timestamps" ON matches;

CREATE POLICY "Users can update match timestamps" ON matches
  FOR UPDATE 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id); 