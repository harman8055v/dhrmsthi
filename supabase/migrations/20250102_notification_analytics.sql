-- Migration for notification analytics and marketing campaigns
-- Run this in your Supabase SQL editor

-- Create marketing campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- seasonal, feature_launch, subscription_promo, etc.
  title VARCHAR(500) NOT NULL,
  description TEXT,
  image_url TEXT,
  action_url TEXT,
  promo_code VARCHAR(50),
  discount JSONB, -- {percentage: 50, amount: 100, currency: "INR"}
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  target_audience JSONB, -- {accountTypes: ["free"], minAge: 18, etc.}
  is_active BOOLEAN DEFAULT true,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
  max_shows INTEGER DEFAULT 3,
  cooldown_hours INTEGER DEFAULT 24,
  max_uses INTEGER, -- null for unlimited
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promo code usage tracking table
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  promo_code VARCHAR(50) NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  discount_applied JSONB,
  order_id UUID, -- reference to actual order if applicable
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id) -- prevent duplicate usage per user per campaign
);

-- Create notification analytics table
CREATE TABLE IF NOT EXISTS notification_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- received, opened, clicked, dismissed, converted
  notification_type VARCHAR(100) NOT NULL, -- message, like, promotion, etc.
  notification_category VARCHAR(50), -- social, marketing, engagement, monetization, system
  notification_priority VARCHAR(20), -- low, normal, high, critical
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  match_id UUID, -- reference to match if applicable
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_native_app BOOLEAN DEFAULT false,
  properties JSONB, -- additional event properties
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics events table (general purpose)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  properties JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  social_preferences JSONB DEFAULT '{"messages": true, "likes": true, "superlikes": true, "matches": true}',
  marketing_preferences JSONB DEFAULT '{"promotions": true, "seasonal": true, "features": true, "enabled": true}',
  engagement_preferences JSONB DEFAULT '{"dailyReminders": false, "weeklyDigest": true, "tips": true, "achievements": true, "community": true, "enabled": true}',
  monetization_preferences JSONB DEFAULT '{"subscription": true, "premiumFeatures": true, "enabled": true}',
  system_preferences JSONB DEFAULT '{"general": true, "critical": true}',
  quiet_hours JSONB DEFAULT '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}',
  do_not_disturb BOOLEAN DEFAULT false,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_active ON marketing_campaigns(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_promo_code ON marketing_campaigns(promo_code) WHERE promo_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user ON promo_code_usage(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_user_timestamp ON notification_analytics(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_campaign ON notification_analytics(campaign_id, event_type);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_type_category ON notification_analytics(notification_type, notification_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON user_notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample seasonal campaigns
INSERT INTO marketing_campaigns (name, type, title, description, promo_code, discount, valid_from, valid_until, target_audience, priority, max_shows, cooldown_hours)
VALUES 
  (
    'Diwali Special 2024',
    'seasonal',
    '🪔 Diwali Special: Find Your Perfect Match!',
    'Celebrate Diwali by finding your spiritual life partner. Get 50% off on premium features!',
    'DIWALI50',
    '{"percentage": 50}',
    '2024-10-01'::timestamptz,
    '2024-11-15'::timestamptz,
    '{"accountTypes": ["free", "basic"]}',
    'high',
    3,
    48
  ),
  (
    'Valentine Special 2025',
    'seasonal',
    '💕 Valentine''s Week: Love is in the Air!',
    'Find your soulmate this Valentine''s week. Special discounts on all premium plans!',
    'LOVE2025',
    '{"percentage": 40}',
    '2025-02-07'::timestamptz,
    '2025-02-21'::timestamptz,
    '{"accountTypes": ["free", "basic"]}',
    'high',
    3,
    48
  ),
  (
    'New User Welcome',
    'engagement_boost',
    '🎉 Welcome to DharmaSaathi!',
    'Get started with 7 days of premium features for free!',
    'WELCOME7',
    '{"percentage": 100}',
    NOW(),
    NOW() + INTERVAL '365 days',
    '{"accountTypes": ["free"], "newUser": true}',
    'normal',
    1,
    168
  );

-- Create RLS (Row Level Security) policies
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active marketing campaigns
CREATE POLICY "Public read access to active campaigns" ON marketing_campaigns
  FOR SELECT USING (is_active = true AND valid_until > NOW());

-- Users can read their own promo code usage
CREATE POLICY "Users can read own promo usage" ON promo_code_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own promo code usage
CREATE POLICY "Users can insert own promo usage" ON promo_code_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own notification analytics
CREATE POLICY "Users can read own notification analytics" ON notification_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Allow insertion of notification analytics
CREATE POLICY "Allow notification analytics insertion" ON notification_analytics
  FOR INSERT WITH CHECK (true);

-- Users can read their own analytics events
CREATE POLICY "Users can read own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- Allow insertion of analytics events
CREATE POLICY "Allow analytics events insertion" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Users can manage their own notification preferences
CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create function to get user notification preferences with defaults
CREATE OR REPLACE FUNCTION get_user_notification_preferences(user_uuid UUID)
RETURNS TABLE (
  social_preferences JSONB,
  marketing_preferences JSONB,
  engagement_preferences JSONB,
  monetization_preferences JSONB,
  system_preferences JSONB,
  quiet_hours JSONB,
  do_not_disturb BOOLEAN,
  push_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(unp.social_preferences, '{"messages": true, "likes": true, "superlikes": true, "matches": true}'::JSONB),
    COALESCE(unp.marketing_preferences, '{"promotions": true, "seasonal": true, "features": true, "enabled": true}'::JSONB),
    COALESCE(unp.engagement_preferences, '{"dailyReminders": false, "weeklyDigest": true, "tips": true, "achievements": true, "community": true, "enabled": true}'::JSONB),
    COALESCE(unp.monetization_preferences, '{"subscription": true, "premiumFeatures": true, "enabled": true}'::JSONB),
    COALESCE(unp.system_preferences, '{"general": true, "critical": true}'::JSONB),
    COALESCE(unp.quiet_hours, '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}'::JSONB),
    COALESCE(unp.do_not_disturb, false),
    unp.push_token
  FROM user_notification_preferences unp
  WHERE unp.user_id = user_uuid
  UNION ALL
  SELECT 
    '{"messages": true, "likes": true, "superlikes": true, "matches": true}'::JSONB,
    '{"promotions": true, "seasonal": true, "features": true, "enabled": true}'::JSONB,
    '{"dailyReminders": false, "weeklyDigest": true, "tips": true, "achievements": true, "community": true, "enabled": true}'::JSONB,
    '{"subscription": true, "premiumFeatures": true, "enabled": true}'::JSONB,
    '{"general": true, "critical": true}'::JSONB,
    '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}'::JSONB,
    false,
    NULL::TEXT
  WHERE NOT EXISTS (
    SELECT 1 FROM user_notification_preferences WHERE user_id = user_uuid
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update or insert user notification preferences
CREATE OR REPLACE FUNCTION upsert_user_notification_preferences(
  user_uuid UUID,
  social_prefs JSONB DEFAULT NULL,
  marketing_prefs JSONB DEFAULT NULL,
  engagement_prefs JSONB DEFAULT NULL,
  monetization_prefs JSONB DEFAULT NULL,
  system_prefs JSONB DEFAULT NULL,
  quiet_hours_prefs JSONB DEFAULT NULL,
  dnd BOOLEAN DEFAULT NULL,
  token TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO user_notification_preferences (
    user_id,
    social_preferences,
    marketing_preferences,
    engagement_preferences,
    monetization_preferences,
    system_preferences,
    quiet_hours,
    do_not_disturb,
    push_token
  ) VALUES (
    user_uuid,
    COALESCE(social_prefs, '{"messages": true, "likes": true, "superlikes": true, "matches": true}'::JSONB),
    COALESCE(marketing_prefs, '{"promotions": true, "seasonal": true, "features": true, "enabled": true}'::JSONB),
    COALESCE(engagement_prefs, '{"dailyReminders": false, "weeklyDigest": true, "tips": true, "achievements": true, "community": true, "enabled": true}'::JSONB),
    COALESCE(monetization_prefs, '{"subscription": true, "premiumFeatures": true, "enabled": true}'::JSONB),
    COALESCE(system_prefs, '{"general": true, "critical": true}'::JSONB),
    COALESCE(quiet_hours_prefs, '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}'::JSONB),
    COALESCE(dnd, false),
    token
  )
  ON CONFLICT (user_id) DO UPDATE SET
    social_preferences = COALESCE(social_prefs, user_notification_preferences.social_preferences),
    marketing_preferences = COALESCE(marketing_prefs, user_notification_preferences.marketing_preferences),
    engagement_preferences = COALESCE(engagement_prefs, user_notification_preferences.engagement_preferences),
    monetization_preferences = COALESCE(monetization_prefs, user_notification_preferences.monetization_preferences),
    system_preferences = COALESCE(system_prefs, user_notification_preferences.system_preferences),
    quiet_hours = COALESCE(quiet_hours_prefs, user_notification_preferences.quiet_hours),
    do_not_disturb = COALESCE(dnd, user_notification_preferences.do_not_disturb),
    push_token = COALESCE(token, user_notification_preferences.push_token),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
