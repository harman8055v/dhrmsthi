-- Fix can_user_swipe function to use SECURITY DEFINER for proper permissions
-- This allows the function to access user_daily_stats table even with RLS enabled

CREATE OR REPLACE FUNCTION can_user_swipe(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  daily_limit INTEGER;
  stats_record user_daily_stats;
BEGIN
  -- Get user's current plan
  SELECT account_status INTO user_plan FROM users WHERE id = p_user_id;
  
  -- If no user found, return false
  IF user_plan IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Set daily limits based on plan
  CASE user_plan
    WHEN 'sparsh' THEN daily_limit := 20;
    WHEN 'sangam' THEN daily_limit := 50;
    WHEN 'samarpan' THEN daily_limit := -1; -- Unlimited
    ELSE daily_limit := 5; -- Free plan (drishti)
  END CASE;
  
  -- If unlimited, return true
  IF daily_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Get or create today's stats record
  SELECT * INTO stats_record FROM get_or_create_daily_stats(p_user_id, CURRENT_DATE);
  
  -- Check if user has reached their daily limit
  RETURN COALESCE(stats_record.swipes_used, 0) < daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update get_user_swipe_limit function for consistency
CREATE OR REPLACE FUNCTION get_user_swipe_limit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_plan TEXT;
BEGIN
  -- Get user's current plan
  SELECT account_status INTO user_plan FROM users WHERE id = p_user_id;
  
  -- If no user found, return default limit
  IF user_plan IS NULL THEN
    RETURN 5;
  END IF;
  
  CASE user_plan
    WHEN 'sparsh' THEN RETURN 20;
    WHEN 'sangam' THEN RETURN 50;
    WHEN 'samarpan' THEN RETURN -1; -- Unlimited
    ELSE RETURN 5; -- Free plan (drishti)
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the functions can be called by authenticated users
GRANT EXECUTE ON FUNCTION can_user_swipe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_swipe_limit(UUID) TO authenticated;

COMMENT ON FUNCTION can_user_swipe IS 'Checks if a user can perform a swipe based on their plan limits and daily usage';
COMMENT ON FUNCTION get_user_swipe_limit IS 'Returns the daily swipe limit for a user based on their plan'; 