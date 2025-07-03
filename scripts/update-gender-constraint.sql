-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;

-- Add the new constraint that allows NULL values
ALTER TABLE users
  ADD CONSTRAINT users_gender_check
    CHECK (
      gender IS NULL
      OR gender IN ('Male','Female','Other')
    );

-- Update any existing records with empty strings to NULL
UPDATE users SET gender = NULL WHERE gender = '';

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT users_gender_check ON users IS 'Ensures gender is either NULL or one of: Male, Female, Other';
