-- Fix get_or_create_daily_stats function to use SECURITY DEFINER for proper permissions
-- This allows the function to bypass RLS and work for all users

CREATE OR REPLACE FUNCTION get_or_create_daily_stats(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS user_daily_stats AS $$
DECLARE
  stats user_daily_stats;
BEGIN
  -- Try to get existing stats
  SELECT * INTO stats FROM user_daily_stats WHERE user_id = p_user_id AND date = p_date;
  
  -- If not found, create new record
  IF NOT FOUND THEN
    INSERT INTO user_daily_stats (user_id, date, swipes_used, superlikes_used, message_highlights_used) 
    VALUES (p_user_id, p_date, 0, 0, 0) 
    RETURNING * INTO stats;
  END IF;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the function can be called by authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_daily_stats(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_daily_stats(UUID) TO authenticated;

COMMENT ON FUNCTION get_or_create_daily_stats IS 'Gets or creates daily stats record for a user with proper RLS bypass'; 