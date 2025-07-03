-- Update the database constraints to match the new enum values

-- Drop existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_diet_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_temple_visit_freq_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_vanaprastha_interest_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_artha_vs_moksha_check;

-- Add updated constraints with new enum values
ALTER TABLE users
  ADD CONSTRAINT users_diet_check
    CHECK (
      diet IS NULL
      OR diet IN ('Vegetarian','Vegan','Eggetarian','Non-Vegetarian')
    );

ALTER TABLE users
  ADD CONSTRAINT users_temple_visit_freq_check
    CHECK (
      temple_visit_freq IS NULL
      OR temple_visit_freq IN ('Daily','Weekly','Monthly','Rarely','Never')
    );

ALTER TABLE users
  ADD CONSTRAINT users_vanaprastha_interest_check
    CHECK (
      vanaprastha_interest IS NULL
      OR vanaprastha_interest IN ('yes','no','open')
    );

ALTER TABLE users
  ADD CONSTRAINT users_artha_vs_moksha_check
    CHECK (
      artha_vs_moksha IS NULL
      OR artha_vs_moksha IN ('Artha-focused','Moksha-focused','Balance')
    );

-- Update any existing records with invalid enum values to NULL
UPDATE users SET diet = NULL WHERE diet NOT IN ('Vegetarian','Vegan','Eggetarian','Non-Vegetarian');
UPDATE users SET temple_visit_freq = NULL WHERE temple_visit_freq NOT IN ('Daily','Weekly','Monthly','Rarely','Never');
UPDATE users SET vanaprastha_interest = NULL WHERE vanaprastha_interest NOT IN ('yes','no','open');
UPDATE users SET artha_vs_moksha = NULL WHERE artha_vs_moksha NOT IN ('Artha-focused','Moksha-focused','Balance');

-- Add comments explaining the constraints
COMMENT ON CONSTRAINT users_diet_check ON users IS 'Ensures diet is either NULL or one of: Vegetarian, Vegan, Eggetarian, Non-Vegetarian';
COMMENT ON CONSTRAINT users_temple_visit_freq_check ON users IS 'Ensures temple_visit_freq is either NULL or one of: Daily, Weekly, Monthly, Rarely, Never';
COMMENT ON CONSTRAINT users_vanaprastha_interest_check ON users IS 'Ensures vanaprastha_interest is either NULL or one of: yes, no, open';
COMMENT ON CONSTRAINT users_artha_vs_moksha_check ON users IS 'Ensures artha_vs_moksha is either NULL or one of: Artha-focused, Moksha-focused, Balance';
