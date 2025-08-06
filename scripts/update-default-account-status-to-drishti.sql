-- Update default account_status from 'active' to 'drishti'
-- This script migrates existing users and updates the schema default

-- Step 1: Update existing users with 'active' status to 'drishti'
UPDATE users 
SET account_status = 'drishti', 
    updated_at = NOW()
WHERE account_status = 'active' OR account_status IS NULL;

-- Step 2: Update the default value for the account_status column
ALTER TABLE users ALTER COLUMN account_status SET DEFAULT 'drishti';

-- Step 3: Add constraint to ensure valid account status values
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_account_status_check' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_account_status_check;
    END IF;
    
    -- Add new constraint with updated values
    ALTER TABLE users ADD CONSTRAINT users_account_status_check 
    CHECK (account_status IN ('drishti', 'sparsh', 'sangam', 'samarpan', 'suspended', 'deleted'));
END $$;

-- Step 4: Create index on account_status for better performance
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Step 5: Log the migration
INSERT INTO system_logs (event_type, message, created_at)
VALUES (
    'schema_migration',
    'Updated default account_status from active to drishti. Migrated ' || 
    (SELECT COUNT(*) FROM users WHERE account_status = 'drishti') || ' users.',
    NOW()
) ON CONFLICT DO NOTHING;

-- Add helpful comment
COMMENT ON COLUMN users.account_status IS 'User subscription plan: drishti (free), sparsh, sangam, samarpan, suspended, deleted';

-- Verification query to check the migration
-- SELECT account_status, COUNT(*) FROM users GROUP BY account_status ORDER BY account_status;