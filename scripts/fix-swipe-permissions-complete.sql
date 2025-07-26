-- ============================================================================
-- COMPREHENSIVE FIX FOR SWIPE LIMIT ERRORS (Sparsh & Sangam Users)
-- ============================================================================
-- This script fixes the "failed to check swipe limit" error for users with 
-- limited daily swipe allowances by adding proper SECURITY DEFINER permissions
-- to database functions that need to bypass RLS policies.

-- Fix get_or_create_daily_stats function
-- This is the core issue - function needs elevated permissions to read/write user_daily_stats
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

-- Fix can_user_swipe function to use the corrected daily stats function
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
  
  -- Set daily limits based on plan (using consistent plan names)
  CASE user_plan
    WHEN 'sparsh' THEN daily_limit := 20;    -- Sparsh: 20 swipes/day
    WHEN 'sangam' THEN daily_limit := 50;    -- Sangam: 50 swipes/day  
    WHEN 'samarpan' THEN daily_limit := -1;  -- Samarpan: Unlimited
    ELSE daily_limit := 5;                   -- Drishti: 5 swipes/day (free)
  END CASE;
  
  -- If unlimited, return true immediately (no need to check stats)
  IF daily_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Get or create today's stats record (this was failing before)
  SELECT * INTO stats_record FROM get_or_create_daily_stats(p_user_id, CURRENT_DATE);
  
  -- Check if user has reached their daily limit
  RETURN COALESCE(stats_record.swipes_used, 0) < daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_user_swipe_limit function for consistency
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
  
  -- Return limits based on plan
  CASE user_plan
    WHEN 'sparsh' THEN RETURN 20;    -- Sparsh: 20 swipes/day
    WHEN 'sangam' THEN RETURN 50;    -- Sangam: 50 swipes/day
    WHEN 'samarpan' THEN RETURN -1;  -- Samarpan: Unlimited
    ELSE RETURN 5;                   -- Drishti: 5 swipes/day (free)
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_daily_stats(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_daily_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_swipe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_swipe_limit(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_or_create_daily_stats IS 'Gets or creates daily stats record for a user with proper RLS bypass';
COMMENT ON FUNCTION can_user_swipe IS 'Checks if a user can perform a swipe based on their plan limits and daily usage';
COMMENT ON FUNCTION get_user_swipe_limit IS 'Returns the daily swipe limit for a user based on their plan';

-- ============================================================================
-- EXPECTED BEHAVIOR AFTER RUNNING THIS SCRIPT:
-- ============================================================================
-- ✅ Drishti users: 5 swipes per day
-- ✅ Sparsh users: 20 swipes per day  
-- ✅ Sangam users: 50 swipes per day
-- ✅ Samarpan users: Unlimited swipes
-- ✅ No more "failed to check swipe limit" errors
-- ============================================================================ 