-- FIX RLS POLICY - Remove OLD references that cause errors
-- OLD/NEW are not available in RLS policies, only in triggers

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Secure message read marking" ON messages;

-- Step 2: Create a corrected secure UPDATE policy
-- This policy is secure but doesn't try to use OLD which isn't available in RLS
CREATE POLICY "Secure message read marking" ON messages
  FOR UPDATE 
  USING (
    -- User must be part of the match
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
    -- Only allow updating messages that are not from the current user
    AND messages.sender_id != auth.uid()
    -- Only allow updating unread messages
    AND messages.read_at IS NULL
  )
  WITH CHECK (
    -- User must still be part of the match after update
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
    -- Prevent users from changing core fields by ensuring sender_id is not the current user
    -- (This prevents users from updating messages they sent)
    AND messages.sender_id != auth.uid()
  );

-- Step 3: Add a database trigger for additional security if needed
-- This trigger ensures only read_at can be updated
CREATE OR REPLACE FUNCTION protect_message_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow updates to read_at field
  IF OLD.match_id != NEW.match_id OR 
     OLD.sender_id != NEW.sender_id OR 
     OLD.content != NEW.content OR 
     OLD.created_at != NEW.created_at OR
     OLD.is_highlighted != NEW.is_highlighted THEN
    RAISE EXCEPTION 'Only read_at field can be updated on messages';
  END IF;
  
  -- Ensure read_at can only be set to a timestamp >= created_at
  IF NEW.read_at IS NOT NULL AND NEW.read_at < OLD.created_at THEN
    RAISE EXCEPTION 'read_at cannot be set to a time before message creation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
DROP TRIGGER IF EXISTS protect_message_updates_trigger ON messages;
CREATE TRIGGER protect_message_updates_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION protect_message_updates();

-- Step 4: Verify the policy works
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