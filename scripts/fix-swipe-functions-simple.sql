-- ============================================================================
-- SIMPLIFIED SWIPE FUNCTIONS FIX - Avoiding Dependency Issues
-- ============================================================================

-- Step 1: Create the basic daily stats function first
CREATE OR REPLACE FUNCTION get_or_create_daily_stats(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS user_daily_stats AS $$
DECLARE
  stats user_daily_stats;
BEGIN
  -- Try to get existing stats record
  SELECT * INTO stats 
  FROM user_daily_stats 
  WHERE user_id = p_user_id AND date = p_date;
  
  -- If not found, create new record
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

-- Step 2: Create swipe limit check function (simplified without calling other functions)
CREATE OR REPLACE FUNCTION can_user_swipe(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  daily_limit INTEGER;
  swipes_used INTEGER;
BEGIN
  -- Get user's current plan
  SELECT account_status INTO user_plan 
  FROM users 
  WHERE id = p_user_id;
  
  -- If user not found, deny swipe
  IF user_plan IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Set daily limits based on account_status
  CASE user_plan
    WHEN 'sparsh' THEN daily_limit := 20;
    WHEN 'sangam' THEN daily_limit := 50;
    WHEN 'samarpan' THEN daily_limit := -1; -- Unlimited
    ELSE daily_limit := 5; -- Drishti (free)
  END CASE;
  
  -- If unlimited plan, allow swipe immediately
  IF daily_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Get today's swipe count directly (avoid function call)
  SELECT COALESCE(swipes_used, 0) INTO swipes_used
  FROM user_daily_stats 
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  -- If no record exists, user hasn't swiped today
  IF swipes_used IS NULL THEN
    swipes_used := 0;
  END IF;
  
  -- Check if user has reached their daily limit
  RETURN swipes_used < daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create swipe limit getter function
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
    WHEN 'sparsh' THEN RETURN 20;
    WHEN 'sangam' THEN RETURN 50;
    WHEN 'samarpan' THEN RETURN -1; -- Unlimited
    ELSE RETURN 5; -- Drishti (free)
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create increment function (simplified)
CREATE OR REPLACE FUNCTION increment_daily_swipes(p_user_id UUID, p_action TEXT DEFAULT 'like')
RETURNS user_daily_stats AS $$
DECLARE
  stats user_daily_stats;
BEGIN
  -- First ensure today's record exists
  INSERT INTO user_daily_stats (user_id, date, swipes_used, superlikes_used, message_highlights_used)
  VALUES (p_user_id, CURRENT_DATE, 0, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  -- Update the counts based on action
  IF p_action = 'superlike' THEN
    UPDATE user_daily_stats 
    SET 
      swipes_used = swipes_used + 1,
      superlikes_used = superlikes_used + 1,
      updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE
    RETURNING * INTO stats;
  ELSE
    UPDATE user_daily_stats 
    SET 
      swipes_used = swipes_used + 1,
      updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE
    RETURNING * INTO stats;
  END IF;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_daily_stats TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_swipe TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_swipe_limit TO authenticated;
GRANT EXECUTE ON FUNCTION increment_daily_swipes TO authenticated;

-- ============================================================================
-- This simplified version should work without dependency errors
-- ============================================================================ 