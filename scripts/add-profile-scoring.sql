-- Add profile scoring system for manual quality assessment
-- This allows admins to rate profile quality from 1-10 during verification

-- Add profile_score column to users table
DO $$
BEGIN
    -- Add profile_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_score') THEN
        ALTER TABLE users ADD COLUMN profile_score INTEGER DEFAULT 5 CHECK (profile_score >= 1 AND profile_score <= 10);
        
        -- Add index for performance in matching queries
        CREATE INDEX IF NOT EXISTS idx_users_profile_score ON users (profile_score);
        
        -- Add comment for documentation
        COMMENT ON COLUMN users.profile_score IS 'Manual profile quality score (1-10) assigned by admins during verification. Default: 5';
        
        RAISE NOTICE 'Added profile_score column with default value 5';
    ELSE
        RAISE NOTICE 'profile_score column already exists';
    END IF;
    
    -- Update existing users to have default score of 5 if NULL
    UPDATE users 
    SET profile_score = 5 
    WHERE profile_score IS NULL;
    
    -- Add profile_scored_at timestamp to track when scoring was done
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_scored_at') THEN
        ALTER TABLE users ADD COLUMN profile_scored_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN users.profile_scored_at IS 'Timestamp when profile was manually scored by admin';
        
        RAISE NOTICE 'Added profile_scored_at timestamp column';
    END IF;
    
    -- Add profile_scored_by to track which admin scored the profile
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_scored_by') THEN
        ALTER TABLE users ADD COLUMN profile_scored_by UUID REFERENCES users(id);
        
        COMMENT ON COLUMN users.profile_scored_by IS 'ID of admin who assigned the profile score';
        
        RAISE NOTICE 'Added profile_scored_by reference column';
    END IF;
    
END $$;

-- Create a trigger to automatically update profile_scored_at when score changes
CREATE OR REPLACE FUNCTION update_profile_scored_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update timestamp if profile_score actually changed
    IF OLD.profile_score IS DISTINCT FROM NEW.profile_score THEN
        NEW.profile_scored_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_profile_scored_at ON users;
CREATE TRIGGER trigger_update_profile_scored_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_scored_at();

-- Create view for admin profile scoring analytics
CREATE OR REPLACE VIEW profile_scoring_analytics AS
SELECT 
    profile_score,
    COUNT(*) as profile_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_count,
    COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_count
FROM users 
WHERE profile_score IS NOT NULL
GROUP BY profile_score
ORDER BY profile_score DESC;

-- Grant necessary permissions
GRANT SELECT ON profile_scoring_analytics TO authenticated;

-- Insert some example scoring guidelines as comments
COMMENT ON TABLE users IS 'Profile Scoring Guidelines:
10 = Exceptional: Perfect photos, complete profile, compelling descriptions, spiritual depth
9 = Excellent: High-quality photos, detailed profile, good spiritual content
8 = Very Good: Good photos, mostly complete profile, some spiritual depth
7 = Good: Decent photos, adequate profile completion
6 = Above Average: Basic photos, reasonable profile
5 = Average: Standard profile (default for most users)
4 = Below Average: Limited photos or incomplete profile
3 = Poor: Few photos, minimal information
2 = Very Poor: Poor quality photos or very incomplete
1 = Unacceptable: Inappropriate content or fake profile';

RAISE NOTICE 'Profile scoring system setup complete! Default score: 5/10';
RAISE NOTICE 'Admins can now rate profiles 1-10 during verification process';
RAISE NOTICE 'Use profile_scoring_analytics view to see score distribution'; 