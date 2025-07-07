-- Quick fix for the TypeError: spiritual_org.map is not a function error
-- This updates any existing user records that have null array fields

-- Fix spiritual_org field
UPDATE users 
SET spiritual_org = '{}' 
WHERE spiritual_org IS NULL;

-- Fix daily_practices field
UPDATE users 
SET daily_practices = '{}' 
WHERE daily_practices IS NULL;

-- Fix user_photos field
UPDATE users 
SET user_photos = '{}' 
WHERE user_photos IS NULL;

-- Count how many records were affected
SELECT 
    COUNT(*) FILTER (WHERE spiritual_org IS NULL) AS null_spiritual_org,
    COUNT(*) FILTER (WHERE daily_practices IS NULL) AS null_daily_practices,
    COUNT(*) FILTER (WHERE user_photos IS NULL) AS null_user_photos,
    COUNT(*) AS total_users
FROM users;

-- Verify the fix
SELECT id, email, spiritual_org, daily_practices, user_photos
FROM users
WHERE id = (SELECT auth.uid()); 