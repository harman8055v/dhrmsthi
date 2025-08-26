-- Complete Notification System Diagnosis
-- =======================================

-- 1. Check if users have Expo push tokens
SELECT 
  'Expo Tokens' as check_name,
  COUNT(DISTINCT user_id) as users_with_tokens,
  COUNT(*) as total_tokens,
  MAX(created_at) as newest_token
FROM expo_push_tokens
WHERE token LIKE 'ExponentPushToken[%';

-- 2. Check notification jobs in last hour
SELECT 
  'Recent Jobs' as check_name,
  type,
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM notification_jobs 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY type, status
ORDER BY status, type;

-- 3. Find users who should get notifications but don't have tokens
SELECT 
  'Missing Tokens' as check_name,
  COUNT(DISTINCT j.recipient_id) as users_needing_notifications,
  COUNT(DISTINCT t.user_id) as users_with_tokens
FROM notification_jobs j
LEFT JOIN expo_push_tokens t ON j.recipient_id = t.user_id
WHERE j.created_at > NOW() - INTERVAL '1 hour';

-- 4. Check specific recent jobs with token status
SELECT 
  j.id,
  j.type,
  j.status,
  j.created_at,
  j.recipient_id,
  CASE 
    WHEN t.token IS NOT NULL THEN 'Has token: ' || LEFT(t.token, 30) || '...'
    ELSE 'NO TOKEN - Cannot deliver!'
  END as token_status
FROM notification_jobs j
LEFT JOIN expo_push_tokens t ON j.recipient_id = t.user_id
WHERE j.created_at > NOW() - INTERVAL '30 minutes'
ORDER BY j.created_at DESC
LIMIT 10;

-- 5. Check if notification analytics show delivery
SELECT 
  'Analytics' as check_name,
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM notification_analytics
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;

-- 6. Force reset stuck processing jobs
UPDATE notification_jobs
SET status = 'pending',
    updated_at = NOW()
WHERE status = 'processing'
  AND updated_at < NOW() - INTERVAL '5 minutes'
RETURNING id, type, status;
