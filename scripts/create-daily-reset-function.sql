-- Function to reset daily stats (to be called by a cron job)
CREATE OR REPLACE FUNCTION reset_daily_stats()
RETURNS void AS $$
BEGIN
  -- This function should be called daily at midnight
  -- It doesn't delete old records, just ensures new ones are created as needed
  -- The get_or_create_daily_stats function handles creating new records
  
  -- Log the reset (optional)
  INSERT INTO system_logs (event, details, created_at) 
  VALUES ('daily_reset', 'Daily stats reset completed', NOW())
  ON CONFLICT DO NOTHING;
  
END;
$$ LANGUAGE plpgsql;

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
