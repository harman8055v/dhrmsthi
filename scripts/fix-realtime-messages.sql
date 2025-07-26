-- Fix real-time for messages table

-- First, check if messages table is in the realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';

-- Remove if exists and re-add to ensure clean setup
ALTER publication supabase_realtime DROP TABLE IF EXISTS public.messages;
ALTER publication supabase_realtime ADD TABLE public.messages;

-- Also add matches table for completeness
ALTER publication supabase_realtime DROP TABLE IF EXISTS public.matches;
ALTER publication supabase_realtime ADD TABLE public.matches;

-- Verify they were added
SELECT schemaname, tablename, hasinserts, hasupdates, hasdeletes, hastruncates 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename IN ('messages', 'matches');

-- Check current RLS policies on messages table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'messages';

-- Enable RLS if not already enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Ensure proper RLS policy for SELECT (needed for real-time)
DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;
CREATE POLICY "Users can view messages in their matches" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Ensure proper RLS policy for INSERT (needed for real-time)
DROP POLICY IF EXISTS "Users can insert messages in their matches" ON public.messages;
CREATE POLICY "Users can insert messages in their matches" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Ensure proper RLS policy for UPDATE (needed for marking read)
DROP POLICY IF EXISTS "Users can update messages in their matches" ON public.messages;
CREATE POLICY "Users can update messages in their matches" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Final verification
SELECT 'Real-time setup complete' as status; 