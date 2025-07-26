-- ============================================================================
-- FINAL FIX FOR SWIPE FUNCTIONS - Proper Schema & Permissions
-- ============================================================================
-- This script creates the corrected database functions with proper SECURITY DEFINER
-- permissions and matches the actual table schemas provided.
-- 
-- FIXED: Function call syntax for PostgreSQL composite types

-- Function to get or create daily stats (with proper schema)
CREATE OR REPLACE FUNCTION get_or_create_daily_stats(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS user_daily_stats AS $$
DECLARE
  stats user_daily_stats;
BEGIN
  -- Try to get existing stats record
  SELECT * INTO stats 
  FROM user_daily_stats 
  WHERE user_id = p_user_id AND date = p_date;
  
  -- If not found, create new record with default values
  IF NOT FOUND THEN
    INSERT INTO user_daily_stats (
      user_id, 
      date, 
      swipes_used, 
      superlikes_used, 
      message_highlights_used,
      created_at,
      updated_at
    ) 
    VALUES (
      p_user_id, 
      p_date, 
      0, 
      0, 
      0,
      now(),
      now()
    ) 
    RETURNING * INTO stats;
  END IF;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can swipe (with proper plan limits)
CREATE OR REPLACE FUNCTION can_user_swipe(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  daily_limit INTEGER;
  stats_record user_daily_stats;
BEGIN
  -- Get user's current plan from users table
  SELECT account_status INTO user_plan 
  FROM users 
  WHERE id = p_user_id;
  
  -- If user not found, deny swipe
  IF user_plan IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Set daily limits based on account_status
  CASE user_plan
    WHEN 'sparsh' THEN daily_limit := 20;    -- Sparsh: 20 swipes/day
    WHEN 'sangam' THEN daily_limit := 50;    -- Sangam: 50 swipes/day  
    WHEN 'samarpan' THEN daily_limit := -1;  -- Samarpan: Unlimited
    ELSE daily_limit := 5;                   -- Drishti: 5 swipes/day (free)
  END CASE;
  
  -- If unlimited plan, allow swipe immediately
  IF daily_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Get or create today's stats record
  stats_record := get_or_create_daily_stats(p_user_id, CURRENT_DATE);
  
  -- Check if user has reached their daily limit
  RETURN COALESCE(stats_record.swipes_used, 0) < daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's swipe limit
CREATE OR REPLACE FUNCTION get_user_swipe_limit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_plan TEXT;
BEGIN
  -- Get user's current plan
  SELECT account_status INTO user_plan 
  FROM users 
  WHERE id = p_user_id;
  
  -- If user not found, return free plan limit
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

-- Function to increment daily swipe count
CREATE OR REPLACE FUNCTION increment_daily_swipes(p_user_id UUID, p_action TEXT DEFAULT 'like')
RETURNS user_daily_stats AS $$
DECLARE
  stats user_daily_stats;
  increment_swipes INTEGER := 0;
  increment_superlikes INTEGER := 0;
BEGIN
  -- Determine what to increment based on action
  IF p_action = 'superlike' THEN
    increment_swipes := 1;
    increment_superlikes := 1;
  ELSE
    increment_swipes := 1;
  END IF;
  
  -- Get or create today's stats
  stats := get_or_create_daily_stats(p_user_id, CURRENT_DATE);
  
  -- Update the counts
  UPDATE user_daily_stats 
  SET 
    swipes_used = swipes_used + increment_swipes,
    superlikes_used = superlikes_used + increment_superlikes,
    updated_at = now()
  WHERE user_id = p_user_id AND date = CURRENT_DATE
  RETURNING * INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (after functions are created)
-- Note: PostgreSQL creates multiple signatures for functions with default parameters

-- Grant execute permissions to authenticated users (must be after all functions are created)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Alternative specific grants (in case the above doesn't work)
DO $$
BEGIN
  -- Grant execute on each function individually
  EXECUTE 'GRANT EXECUTE ON FUNCTION get_or_create_daily_stats(UUID, DATE) TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION get_or_create_daily_stats(UUID) TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION can_user_swipe(UUID) TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION get_user_swipe_limit(UUID) TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION increment_daily_swipes(UUID, TEXT) TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION increment_daily_swipes(UUID) TO authenticated';
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors if function signatures don't exist
  RAISE NOTICE 'Some function grants failed - this is expected for default parameter functions';
END $$;

-- Add helpful comments
COMMENT ON FUNCTION get_or_create_daily_stats IS 'Gets or creates daily stats record for a user - bypasses RLS with SECURITY DEFINER';
COMMENT ON FUNCTION can_user_swipe IS 'Checks if user can swipe based on plan limits and daily usage';
COMMENT ON FUNCTION get_user_swipe_limit IS 'Returns daily swipe limit for user based on their plan';
COMMENT ON FUNCTION increment_daily_swipes IS 'Increments daily swipe/superlike counts for a user';

-- ============================================================================
-- EXPECTED PLAN LIMITS AFTER RUNNING THIS SCRIPT:
-- ============================================================================
-- ✅ Drishti (free): 5 swipes per day
-- ✅ Sparsh: 20 swipes per day  
-- ✅ Sangam: 50 swipes per day
-- ✅ Samarpan: Unlimited swipes
-- ✅ Proper daily stats tracking
-- ✅ No more RPC function errors
-- ============================================================================ 