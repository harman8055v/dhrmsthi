-- Latest Users Table Schema for DharmaSaathi
-- This script creates the users table with all the latest columns and constraints

-- Drop existing table if needed (BE CAREFUL - this will delete all data!)
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Create the users table
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT auth.uid(),
  phone text NULL,
  email text NULL,
  email_verified boolean NULL DEFAULT false,
  mobile_verified boolean NULL DEFAULT false,
  full_name text NULL,
  first_name text NULL,
  last_name text NULL,
  gender text NULL,
  birthdate date NULL,
  city_id bigint NULL,
  state_id bigint NULL,
  country_id bigint NULL,
  profile_photo_url text NULL,
  user_photos jsonb NULL,
  spiritual_org text NULL,
  daily_practices text NULL,
  diet text NULL,
  temple_visit_freq text NULL,
  artha_vs_moksha text NULL,
  vanaprastha_interest text NULL,
  favorite_spiritual_quote text NULL,
  education text NULL,
  profession text NULL,
  annual_income text NULL,
  marital_status text NULL,
  super_likes_count integer NULL DEFAULT 0,
  swipe_count integer NULL DEFAULT 0,
  message_highlights_count integer NULL DEFAULT 0,
  is_verified boolean NULL DEFAULT false,
  account_status text NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  daily_swipe_count integer NULL DEFAULT 0,
  daily_superlike_count integer NULL DEFAULT 0,
  last_swipe_date date NULL,
  is_banned boolean NULL DEFAULT false,
  is_kyc_verified boolean NULL DEFAULT false,
  flagged_reason text NULL,
  role text NULL DEFAULT 'user'::text,
  mother_tongue text NULL,
  about_me text NULL,
  ideal_partner_notes text NULL,
  verification_status text NULL DEFAULT 'unverified'::text,
  height_ft integer NULL,
  height_in integer NULL,
  is_active boolean NULL DEFAULT true,
  referral_code character varying(10) NULL,
  referral_count integer NULL DEFAULT 0,
  fast_track_verification boolean NULL DEFAULT false,
  total_referrals integer NULL DEFAULT 0,
  is_onboarded boolean NULL DEFAULT false,
  privacy_settings jsonb NULL DEFAULT '{"show_distance": true, "show_last_active": true, "profile_visibility": true, "show_online_status": true, "allow_search_by_phone": false, "show_verification_badge": true, "allow_profile_screenshots": false, "allow_messages_from_matches_only": false}'::jsonb,
  profile_boosts_count integer NOT NULL DEFAULT 0,
  welcome_sent boolean NOT NULL DEFAULT false,
  referred_by character varying NULL,
  
  -- Primary key
  CONSTRAINT users_v2_pkey PRIMARY KEY (id),
  
  -- Unique constraints
  CONSTRAINT users_v2_email_key UNIQUE (email),
  CONSTRAINT users_referral_code_key UNIQUE (referral_code),
  
  -- Foreign key constraints
  CONSTRAINT users_v2_state_id_fkey FOREIGN KEY (state_id) REFERENCES states (id),
  CONSTRAINT users_v2_city_id_fkey FOREIGN KEY (city_id) REFERENCES cities (id),
  CONSTRAINT users_v2_country_id_fkey FOREIGN KEY (country_id) REFERENCES countries (id),
  
  -- Check constraints
  CONSTRAINT users_role_check1 CHECK (
    role = ANY (
      ARRAY[
        'user'::text,
        'admin'::text,
        'super_admin'::text,
        'superadmin'::text
      ]
    )
  ),
  CONSTRAINT users_v2_gender_check CHECK (
    gender = ANY (
      ARRAY['Male'::text, 'Female'::text, 'Other'::text]
    )
  ),
  CONSTRAINT users_height_in_check CHECK (
    (height_in >= 0) AND (height_in <= 11)
  ),
  CONSTRAINT users_height_ft_check CHECK (
    (height_ft >= 4) AND (height_ft <= 7)
  )
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users USING btree (phone) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users USING btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_country_state_city ON public.users USING btree (country_id, state_id, city_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_gender ON public.users USING btree (gender) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_height_ft ON public.users USING btree (height_ft) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_height_in ON public.users USING btree (height_in) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_height_composite ON public.users USING btree (height_ft, height_in) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users USING btree (referral_code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON public.users USING btree (verification_status) TABLESPACE pg_default;

-- Create referral completion trigger
-- Note: This assumes the process_referral_completion() function already exists
CREATE TRIGGER referral_completion_trigger
AFTER UPDATE OF verification_status ON users 
FOR EACH ROW
EXECUTE FUNCTION process_referral_completion();

-- Generate referral codes for existing users who don't have one
UPDATE users 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- Add table comments for documentation
COMMENT ON TABLE public.users IS 'Main users table for DharmaSaathi containing user profiles and settings';
COMMENT ON COLUMN public.users.referred_by IS 'Stores the referral code used during signup';
COMMENT ON COLUMN public.users.referral_code IS 'Unique referral code for this user to share with others';
COMMENT ON COLUMN public.users.referral_count IS 'Number of successful referrals (verified users)';
COMMENT ON COLUMN public.users.total_referrals IS 'Total number of referrals (including pending)'; 