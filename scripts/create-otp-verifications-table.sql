-- Create OTP verifications table for mobile number updates
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'mobile_update', 'signup', etc.
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_purpose ON otp_verifications(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires ON otp_verifications(expires_at);

-- Enable RLS
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own OTP verifications" ON otp_verifications
  FOR ALL USING (auth.uid() = user_id);

-- Clean up expired OTPs (optional - can be run periodically)
-- DELETE FROM otp_verifications WHERE expires_at < NOW();
