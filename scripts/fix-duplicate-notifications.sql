-- =====================================================
-- Fix Duplicate Notifications Issue
-- =====================================================
-- This applies the correct notification logic to prevent duplicate notifications

-- 1. Helper function for minute buckets
-- ======================================
CREATE OR REPLACE FUNCTION public._minute_bucket(ts timestamptz default now())
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT floor(extract(epoch from ts) / 60)::bigint::text;
$$;

-- 2. Fix the swipe trigger to handle matches correctly
-- =====================================================
-- When someone likes you back, ONLY send match notification, not like notification
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
  v_reciprocal swipes%rowtype;
  v_user1 uuid;
  v_user2 uuid;
  v_user1_ts timestamptz;
  v_user2_ts timestamptz;
  v_original uuid;
  v_other uuid;
  v_other_name text;
  v_is_match boolean := false;
  v_day_bucket text;
BEGIN
  IF NEW.action IN ('like','superlike') THEN
    -- Check if reciprocal like exists first
    SELECT * INTO v_reciprocal
    FROM public.swipes
    WHERE swiper_id = NEW.swiped_id 
      AND swiped_id = NEW.swiper_id 
      AND action IN ('like','superlike')
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND THEN
      -- This is a match! Only send match notification to original liker
      -- DO NOT send like notification
      v_is_match := true;
      v_user1 := least(NEW.swiper_id, NEW.swiped_id);
      v_user2 := greatest(NEW.swiper_id, NEW.swiped_id);

      -- Determine who liked first via timestamps
      SELECT created_at INTO v_user1_ts 
      FROM public.swipes 
      WHERE swiper_id = v_user1 
        AND swiped_id = v_user2 
        AND action IN ('like','superlike') 
      ORDER BY created_at ASC 
      LIMIT 1;
      
      SELECT created_at INTO v_user2_ts 
      FROM public.swipes 
      WHERE swiper_id = v_user2 
        AND swiped_id = v_user1 
        AND action IN ('like','superlike') 
      ORDER BY created_at ASC 
      LIMIT 1;

      IF v_user2_ts IS NULL OR (v_user1_ts IS NOT NULL AND v_user1_ts < v_user2_ts) THEN
        v_original := v_user1;
        v_other := v_user2;
      ELSE
        v_original := v_user2;
        v_other := v_user1;
      END IF;

      -- Add day bucket to dedupe key
      v_day_bucket := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
      v_dedupe := 'match:' || v_user1::text || ':' || v_user2::text || ':' || v_day_bucket;

      -- Resolve other name
      SELECT trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')) 
      INTO v_other_name 
      FROM public.users u 
      WHERE u.id = v_other;
      
      IF v_other_name IS NULL OR length(trim(v_other_name)) = 0 THEN 
        v_other_name := 'your match'; 
      END IF;

      -- Only send match notification to the original liker
      PERFORM public.enqueue_notification_job(
        'match',
        v_original,
        jsonb_build_object('otherUserId', v_other, 'otherName', v_other_name),
        now(),
        v_dedupe
      );
    ELSE
      -- No reciprocal like exists, send regular like/superlike notification
      v_type := CASE WHEN NEW.action = 'superlike' THEN 'superlike' ELSE 'like' END;
      v_bucket := public._minute_bucket(now());
      v_dedupe := v_type || ':' || NEW.swiped_id::text || ':' || NEW.swiper_id::text || ':' || v_bucket;

      PERFORM public.enqueue_notification_job(
        v_type,
        NEW.swiped_id,
        jsonb_build_object('fromUserId', NEW.swiper_id),
        now(),
        v_dedupe
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Fix the match trigger to use same dedupe logic
-- ==================================================
-- Only notify the original liker when a match is created
CREATE OR REPLACE FUNCTION public.enqueue_job_on_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user1_ts timestamptz;
  v_user2_ts timestamptz;
  v_original uuid;
  v_other uuid;
  v_other_name text;
  v_dedupe text;
  v_day_bucket text;
  v_pair_min uuid;
  v_pair_max uuid;
BEGIN
  -- Look up earliest like times in both directions
  SELECT created_at INTO v_user1_ts
  FROM public.swipes
  WHERE swiper_id = NEW.user1_id 
    AND swiped_id = NEW.user2_id 
    AND action IN ('like','superlike')
  ORDER BY created_at ASC 
  LIMIT 1;

  SELECT created_at INTO v_user2_ts
  FROM public.swipes
  WHERE swiper_id = NEW.user2_id 
    AND swiped_id = NEW.user1_id 
    AND action IN ('like','superlike')
  ORDER BY created_at ASC 
  LIMIT 1;

  IF v_user1_ts IS NULL AND v_user2_ts IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine who liked first (original liker gets the notification)
  IF v_user2_ts IS NULL OR (v_user1_ts IS NOT NULL AND v_user1_ts < v_user2_ts) THEN
    v_original := NEW.user1_id;
    v_other := NEW.user2_id;
  ELSE
    v_original := NEW.user2_id;
    v_other := NEW.user1_id;
  END IF;

  -- Resolve other name for richer notification
  SELECT trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,''))
  INTO v_other_name
  FROM public.users u
  WHERE u.id = v_other;

  IF v_other_name IS NULL OR length(trim(v_other_name)) = 0 THEN
    v_other_name := 'your match';
  END IF;

  -- Day-bucketed dedupe aligned with swipe trigger
  v_pair_min := least(NEW.user1_id, NEW.user2_id);
  v_pair_max := greatest(NEW.user1_id, NEW.user2_id);
  v_day_bucket := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_dedupe := 'match:' || v_pair_min::text || ':' || v_pair_max::text || ':' || v_day_bucket;

  -- Only notify the original liker
  PERFORM public.enqueue_notification_job(
    'match',
    v_original,
    jsonb_build_object('otherUserId', v_other, 'otherName', v_other_name, 'matchId', NEW.id),
    now(),
    v_dedupe
  );

  RETURN NEW;
END;
$$;

-- 4. Recreate triggers with correct functions
-- ============================================
DROP TRIGGER IF EXISTS trg_enqueue_job_on_swipe ON public.swipes;
CREATE TRIGGER trg_enqueue_job_on_swipe
AFTER INSERT ON public.swipes
FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_on_swipe();

DROP TRIGGER IF EXISTS trg_enqueue_job_on_match ON public.matches;
CREATE TRIGGER trg_enqueue_job_on_match
AFTER INSERT ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_on_match();

-- Keep message trigger as is
DROP TRIGGER IF EXISTS trg_enqueue_job_on_message ON public.messages;
CREATE TRIGGER trg_enqueue_job_on_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_on_message();

-- 5. Clean up any duplicate notifications from the last hour
-- ===========================================================
-- Mark duplicate notifications as cancelled so they won't be sent
UPDATE notification_jobs
SET status = 'cancelled',
    updated_at = now()
WHERE id IN (
  SELECT j2.id
  FROM notification_jobs j1
  JOIN notification_jobs j2 ON 
    j1.recipient_id = j2.recipient_id
    AND j1.created_at < j2.created_at
    AND j1.created_at > now() - interval '1 hour'
    AND j2.created_at > now() - interval '1 hour'
  WHERE 
    j1.type = 'match' 
    AND j2.type IN ('like', 'superlike')
    AND j1.status = 'pending'
    AND j2.status = 'pending'
);

-- 6. Verify the fix
-- =================
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
SELECT 'Duplicate notification issue fixed!' as status,
       'When someone likes you back, you will only get a match notification (not both like + match)' as details;
