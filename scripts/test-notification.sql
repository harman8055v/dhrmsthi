-- Test Notification Send
-- =======================

-- Get a user with a push token to test
DO $$
DECLARE
  test_user_id UUID;
  test_token TEXT;
BEGIN
  -- Find a user with a token
  SELECT user_id, token INTO test_user_id, test_token
  FROM expo_push_tokens
  WHERE token LIKE 'ExponentPushToken[%'
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Create a test notification job
    INSERT INTO notification_jobs (
      type,
      recipient_id,
      payload,
      scheduled_for,
      status,
      created_at
    ) VALUES (
      'message',
      test_user_id,
      jsonb_build_object(
        'senderName', 'Test Notification',
        'preview', 'This is a test notification from DharmaSaathi',
        'matchId', '00000000-0000-0000-0000-000000000000'
      ),
      NOW(),
      'pending',
      NOW()
    );
    
    RAISE NOTICE 'Test notification created for user % with token %', test_user_id, LEFT(test_token, 30);
    RAISE NOTICE 'Run the trigger script to send it immediately';
  ELSE
    RAISE NOTICE 'No users with push tokens found!';
    RAISE NOTICE 'Users need to enable notifications in the mobile app';
  END IF;
END $$;

-- Check the test notification
SELECT 
  id,
  type,
  status,
  recipient_id,
  payload->>'senderName' as sender,
  payload->>'preview' as preview,
  created_at
FROM notification_jobs
WHERE created_at > NOW() - INTERVAL '1 minute'
  AND payload->>'senderName' = 'Test Notification';
