-- Supabase Notification System Migration
-- This creates a comprehensive notification system with real-time capabilities

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'message', 'like', 'superlike', 'match', 'marketing', 'system'
  category VARCHAR(20) NOT NULL DEFAULT 'social', -- 'social', 'marketing', 'engagement', 'monetization', 'system'
  priority VARCHAR(10) NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional notification data
  action_url TEXT,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  is_seen BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  social_notifications JSONB DEFAULT '{"messages": true, "likes": true, "superlikes": true, "matches": true}',
  marketing_notifications JSONB DEFAULT '{"promotions": true, "seasonal": true, "features": true, "enabled": true}',
  engagement_notifications JSONB DEFAULT '{"dailyReminders": false, "weeklyDigest": true, "tips": true, "achievements": true, "community": true, "enabled": true}',
  monetization_notifications JSONB DEFAULT '{"subscription": true, "premiumFeatures": true, "enabled": true}',
  system_notifications JSONB DEFAULT '{"general": true, "critical": true}',
  quiet_hours JSONB DEFAULT '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}',
  do_not_disturb BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  web_enabled BOOLEAN DEFAULT true,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification templates table for consistent messaging
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(20) NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'normal',
  title_template VARCHAR(255) NOT NULL,
  message_template TEXT NOT NULL,
  action_url_template TEXT,
  image_url TEXT,
  expires_after_hours INTEGER, -- null = never expires
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default notification templates
INSERT INTO notification_templates (type, category, priority, title_template, message_template, action_url_template, expires_after_hours) VALUES
-- Social notifications
('message', 'social', 'high', 'New Message from {{sender_name}}', '{{sender_name}} sent you a message: "{{message_preview}}"', '/dashboard/messages/{{match_id}}', 168),
('like', 'social', 'normal', 'Someone Liked You! 💖', '{{sender_name}} liked your profile. Check them out!', '/dashboard/likes', 72),
('superlike', 'social', 'high', 'Super Like! ⭐', '{{sender_name}} super liked you! They''re really interested.', '/dashboard/likes', 72),
('match', 'social', 'high', 'It''s a Match! 🎉', 'You and {{sender_name}} liked each other. Start chatting now!', '/dashboard/messages/{{match_id}}', 168),
('profile_view', 'social', 'low', 'Profile View', '{{sender_name}} viewed your profile', '/dashboard/profile', 24),

-- Marketing notifications
('seasonal_promo', 'marketing', 'normal', '{{campaign_title}}', '{{campaign_message}}', '{{campaign_url}}', 72),
('feature_launch', 'marketing', 'normal', 'New Feature: {{feature_name}}', 'Check out our latest feature: {{feature_description}}', '/features/{{feature_slug}}', 168),
('subscription_promo', 'marketing', 'normal', 'Special Offer: {{discount}}% Off Premium', 'Upgrade to Premium and get {{discount}}% off. Limited time offer!', '/premium?promo={{promo_code}}', 48),

-- Engagement notifications
('daily_reminder', 'engagement', 'low', 'Daily Check-in', 'New profiles are waiting for you! Check them out today.', '/dashboard', 24),
('weekly_digest', 'engagement', 'normal', 'Your Weekly Summary', 'Here''s what happened this week: {{stats_summary}}', '/dashboard/profile', 168),
('profile_tip', 'engagement', 'low', 'Profile Tip', '{{tip_message}}', '/dashboard/profile', 72),
('achievement', 'engagement', 'normal', 'Achievement Unlocked! 🏆', 'Congratulations! You''ve earned: {{achievement_name}}', '/dashboard/profile?tab=achievements', 168),

-- Monetization notifications
('subscription_reminder', 'monetization', 'normal', 'Upgrade to Premium', 'Unlock unlimited likes and super features with Premium!', '/premium', 48),
('billing_reminder', 'monetization', 'high', 'Payment Due', 'Your subscription payment is due in {{days_until_due}} days.', '/premium/billing', 72),

-- System notifications
('account_verification', 'system', 'high', 'Verify Your Account', 'Please verify your account to unlock all features.', '/dashboard/settings?tab=verification', null),
('security_alert', 'system', 'critical', 'Security Alert', '{{security_message}}', '/dashboard/settings?tab=security', null),
('maintenance', 'system', 'normal', 'Scheduled Maintenance', 'We''ll be performing maintenance on {{maintenance_date}}.', null, 48);

