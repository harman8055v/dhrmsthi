-- Test Script for Referral System
-- This script tests the referral functionality to ensure it works correctly

-- Create test users for referral testing
DO $$
DECLARE
    referrer_id UUID;
    referred_id UUID;
    test_referral_code VARCHAR(10);
BEGIN
    -- Create a test referrer user
    INSERT INTO users (
        id, 
        email, 
        first_name, 
        last_name, 
        full_name, 
        verification_status,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'test-referrer@example.com',
        'Test',
        'Referrer',
        'Test Referrer',
        'verified',
        NOW(),
        NOW()
    ) RETURNING id INTO referrer_id;
    
    -- Get the referral code for this user
    SELECT referral_code INTO test_referral_code 
    FROM users 
    WHERE id = referrer_id;
    
    RAISE NOTICE 'Created test referrer with ID: % and referral code: %', referrer_id, test_referral_code;
    
    -- Create a test referred user
    INSERT INTO users (
        id,
        email,
        first_name,
        last_name,
        full_name,
        verification_status,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'test-referred@example.com',
        'Test',
        'Referred',
        'Test Referred',
        'pending',
        NOW(),
        NOW()
    ) RETURNING id INTO referred_id;
    
    RAISE NOTICE 'Created test referred user with ID: %', referred_id;
    
    -- Test the referral signup function
    PERFORM handle_referral_signup(referred_id, test_referral_code);
    
    -- Check if referral was created
    IF EXISTS (SELECT 1 FROM referrals WHERE referrer_id = referrer_id AND referred_id = referred_id) THEN
        RAISE NOTICE '✓ Referral record created successfully';
    ELSE
        RAISE WARNING '✗ Referral record was not created';
    END IF;
    
    -- Test verification trigger by updating referred user to verified
    UPDATE users 
    SET verification_status = 'verified' 
    WHERE id = referred_id;
    
    -- Check if referral was completed
    IF EXISTS (SELECT 1 FROM referrals WHERE referrer_id = referrer_id AND referred_id = referred_id AND status = 'completed') THEN
        RAISE NOTICE '✓ Referral completion trigger worked';
    ELSE
        RAISE WARNING '✗ Referral completion trigger failed';
    END IF;
    
    -- Check if referrer's count was updated
    IF EXISTS (SELECT 1 FROM users WHERE id = referrer_id AND referral_count = 1) THEN
        RAISE NOTICE '✓ Referrer count updated correctly';
    ELSE
        RAISE WARNING '✗ Referrer count was not updated';
    END IF;
    
    -- Clean up test data
    DELETE FROM referrals WHERE referrer_id = referrer_id OR referred_id = referred_id;
    DELETE FROM users WHERE id IN (referrer_id, referred_id);
    
    RAISE NOTICE 'Test completed and cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Test failed with error: %', SQLERRM;
END $$;

-- Check current referral system status
SELECT 
    COUNT(*) as total_users_with_codes,
    COUNT(CASE WHEN total_referrals > 0 THEN 1 END) as users_with_referrals,
    SUM(total_referrals) as total_referrals_made,
    SUM(referral_count) as total_successful_referrals
FROM users 
WHERE referral_code IS NOT NULL;

-- Show referral analytics if any exist
SELECT * FROM referral_analytics LIMIT 10; 