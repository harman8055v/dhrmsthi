-- Create table to track daily swipes and premium feature usage
CREATE TABLE IF NOT EXISTS user_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  swipes_used INTEGER DEFAULT 0,
  superlikes_used INTEGER DEFAULT 0,
  message_highlights_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create table to track all swipe actions
CREATE TABLE IF NOT EXISTS swipe_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('like', 'dislike', 'superlike')),
  is_match BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

-- Create table to track matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- Create table for messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_highlighted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE user_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_daily_stats
DROP POLICY IF EXISTS "Users can view their own daily stats" ON user_daily_stats;
CREATE POLICY "Users can view their own daily stats" ON user_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily stats" ON user_daily_stats;
CREATE POLICY "Users can insert their own daily stats" ON user_daily_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own daily stats" ON user_daily_stats;
CREATE POLICY "Users can update their own daily stats" ON user_daily_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for swipe_actions
DROP POLICY IF EXISTS "Users can view their swipe actions" ON swipe_actions;
CREATE POLICY "Users can view their swipe actions" ON swipe_actions
  FOR SELECT USING (auth.uid() = swiper_id OR auth.uid() = swiped_id);

DROP POLICY IF EXISTS "Users can insert their swipe actions" ON swipe_actions;
CREATE POLICY "Users can insert their swipe actions" ON swipe_actions
  FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- RLS Policies for matches
DROP POLICY IF EXISTS "Users can view their matches" ON matches;
CREATE POLICY "Users can view their matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "System can insert matches" ON matches;
CREATE POLICY "System can insert matches" ON matches
  FOR INSERT WITH CHECK (true);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their matches" ON messages;
CREATE POLICY "Users can insert messages in their matches" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Indexes for performance
CREATE INDEX idx_user_daily_stats_user_date ON user_daily_stats(user_id, date);
CREATE INDEX idx_swipe_actions_swiper ON swipe_actions(swiper_id);
CREATE INDEX idx_swipe_actions_swiped ON swipe_actions(swiped_id);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Function to get or create daily stats
CREATE OR REPLACE FUNCTION get_or_create_daily_stats(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS user_daily_stats AS $$
DECLARE
  stats user_daily_stats;
BEGIN
  SELECT * INTO stats FROM user_daily_stats WHERE user_id = p_user_id AND date = p_date;
  
  IF NOT FOUND THEN
    INSERT INTO user_daily_stats (user_id, date) VALUES (p_user_id, p_date) RETURNING * INTO stats;
  END IF;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to check if users can swipe
CREATE OR REPLACE FUNCTION can_user_swipe(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  daily_limit INTEGER;
  swipes_used INTEGER;
BEGIN
  -- Get user's current plan
  SELECT account_status INTO user_plan FROM users WHERE id = p_user_id;
  
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
  
  -- Get today's swipe count
  SELECT COALESCE(swipes_used, 0) INTO swipes_used 
  FROM user_daily_stats 
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  RETURN swipes_used < daily_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's swipe limit
CREATE OR REPLACE FUNCTION get_user_swipe_limit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_plan TEXT;
BEGIN
  SELECT account_status INTO user_plan FROM users WHERE id = p_user_id;
  
  CASE user_plan
    WHEN 'sparsh' THEN RETURN 20;
    WHEN 'sangam' THEN RETURN 50;
    WHEN 'samarpan' THEN RETURN -1; -- Unlimited
    ELSE RETURN 5; -- Free plan (drishti)
  END CASE;
END;
$$ LANGUAGE plpgsql;
