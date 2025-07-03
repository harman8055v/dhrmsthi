-- Fix phone constraint naming issue
-- This script fixes the phone constraint from the old users_v2 naming to the current users table

-- Step 1: Check current constraints
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints 
WHERE constraint_name LIKE '%phone_key%' 
AND table_name IN ('users', 'users_v2');

-- Step 2: Fix the constraint (choose one of the options below)

-- Option A: Rename the existing constraint (if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_v2_phone_key' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users RENAME CONSTRAINT users_v2_phone_key TO users_phone_key;
        RAISE NOTICE 'Constraint renamed from users_v2_phone_key to users_phone_key';
    ELSE
        RAISE NOTICE 'Constraint users_v2_phone_key not found';
    END IF;
END $$;

-- Option B: Drop and recreate (alternative approach)
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_v2_phone_key;
-- ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);

-- Step 3: Verify the fix
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints 
WHERE constraint_name LIKE '%phone_key%' 
AND table_name = 'users'; 