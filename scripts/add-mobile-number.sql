-- Add mobile number field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- Add constraint to ensure mobile number format (optional but recommended)
ALTER TABLE users ADD CONSTRAINT users_mobile_number_check 
  CHECK (
    mobile_number IS NULL 
    OR (
      mobile_number ~ '^[+]?[1-9]\d{1,14}$' 
      AND length(mobile_number) >= 10 
      AND length(mobile_number) <= 15
    )
  );

-- Add index for mobile number lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile_number ON users(mobile_number);

-- Add comment explaining the field
COMMENT ON COLUMN users.mobile_number IS 'User mobile/phone number with country code (optional)';
