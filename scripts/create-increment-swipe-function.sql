-- Create a function to increment swipe count efficiently
CREATE OR REPLACE FUNCTION increment_swipe_count(
  p_user_id UUID,
  p_date DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to update existing stats
  UPDATE user_daily_stats
  SET swipes_used = COALESCE(swipes_used, 0) + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND date = p_date;
  
  -- If no rows updated, insert new row
  IF NOT FOUND THEN
    INSERT INTO user_daily_stats (user_id, date, swipes_used, likes_sent, superlikes_sent, created_at, updated_at)
    VALUES (p_user_id, p_date, 1, 1, 0, NOW(), NOW())
    ON CONFLICT (user_id, date) DO UPDATE
    SET swipes_used = COALESCE(user_daily_stats.swipes_used, 0) + 1,
        updated_at = NOW();
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_swipe_count(UUID, DATE) TO authenticated;
