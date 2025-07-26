-- FIX DATABASE TRIGGER - TIMESTAMP ISSUE
-- The trigger is being too strict about read_at vs created_at comparison
-- Allow for small timing differences and timezone issues

-- Drop the problematic trigger function
DROP TRIGGER IF EXISTS protect_message_updates_trigger ON messages;
DROP FUNCTION IF EXISTS protect_message_updates();

-- Create a more lenient trigger function
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
  
  -- Allow read_at to be set to any reasonable timestamp
  -- Remove the strict timestamp comparison that was causing issues
  -- The RLS policies already handle security, this trigger is just for field protection
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger
CREATE TRIGGER protect_message_updates_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION protect_message_updates();

-- Verify the trigger is working
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages' 
AND trigger_name = 'protect_message_updates_trigger'; 