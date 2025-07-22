-- Migration script to update account_status values to use plan names
-- This script converts from the old system (free/premium/elite) to new system (drishti/sparsh/sangam/samarpan)

BEGIN;

-- First, add the new values to the enum type if it exists
DO $$ 
BEGIN
  -- Check if account_status is an enum type
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
    -- Add new values to enum
    ALTER TYPE account_status_enum ADD VALUE IF NOT EXISTS 'drishti';
    ALTER TYPE account_status_enum ADD VALUE IF NOT EXISTS 'sparsh';
    ALTER TYPE account_status_enum ADD VALUE IF NOT EXISTS 'sangam';
    ALTER TYPE account_status_enum ADD VALUE IF NOT EXISTS 'samarpan';
  END IF;
END $$;

-- Update existing user accounts to use new plan names
-- free -> drishti (free plan)
UPDATE users 
SET account_status = 'drishti' 
WHERE account_status = 'free' OR account_status = 'active' OR account_status IS NULL;

-- premium -> sparsh (basic paid plan)
-- Note: This is a business decision - you may want to map some premium users to 'sangam'
UPDATE users 
SET account_status = 'sparsh' 
WHERE account_status = 'premium';

-- elite -> samarpan (highest tier)
UPDATE users 
SET account_status = 'samarpan' 
WHERE account_status = 'elite';

-- Handle any other status values by defaulting to drishti
UPDATE users 
SET account_status = 'drishti' 
WHERE account_status NOT IN ('drishti', 'sparsh', 'sangam', 'samarpan');

-- If account_status is a text column (not enum), add a constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
    -- Add constraint for text column
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
    ALTER TABLE users ADD CONSTRAINT users_account_status_check 
    CHECK (account_status IN ('drishti', 'sparsh', 'sangam', 'samarpan'));
  END IF;
END $$;

-- Set default value for new users
ALTER TABLE users ALTER COLUMN account_status SET DEFAULT 'drishti';

-- Update any existing payment plan references
UPDATE payment_plans 
SET name = REPLACE(name, 'Elite', 'Samarpan')
WHERE name LIKE '%Elite%';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

COMMIT;

-- Verification query to check the migration
SELECT 
  account_status, 
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM users 
WHERE account_status IS NOT NULL
GROUP BY account_status 
ORDER BY user_count DESC; 