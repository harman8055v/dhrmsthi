-- Add profile_score column to users table
-- This column stores a numeric score from 0 to 10, defaults to NULL

-- Add the column
ALTER TABLE public.users 
ADD COLUMN profile_score DECIMAL(3,1) NULL;

-- Add check constraint to ensure values are between 0 and 10
ALTER TABLE public.users 
ADD CONSTRAINT users_profile_score_range 
CHECK (profile_score IS NULL OR (profile_score >= 0 AND profile_score <= 10));

-- Add comment to document the column
COMMENT ON COLUMN public.users.profile_score IS 'Profile completeness/quality score from 0 to 10. NULL indicates not calculated yet.';

-- Create index for performance (optional, useful for filtering/sorting)
CREATE INDEX idx_users_profile_score ON public.users(profile_score) WHERE profile_score IS NOT NULL;

-- Example queries to test the constraint:
-- Valid inserts:
-- UPDATE users SET profile_score = 7.5 WHERE id = 'some-user-id';
-- UPDATE users SET profile_score = 0 WHERE id = 'some-user-id';
-- UPDATE users SET profile_score = 10 WHERE id = 'some-user-id';
-- UPDATE users SET profile_score = NULL WHERE id = 'some-user-id';

-- Invalid inserts (should fail):
-- UPDATE users SET profile_score = -1 WHERE id = 'some-user-id';
-- UPDATE users SET profile_score = 11 WHERE id = 'some-user-id'; 