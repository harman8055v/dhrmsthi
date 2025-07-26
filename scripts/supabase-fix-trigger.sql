-- Fix Database Trigger - Remove Strict Timestamp Check
DROP TRIGGER IF EXISTS protect_message_updates_trigger ON messages;
DROP FUNCTION IF EXISTS protect_message_updates();

CREATE OR REPLACE FUNCTION protect_message_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.match_id != NEW.match_id OR 
     OLD.sender_id != NEW.sender_id OR 
     OLD.content != NEW.content OR 
     OLD.created_at != NEW.created_at OR
     OLD.is_highlighted != NEW.is_highlighted THEN
    RAISE EXCEPTION 'Only read_at field can be updated on messages';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_message_updates_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION protect_message_updates(); 