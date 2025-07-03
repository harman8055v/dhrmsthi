-- 1. Add the column if missing
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- 2. Add the CHECK constraint only if it isn't there yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_verification_status_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_verification_status_check
      CHECK (verification_status IN ('pending','verified','rejected'));
  END IF;
END$$;

-- 3. Create an index for quick filtering
CREATE INDEX IF NOT EXISTS idx_users_verification_status
  ON public.users (verification_status);

-- 4. Document the column
COMMENT ON COLUMN public.users.verification_status
  IS 'Account review status: pending, verified, or rejected';
