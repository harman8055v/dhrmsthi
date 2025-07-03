-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  mobile_number TEXT,
  gender TEXT,
  birthdate DATE,
  city TEXT,
  state TEXT,
  country TEXT,
  mother_tongue TEXT,
  education TEXT,
  profession TEXT,
  annual_income TEXT,
  spiritual_org TEXT[],
  daily_practices TEXT[],
  diet TEXT,
  temple_visit_freq TEXT,
  vanaprastha_interest TEXT,
  artha_vs_moksha TEXT,
  about_me TEXT,
  partner_expectations TEXT,
  user_photos TEXT[],
  email_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for enum fields
ALTER TABLE users
  ADD CONSTRAINT users_gender_check
    CHECK (
      gender IS NULL
      OR gender IN ('Male','Female','Other')
    );

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

-- Add constraint for mobile number format
ALTER TABLE users ADD CONSTRAINT users_mobile_number_check 
  CHECK (
    mobile_number IS NULL 
    OR (
      mobile_number ~ '^[+]?[1-9]\d{1,14}$' 
      AND length(mobile_number) >= 10 
      AND length(mobile_number) <= 15
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_mobile_number ON users(mobile_number);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Add comments explaining the fields
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address during onboarding';
COMMENT ON COLUMN users.verification_status IS 'Account review status: pending, verified, or rejected';
COMMENT ON COLUMN users.mobile_number IS 'User mobile/phone number with country code (optional)';
COMMENT ON CONSTRAINT users_gender_check ON users IS 'Ensures gender is either NULL or one of: Male, Female, Other';
COMMENT ON CONSTRAINT users_diet_check ON users IS 'Ensures diet is either NULL or one of: Vegetarian, Vegan, Eggetarian, Non-Vegetarian';
COMMENT ON CONSTRAINT users_temple_visit_freq_check ON users IS 'Ensures temple_visit_freq is either NULL or one of: Daily, Weekly, Monthly, Rarely, Never';
COMMENT ON CONSTRAINT users_vanaprastha_interest_check ON users IS 'Ensures vanaprastha_interest is either NULL or one of: yes, no, open';
COMMENT ON CONSTRAINT users_artha_vs_moksha_check ON users IS 'Ensures artha_vs_moksha is either NULL or one of: Artha-focused, Moksha-focused, Balance';
