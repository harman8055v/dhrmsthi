-- Debug script to check user table constraints and issues

-- 1. Check user table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check constraints on users table
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'users';

-- 3. Check indexes on users table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users';

-- 4. Check RLS policies on users table
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- 5. Check if there are any users with phone numbers that might conflict
SELECT 
    id,
    phone,
    email,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check auth.users table for any orphaned auth records
SELECT 
    au.id,
    au.phone,
    au.email,
    au.created_at,
    u.id as profile_id
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.phone IS NOT NULL
ORDER BY au.created_at DESC
LIMIT 10; 