-- Function to check if user should receive notification based on settings
CREATE OR REPLACE FUNCTION should_send_notification(
  user_uuid UUID,
  notification_type VARCHAR,
  notification_category VARCHAR,
  notification_priority VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  settings RECORD;
  current_hour INTEGER;
  quiet_start INTEGER;
  quiet_end INTEGER;
BEGIN
  -- Get user notification settings
  SELECT * INTO settings FROM notification_settings WHERE user_id = user_uuid;
  
  -- If no settings found, create default settings and allow notification
  IF NOT FOUND THEN
    INSERT INTO notification_settings (user_id) VALUES (user_uuid);
    RETURN TRUE;
  END IF;
  
  -- Check do not disturb
  IF settings.do_not_disturb THEN
    -- Only allow critical notifications during DND
    RETURN notification_priority = 'critical';
  END IF;
  
  -- Check quiet hours
  IF (settings.quiet_hours->>'enabled')::BOOLEAN THEN
    current_hour := EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC');
    quiet_start := (settings.quiet_hours->>'startTime')::TIME;
    quiet_end := (settings.quiet_hours->>'endTime')::TIME;
    
    -- During quiet hours, only allow critical notifications
    IF (quiet_start <= quiet_end AND current_hour >= EXTRACT(HOUR FROM quiet_start) AND current_hour < EXTRACT(HOUR FROM quiet_end))
       OR (quiet_start > quiet_end AND (current_hour >= EXTRACT(HOUR FROM quiet_start) OR current_hour < EXTRACT(HOUR FROM quiet_end))) THEN
      RETURN notification_priority = 'critical';
    END IF;
  END IF;
  
  -- Check category-specific preferences
  CASE notification_category
    WHEN 'social' THEN
      CASE notification_type
        WHEN 'message' THEN RETURN (settings.social_notifications->>'messages')::BOOLEAN;
        WHEN 'like' THEN RETURN (settings.social_notifications->>'likes')::BOOLEAN;
        WHEN 'superlike' THEN RETURN (settings.social_notifications->>'superlikes')::BOOLEAN;
        WHEN 'match' THEN RETURN (settings.social_notifications->>'matches')::BOOLEAN;
        ELSE RETURN TRUE;
      END CASE;
    WHEN 'marketing' THEN
      RETURN (settings.marketing_notifications->>'enabled')::BOOLEAN;
    WHEN 'engagement' THEN
      RETURN (settings.engagement_notifications->>'enabled')::BOOLEAN;
    WHEN 'monetization' THEN
      RETURN (settings.monetization_notifications->>'enabled')::BOOLEAN;
    WHEN 'system' THEN
      IF notification_priority = 'critical' THEN
        RETURN (settings.system_notifications->>'critical')::BOOLEAN;
      ELSE
        RETURN (settings.system_notifications->>'general')::BOOLEAN;
      END IF;
    ELSE
      RETURN TRUE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification from template
CREATE OR REPLACE FUNCTION create_notification_from_template(
  template_type VARCHAR,
  recipient_uuid UUID,
  sender_uuid UUID DEFAULT NULL,
  template_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  template RECORD;
  notification_id UUID;
  rendered_title VARCHAR;
  rendered_message TEXT;
  rendered_action_url TEXT;
  expires_at_calc TIMESTAMPTZ;
BEGIN
  -- Get template
  SELECT * INTO template FROM notification_templates 
  WHERE type = template_type AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification template not found: %', template_type;
  END IF;
  
  -- Check if user should receive this notification
  IF NOT should_send_notification(recipient_uuid, template.type, template.category, template.priority) THEN
    RETURN NULL; -- User preferences block this notification
  END IF;
  
  -- Render templates with data
  rendered_title := template.title_template;
  rendered_message := template.message_template;
  rendered_action_url := template.action_url_template;
  
  -- Replace template variables
  FOR key IN SELECT jsonb_object_keys(template_data) LOOP
    rendered_title := REPLACE(rendered_title, '{{' || key || '}}', template_data->>key);
    rendered_message := REPLACE(rendered_message, '{{' || key || '}}', template_data->>key);
    rendered_action_url := REPLACE(rendered_action_url, '{{' || key || '}}', template_data->>key);
  END LOOP;
  
  -- Calculate expiration
  IF template.expires_after_hours IS NOT NULL THEN
    expires_at_calc := NOW() + (template.expires_after_hours || ' hours')::INTERVAL;
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    type,
    category,
    priority,
    title,
    message,
    data,
    action_url,
    image_url,
    expires_at
  ) VALUES (
    recipient_uuid,
    sender_uuid,
    template.type,
    template.category,
    template.priority,
    rendered_title,
    rendered_message,
    template_data,
    NULLIF(rendered_action_url, ''),
    template.image_url,
    expires_at_calc
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new messages
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  message_preview TEXT;
BEGIN
  -- Get sender name
  SELECT COALESCE(full_name, 'Someone') INTO sender_name 
  FROM users WHERE id = NEW.sender_id;
  
  -- Create message preview (first 50 characters)
  message_preview := LEFT(NEW.content, 50);
  IF LENGTH(NEW.content) > 50 THEN
    message_preview := message_preview || '...';
  END IF;
  
  -- Create notification
  PERFORM create_notification_from_template(
    'message',
    NEW.recipient_id,
    NEW.sender_id,
    jsonb_build_object(
      'sender_name', sender_name,
      'message_preview', message_preview,
      'match_id', NEW.match_id,
      'message_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new likes
CREATE OR REPLACE FUNCTION notify_new_like() RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  notification_type TEXT;
BEGIN
  -- Get sender name
  SELECT COALESCE(full_name, 'Someone') INTO sender_name 
  FROM users WHERE id = NEW.user_id;
  
  -- Determine notification type
  notification_type := CASE 
    WHEN NEW.is_super_like THEN 'superlike'
    ELSE 'like'
  END;
  
  -- Create notification
  PERFORM create_notification_from_template(
    notification_type,
    NEW.liked_user_id,
    NEW.user_id,
    jsonb_build_object(
      'sender_name', sender_name,
      'like_id', NEW.id,
      'is_super_like', NEW.is_super_like
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new matches
CREATE OR REPLACE FUNCTION notify_new_match() RETURNS TRIGGER AS $$
DECLARE
  user1_name TEXT;
  user2_name TEXT;
BEGIN
  -- Get user names
  SELECT COALESCE(full_name, 'Someone') INTO user1_name 
  FROM users WHERE id = NEW.user1_id;
  
  SELECT COALESCE(full_name, 'Someone') INTO user2_name 
  FROM users WHERE id = NEW.user2_id;
  
  -- Create notification for user1
  PERFORM create_notification_from_template(
    'match',
    NEW.user1_id,
    NEW.user2_id,
    jsonb_build_object(
      'sender_name', user2_name,
      'match_id', NEW.id
    )
  );
  
  -- Create notification for user2
  PERFORM create_notification_from_template(
    'match',
    NEW.user2_id,
    NEW.user1_id,
    jsonb_build_object(
      'sender_name', user1_name,
      'match_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (assuming your tables exist)
-- Note: Adjust table names according to your actual schema

-- Messages trigger (assuming you have a messages table)
-- CREATE TRIGGER trigger_notify_new_message
--   AFTER INSERT ON messages
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_new_message();

-- Likes trigger (assuming you have a likes table)
-- CREATE TRIGGER trigger_notify_new_like
--   AFTER INSERT ON likes
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_new_like();

-- Matches trigger (assuming you have a matches table)
-- CREATE TRIGGER trigger_notify_new_match
--   AFTER INSERT ON matches
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_new_match();

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  user_uuid UUID,
  notification_ids UUID[] DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF notification_ids IS NULL THEN
    -- Mark all unread notifications as read
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE recipient_id = user_uuid AND is_read = false;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE recipient_id = user_uuid AND id = ANY(notification_ids);
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user notifications with pagination
CREATE OR REPLACE FUNCTION get_user_notifications(
  user_uuid UUID,
  page_size INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0,
  include_read BOOLEAN DEFAULT true
) RETURNS TABLE (
  id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  type VARCHAR,
  category VARCHAR,
  priority VARCHAR,
  title VARCHAR,
  message TEXT,
  data JSONB,
  action_url TEXT,
  image_url TEXT,
  is_read BOOLEAN,
  is_seen BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.sender_id,
    COALESCE(u.full_name, 'System') as sender_name,
    u.avatar_url as sender_avatar,
    n.type,
    n.category,
    n.priority,
    n.title,
    n.message,
    n.data,
    n.action_url,
    n.image_url,
    n.is_read,
    n.is_seen,
    n.created_at
  FROM notifications n
  LEFT JOIN users u ON n.sender_id = u.id
  WHERE n.recipient_id = user_uuid
    AND (include_read OR NOT n.is_read)
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ORDER BY n.created_at DESC
  LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification counts
CREATE OR REPLACE FUNCTION get_notification_counts(user_uuid UUID)
RETURNS TABLE (
  total_count BIGINT,
  unread_count BIGINT,
  social_count BIGINT,
  marketing_count BIGINT,
  system_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE NOT is_read) as unread_count,
    COUNT(*) FILTER (WHERE category = 'social' AND NOT is_read) as social_count,
    COUNT(*) FILTER (WHERE category = 'marketing' AND NOT is_read) as marketing_count,
    COUNT(*) FILTER (WHERE category = 'system' AND NOT is_read) as system_count
  FROM notifications
  WHERE recipient_id = user_uuid
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at 
  BEFORE UPDATE ON notification_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
  BEFORE UPDATE ON notification_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Create RLS policies for notification settings
CREATE POLICY "Users can manage own notification settings" ON notification_settings
  FOR ALL USING (user_id = auth.uid());

-- Public read access to notification templates
CREATE POLICY "Public read access to notification templates" ON notification_templates
  FOR SELECT USING (is_active = true);

-- Admin access to notification templates
CREATE POLICY "Admin can manage notification templates" ON notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'super_admin')
    )
  );

-- Create indexes for real-time subscriptions
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_real_time ON notifications(recipient_id, is_read, created_at DESC);

-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

COMMENT ON TABLE notifications IS 'Stores all user notifications with real-time capabilities';
COMMENT ON TABLE notification_settings IS 'User notification preferences and settings';
COMMENT ON TABLE notification_templates IS 'Templates for consistent notification messaging';
COMMENT ON FUNCTION create_notification_from_template IS 'Creates notifications using predefined templates';
COMMENT ON FUNCTION should_send_notification IS 'Checks user preferences before sending notifications';
