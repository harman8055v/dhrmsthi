-- SECURE MESSAGES RLS POLICIES
-- Fix the overly permissive UPDATE policy while maintaining functionality

-- Step 1: Drop the insecure policy
DROP POLICY IF EXISTS "Messages UPDATE policy" ON messages;

-- Step 2: Create a secure UPDATE policy that:
-- 1. Only allows users in the match to update messages
-- 2. Only allows updating read_at field (not content, sender_id, etc.)
-- 3. Restricts which messages can be updated (only unread messages from other user)
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
    -- Same conditions for the updated row
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
    -- Ensure they can't change the core message data
    AND messages.match_id = OLD.match_id
    AND messages.sender_id = OLD.sender_id
    AND messages.content = OLD.content
    AND messages.created_at = OLD.created_at
    -- Only allow setting read_at (and only to a future timestamp)
    AND (messages.read_at IS NULL OR messages.read_at >= OLD.created_at)
  );

-- Step 3: Verify all message policies are secure
SELECT 
  policyname,
  cmd,
  permissive,
  qual as "USING condition",
  with_check as "WITH CHECK condition"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'messages'
ORDER BY cmd, policyname;

-- Step 4: Ensure no dangerous policies exist
-- Check for any overly permissive policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual = 'true' OR with_check = 'true' THEN '⚠️ INSECURE - Allows all access'
    ELSE '✅ Appears secure'
  END as security_status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'messages'
ORDER BY cmd; 