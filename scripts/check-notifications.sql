-- Check notification system health
-- ==================================

-- 1. Check recent notification jobs
SELECT 
  type,
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM notification_jobs 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY type, status
ORDER BY type, status;

-- 2. Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('enqueue_notification_job', 'enqueue_job_on_message', 'enqueue_job_on_swipe', 'enqueue_job_on_match', '_minute_bucket')
ORDER BY routine_name;

-- 3. Check recent swipes to see if they should have triggered notifications
SELECT 
  s.id,
  s.action,
  s.created_at,
  s.swiper_id,
  s.swiped_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM swipes s2 
      WHERE s2.swiper_id = s.swiped_id 
        AND s2.swiped_id = s.swiper_id 
        AND s2.action IN ('like', 'superlike')
        AND s2.created_at < s.created_at
    ) THEN 'Should trigger MATCH notification'
    ELSE 'Should trigger LIKE notification'
  END as expected_notification
FROM swipes s
WHERE s.created_at > NOW() - INTERVAL '30 minutes'
  AND s.action IN ('like', 'superlike')
ORDER BY s.created_at DESC
LIMIT 5;

-- 4. Check recent messages
SELECT 
  m.id,
  m.match_id,
  m.sender_id,
  m.created_at,
  'Should trigger MESSAGE notification' as expected
FROM messages m
WHERE m.created_at > NOW() - INTERVAL '30 minutes'
ORDER BY m.created_at DESC
LIMIT 5;

-- 5. Check if there are any errors in notification jobs
SELECT 
  id,
  type,
  status,
  error,
  created_at
FROM notification_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
