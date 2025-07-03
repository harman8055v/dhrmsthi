-- Add Elite status to account_status enum if it doesn't exist
DO $$
BEGIN
    -- Check if the enum type exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
        -- Check if 'elite' value exists in the enum
        IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'account_status_enum'
            AND e.enumlabel = 'elite'
        ) THEN
            -- Add 'elite' to the enum
            ALTER TYPE account_status_enum ADD VALUE 'elite' AFTER 'premium';
            RAISE NOTICE 'Added "elite" to account_status_enum';
        ELSE
            RAISE NOTICE 'Value "elite" already exists in account_status_enum';
        END IF;
    ELSE
        RAISE NOTICE 'account_status_enum does not exist';
    END IF;
END $$;

-- Add columns for elite verification if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS income_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS family_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS credit_score_verified BOOLEAN DEFAULT FALSE;

-- Create elite_verification_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS elite_verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    income_proof_url TEXT,
    family_details JSONB,
    location_details JSONB,
    credit_score_details JSONB,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, status)
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_elite_verification_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_elite_verification_requests_updated ON elite_verification_requests;
CREATE TRIGGER trg_elite_verification_requests_updated
BEFORE UPDATE ON elite_verification_requests
FOR EACH ROW EXECUTE FUNCTION update_elite_verification_requests_updated_at();

-- Add elite plan to payment_plans table if it doesn't exist
INSERT INTO payment_plans (name, price, duration_days, features, active)
VALUES 
    ('Elite Monthly', 19900, 30, '{"elite_access": true, "personal_concierge": true, "exclusive_events": true}', true),
    ('Elite Quarterly', 44900, 90, '{"elite_access": true, "personal_concierge": true, "exclusive_events": true, "savings": "55%"}', true)
ON CONFLICT DO NOTHING;

-- Create function to check if user is eligible for elite profiles
CREATE OR REPLACE FUNCTION is_eligible_for_elite_profiles(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_status TEXT;
BEGIN
    SELECT account_status INTO user_status FROM users WHERE id = user_id;
    RETURN user_status = 'elite';
END;
$$ LANGUAGE plpgsql;

-- Create function to get elite profiles
CREATE OR REPLACE FUNCTION get_elite_profiles(current_user_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    age INTEGER,
    gender TEXT,
    city TEXT,
    state TEXT,
    spiritual_background TEXT,
    photos JSONB,
    income_verified BOOLEAN,
    family_verified BOOLEAN,
    location_verified BOOLEAN,
    credit_score_verified BOOLEAN
) AS $$
BEGIN
    IF is_eligible_for_elite_profiles(current_user_id) THEN
        RETURN QUERY
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.age,
            u.gender,
            u.city,
            u.state,
            u.spiritual_background,
            u.photos,
            u.income_verified,
            u.family_verified,
            u.location_verified,
            u.credit_score_verified
        FROM users u
        WHERE 
            (u.income_verified = TRUE OR u.family_verified = TRUE OR u.location_verified = TRUE OR u.credit_score_verified = TRUE)
            AND u.id != current_user_id
            AND u.account_status IN ('premium', 'elite')
        ORDER BY 
            (CASE WHEN u.account_status = 'elite' THEN 0 ELSE 1 END),
            (u.income_verified::int + u.family_verified::int + u.location_verified::int + u.credit_score_verified::int) DESC;
    ELSE
        -- Return empty result if user is not eligible
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::INTEGER, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::JSONB, NULL::BOOLEAN, NULL::BOOLEAN, NULL::BOOLEAN, NULL::BOOLEAN WHERE FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;
