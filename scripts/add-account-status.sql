-- Add account management columns to users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'account_status'
    ) THEN
        ALTER TABLE users
            ADD COLUMN account_status TEXT DEFAULT 'active';
        ALTER TABLE users
            ADD CONSTRAINT users_account_status_check
            CHECK (account_status IN ('active','deactivated','deleted'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'deactivated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Index for quick lookups by status
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
