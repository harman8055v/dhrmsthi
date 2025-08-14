-- Create expo_push_tokens table for managing push notification tokens
-- This allows the React Native WebView app to register push tokens for notifications

-- Drop existing table if it exists (to handle partial creation issues)
DROP TABLE IF EXISTS public.expo_push_tokens CASCADE;

CREATE TABLE public.expo_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_name TEXT,
  app_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one token per user per platform
  UNIQUE(user_id, token)
);

-- Add platform constraint after table creation
ALTER TABLE public.expo_push_tokens 
ADD CONSTRAINT expo_push_tokens_platform_check 
CHECK (platform IN ('ios', 'android', 'web'));

-- Enable Row Level Security
ALTER TABLE public.expo_push_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own tokens
CREATE POLICY "Users can manage their own push tokens" 
ON public.expo_push_tokens 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_user_id ON public.expo_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_token ON public.expo_push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_platform ON public.expo_push_tokens(user_id, platform);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expo_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_expo_push_tokens_updated_at
  BEFORE UPDATE ON public.expo_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_expo_push_tokens_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.expo_push_tokens TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.expo_push_tokens IS 'Stores Expo push notification tokens for mobile app integration';
COMMENT ON COLUMN public.expo_push_tokens.token IS 'Expo push token for sending notifications';
COMMENT ON COLUMN public.expo_push_tokens.platform IS 'Platform: ios, android, or web';
COMMENT ON COLUMN public.expo_push_tokens.device_name IS 'Optional device name for identification';
COMMENT ON COLUMN public.expo_push_tokens.app_version IS 'App version when token was registered';
COMMENT ON COLUMN public.expo_push_tokens.last_used_at IS 'Last time this token was used for sending notifications';
