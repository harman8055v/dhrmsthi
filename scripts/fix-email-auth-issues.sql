-- Script to diagnose and fix email authentication issues

-- 1. Check for orphaned auth users without profiles
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  u.id as profile_id,
  u.email as profile_email
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- 2. Check for duplicate emails
SELECT 
  email, 
  COUNT(*) as count
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1;

-- 3. Check for mismatched emails between auth and profile
SELECT 
  au.id,
  au.email as auth_email,
  u.email as profile_email
FROM auth.users au
INNER JOIN public.users u ON au.id = u.id
WHERE au.email != u.email;

-- 4. Clean up orphaned auth users (BE CAREFUL - only run if needed)
-- DELETE FROM auth.users
-- WHERE id IN (
--   SELECT au.id
--   FROM auth.users au
--   LEFT JOIN public.users u ON au.id = u.id
--   WHERE u.id IS NULL
--   AND au.created_at < NOW() - INTERVAL '1 day'
-- );

-- 5. Add phone field if missing (for collecting phone numbers)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- 6. Update phone constraint to be optional
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mobile_number_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_check;

-- Add new optional phone constraint
ALTER TABLE users ADD CONSTRAINT users_phone_check 
  CHECK (
    phone IS NULL 
    OR phone = ''
    OR (
      phone ~ '^[+]?[0-9]{1,15}$' 
      AND length(phone) >= 10 
      AND length(phone) <= 16
    )
  );

-- 7. Ensure all required fields have defaults or are nullable
ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE users ALTER COLUMN birthdate DROP NOT NULL;

-- 8. Create function to safely create user profile
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS SETOF users
LANGUAGE plpgsql
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Construct full name
  v_full_name := TRIM(COALESCE(p_first_name, '') || ' ' || COALESCE(p_last_name, ''));
  IF v_full_name = '' THEN
    v_full_name := NULL;
  END IF;

  -- Insert or update user profile
  RETURN QUERY
  INSERT INTO users (
    id,
    email,
    phone,
    first_name,
    last_name,
    full_name,
    onboarding_completed,
    mobile_verified,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_phone,
    p_first_name,
    p_last_name,
    v_full_name,
    true, -- Skip onboarding
    false, -- No mobile verification
    false, -- No email verification yet
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, users.phone),
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW()
  RETURNING *;
END;
$$;

-- 9. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated; 