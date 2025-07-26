-- Enable real-time for messages table
ALTER publication supabase_realtime ADD TABLE messages;

-- Verify real-time is enabled
SELECT schemaname, tablename, hasinserts, hasupdates, hasdeletes, hastruncates 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';

-- Also enable for matches table (for real-time match updates)
ALTER publication supabase_realtime ADD TABLE matches;

-- Verify matches real-time is enabled  
SELECT schemaname, tablename, hasinserts, hasupdates, hasdeletes, hastruncates 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'matches'; 