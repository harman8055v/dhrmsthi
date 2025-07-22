-- Function to decrement daily swipe count when undoing a swipe
CREATE OR REPLACE FUNCTION decrement_daily_swipe(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  -- Update existing daily stats or create if doesn't exist
  INSERT INTO user_daily_stats (user_id, date, swipes_used, superlikes_used, message_highlights_used)
  VALUES (p_user_id, p_date, 0, 0, 0)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    swipes_used = GREATEST(user_daily_stats.swipes_used - 1, 0),
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql; 