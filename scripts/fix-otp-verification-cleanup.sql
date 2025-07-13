-- Fix OTP Verification Cleanup
-- This script adds indexes and cleanup functions for the otp_verifications table

-- Add index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_otp_verifications_cleanup 
ON otp_verifications(expires_at, verified_at);

-- Add index for phone number lookups (improves verification speed)
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone_purpose 
ON otp_verifications(mobile_number, purpose, created_at DESC);

-- Create a function to clean up old OTP records
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  -- Delete verified OTPs older than 1 hour
  DELETE FROM otp_verifications 
  WHERE verified_at IS NOT NULL 
  AND verified_at < NOW() - INTERVAL '1 hour';
  
  -- Delete unverified expired OTPs older than 24 hours
  DELETE FROM otp_verifications 
  WHERE verified_at IS NULL 
  AND expires_at < NOW() - INTERVAL '24 hours';
  
  -- Delete mobile session tokens older than 10 minutes
  DELETE FROM otp_verifications 
  WHERE purpose = 'mobile_session' 
  AND expires_at < NOW();
  
  -- Log cleanup results (optional)
  RAISE NOTICE 'OTP cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup every hour
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, you can run this function manually or via a cron job

-- First, check if pg_cron is available
DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule the cleanup job to run every hour
    PERFORM cron.schedule(
      'cleanup-expired-otps',           -- job name
      '0 * * * *',                      -- every hour at minute 0
      'SELECT cleanup_expired_otps();'  -- command to run
    );
    RAISE NOTICE 'Scheduled OTP cleanup job successfully';
  ELSE
    RAISE NOTICE 'pg_cron extension not found. Please run cleanup_expired_otps() manually or via external cron';
  END IF;
END $$;

-- Manual cleanup command (run this periodically if pg_cron is not available)
-- SELECT cleanup_expired_otps();

-- View to monitor OTP statistics
CREATE OR REPLACE VIEW otp_statistics AS
SELECT 
  purpose,
  COUNT(*) as total_count,
  COUNT(CASE WHEN verified_at IS NOT NULL THEN 1 END) as verified_count,
  COUNT(CASE WHEN verified_at IS NULL AND expires_at > NOW() THEN 1 END) as active_count,
  COUNT(CASE WHEN verified_at IS NULL AND expires_at < NOW() THEN 1 END) as expired_count,
  MAX(created_at) as last_created,
  AVG(CASE 
    WHEN verified_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (verified_at - created_at)) 
  END) as avg_verification_time_seconds
FROM otp_verifications
GROUP BY purpose;

-- Grant permissions for the cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO service_role;

-- Example queries to monitor OTP system:
-- SELECT * FROM otp_statistics;
-- SELECT cleanup_expired_otps(); -- Run manual cleanup 