-- Test real-time messaging by manually inserting a message
-- This will help verify if real-time is working

-- First, let's check if we have any matches to test with
SELECT 
  m.id as match_id,
  m.user1_id,
  m.user2_id,
  u1.first_name as user1_name,
  u2.first_name as user2_name
FROM matches m
JOIN users u1 ON m.user1_id = u1.id
JOIN users u2 ON m.user2_id = u2.id
LIMIT 5;

-- Check existing messages in any match
SELECT 
  msg.id,
  msg.match_id,
  msg.sender_id,
  msg.content,
  msg.created_at,
  u.first_name as sender_name
FROM messages msg
JOIN users u ON msg.sender_id = u.id
ORDER BY msg.created_at DESC
LIMIT 10;

-- Test insert a message (replace with actual match_id and user_id)
-- IMPORTANT: Replace the UUIDs below with real ones from your database
/*
INSERT INTO messages (match_id, sender_id, content, created_at)
VALUES (
  'your-match-id-here',  -- Replace with actual match ID
  'your-user-id-here',   -- Replace with actual user ID
  'Test real-time message from SQL',
  NOW()
);
*/

-- Verify the publication includes messages table
SELECT 
  schemaname, 
  tablename, 
  hasinserts, 
  hasupdates, 
  hasdeletes 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'messages';

-- Check if RLS is enabled on messages
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages' 
AND schemaname = 'public'; 