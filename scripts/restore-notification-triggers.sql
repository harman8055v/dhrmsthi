-- =====================================================
-- Restore Notification Triggers
-- =====================================================
-- This script restores the notification triggers that may have been dropped

-- 1. Restore the notification job enqueue function
-- =================================================
CREATE OR REPLACE FUNCTION public.enqueue_notification_job(
  job_type text,
  recipient_id uuid,
  payload jsonb,
  scheduled_for timestamptz DEFAULT now(),
  dedupe_key text DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_jobs (
    type,
    recipient_id,
    payload,
    scheduled_for,
    dedupe_key,
    status,
    created_at
  ) VALUES (
    job_type,
    recipient_id,
    payload,
    scheduled_for,
    dedupe_key,
    'pending',
    now()
  )
  ON CONFLICT (dedupe_key) DO NOTHING
  WHERE dedupe_key IS NOT NULL;
  
  -- If no dedupe_key, always insert
  IF dedupe_key IS NULL THEN
    INSERT INTO notification_jobs (
      type,
      recipient_id,
      payload,
      scheduled_for,
      status,
      created_at
    ) VALUES (
      job_type,
      recipient_id,
      payload,
      scheduled_for,
      'pending',
      now()
    );
  END IF;
END;
$$;

-- 2. Restore message notification trigger function
-- ================================================
CREATE OR REPLACE FUNCTION public.enqueue_job_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient uuid;
  v_preview text;
  v_bucket text;
  v_dedupe text;
BEGIN
  -- Determine recipient (other user in the match)
  SELECT CASE WHEN m.user1_id = NEW.sender_id THEN m.user2_id ELSE m.user1_id END
    INTO v_recipient
  FROM public.matches m
  WHERE m.id = NEW.match_id;

  IF v_recipient IS NULL THEN
    RETURN NEW;
  END IF;

  v_preview := LEFT(COALESCE(NEW.content, ''), 140);
  v_bucket := floor(extract(epoch from now()) / 60)::bigint::text;
  v_dedupe := 'msg:' || NEW.match_id::text || ':' || v_recipient::text || ':' || v_bucket;

  PERFORM public.enqueue_notification_job(
    'message',
    v_recipient,
    jsonb_build_object(
      'preview', v_preview,
      'matchId', NEW.match_id,
      'senderId', NEW.sender_id
    ),
    now(),
    v_dedupe
  );

  RETURN NEW;
END;
$$;

-- 3. Create the trigger on messages table
-- ========================================
DROP TRIGGER IF EXISTS trg_enqueue_job_on_message ON public.messages;
CREATE TRIGGER trg_enqueue_job_on_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_on_message();

-- 4. Restore swipe notification trigger function
-- ===============================================
CREATE OR REPLACE FUNCTION public.enqueue_job_on_swipe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_bucket text;
  v_dedupe text;
BEGIN
  IF NEW.action NOT IN ('like','superlike') THEN
    RETURN NEW;
  END IF;

  v_type := CASE WHEN NEW.action = 'superlike' THEN 'superlike' ELSE 'like' END;
  v_bucket := floor(extract(epoch from now()) / 60)::bigint::text;
  v_dedupe := v_type || ':' || NEW.swiper_id::text || ':' || NEW.swiped_id::text || ':' || v_bucket;

  PERFORM public.enqueue_notification_job(
    v_type,
    NEW.swiped_id,
    jsonb_build_object(
      'swiperId', NEW.swiper_id,
      'swipeId', NEW.id
    ),
    now(),
    v_dedupe
  );

  RETURN NEW;
END;
$$;

-- 5. Create the trigger on swipes table
-- ======================================
DROP TRIGGER IF EXISTS trg_enqueue_job_on_swipe ON public.swipes;
CREATE TRIGGER trg_enqueue_job_on_swipe
AFTER INSERT ON public.swipes
FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_on_swipe();

-- 6. Restore match notification trigger function
-- ===============================================
CREATE OR REPLACE FUNCTION public.enqueue_job_on_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bucket text;
  v_dedupe text;
BEGIN
  v_bucket := floor(extract(epoch from now()) / 60)::bigint::text;
  
  -- Notify both users about the match
  v_dedupe := 'match:' || NEW.user1_id::text || ':' || NEW.user2_id::text || ':' || v_bucket;
  
  PERFORM public.enqueue_notification_job(
    'match',
    NEW.user1_id,
    jsonb_build_object(
      'matchId', NEW.id,
      'otherUserId', NEW.user2_id
    ),
    now(),
    v_dedupe || ':user1'
  );
  
  PERFORM public.enqueue_notification_job(
    'match',
    NEW.user2_id,
    jsonb_build_object(
      'matchId', NEW.id,
      'otherUserId', NEW.user1_id
    ),
    now(),
    v_dedupe || ':user2'
  );

  RETURN NEW;
END;
$$;

-- 7. Create the trigger on matches table
-- =======================================
DROP TRIGGER IF EXISTS trg_enqueue_job_on_match ON public.matches;
CREATE TRIGGER trg_enqueue_job_on_match
AFTER INSERT ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_on_match();

-- 8. Verify triggers are created
-- ==============================
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN ('messages', 'matches', 'swipes')
AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Success message
SELECT 'Notification triggers restored successfully!' as status;
