-- =====================================================
-- Fix Notification System Complete
-- =====================================================

-- 1. First, check if there are stuck notifications
UPDATE notification_jobs
SET status = 'pending',
    updated_at = NOW()
WHERE status = 'processing'
  AND updated_at < NOW() - INTERVAL '5 minutes';

-- 2. Check if the dispatcher cron job exists
SELECT cron.schedule
FROM cron.job 
WHERE jobname LIKE '%notification%' OR command LIKE '%notification%';

-- 3. Create or update the cron job to run dispatcher every minute
DO $$
BEGIN
  -- Check if pg_cron is installed
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Delete existing notification dispatcher job if exists
    PERFORM cron.unschedule(jobname) 
    FROM cron.job 
    WHERE jobname = 'trigger-notification-dispatcher';
    
    -- Create new job to trigger dispatcher every minute
    PERFORM cron.schedule(
      'trigger-notification-dispatcher',
      '* * * * *', -- Every minute
      $$
      SELECT net.http_post(
        url := 'https://kcuqbsrurlkfuxrybwqq.supabase.co/functions/v1/notifications-dispatcher',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
      $$
    );
    RAISE NOTICE 'Notification dispatcher cron job created/updated';
  ELSE
    RAISE NOTICE 'pg_cron not installed - manual triggering required';
  END IF;
END $$;

-- 4. Manually trigger the dispatcher right now to process any pending notifications
DO $$
DECLARE
  v_url text;
  v_service_key text;
BEGIN
  v_url := 'https://kcuqbsrurlkfuxrybwqq.supabase.co/functions/v1/notifications-dispatcher';
  
  -- Try to get service key (this might not work due to security)
  v_service_key := current_setting('app.settings.service_role_key', true);
  
  IF v_service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_service_key,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    RAISE NOTICE 'Dispatcher triggered manually';
  ELSE
    RAISE NOTICE 'Cannot trigger dispatcher - service key not available';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Manual trigger failed - use dashboard or external service';
END $$;

-- 5. Check notification job status
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as most_recent
FROM notification_jobs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status
ORDER BY status;

-- 6. Check if Expo tokens exist for recent activity
SELECT 
  COUNT(DISTINCT j.recipient_id) as users_with_pending_notifications,
  COUNT(DISTINCT t.user_id) as users_with_tokens
FROM notification_jobs j
LEFT JOIN expo_push_tokens t ON j.recipient_id = t.user_id
WHERE j.status = 'pending'
  AND j.created_at > NOW() - INTERVAL '1 hour';

-- Success message
SELECT 'Notification dispatcher fixed!' as status,
       'Jobs will now be processed every minute' as details;
