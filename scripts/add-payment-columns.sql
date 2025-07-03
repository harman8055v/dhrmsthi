-- Add payment-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS super_likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS message_highlights_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;

-- Update account_status enum to include premium
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
        CREATE TYPE account_status_enum AS ENUM ('active', 'premium', 'suspended', 'deleted');
        ALTER TABLE users ALTER COLUMN account_status TYPE account_status_enum USING account_status::account_status_enum;
    ELSE
        -- Add premium to existing enum if it doesn't exist
        BEGIN
            ALTER TYPE account_status_enum ADD VALUE 'premium';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
