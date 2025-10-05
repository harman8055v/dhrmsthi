--
-- PostgreSQL database dump
--

\restrict 5eUSGaCy8foNckKqNvSH4xTtaCQXkgo2hFbQpHgnc53qdr0irJogLOUnFCWkb7g

-- Dumped from database version 17.4
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: account_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.account_status_enum AS ENUM (
    'active',
    'premium',
    'suspended',
    'deleted'
);


ALTER TYPE public.account_status_enum OWNER TO postgres;

--
-- Name: verification_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.verification_status_enum AS ENUM (
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE public.verification_status_enum OWNER TO postgres;

--
-- Name: _minute_bucket(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public._minute_bucket(ts timestamp with time zone DEFAULT now()) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT floor(extract(epoch from ts) / 60)::bigint::text;
$$;


ALTER FUNCTION public._minute_bucket(ts timestamp with time zone) OWNER TO postgres;

--
-- Name: allocate_monthly_superlikes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.allocate_monthly_superlikes() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    updated_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Loop through all active users and allocate Super Likes based on their plan
    FOR user_record IN 
        SELECT id, account_status, super_likes_count 
        FROM users 
        WHERE account_status IN ('drishti', 'sparsh', 'sangam', 'samarpan')
        AND (premium_expires_at IS NULL OR premium_expires_at > NOW())
    LOOP
        -- Allocate Super Likes based on plan
        CASE user_record.account_status
            WHEN 'drishti' THEN
                -- Drishti: 0 Super Likes per month (no allocation)
                NULL;
            WHEN 'sparsh' THEN
                -- Sparsh: 0 Super Likes per month (no allocation)
                NULL;
            WHEN 'sangam' THEN
                -- Sangam: 5 Super Likes per month
                UPDATE users 
                SET super_likes_count = 5,
                    updated_at = NOW()
                WHERE id = user_record.id;
                updated_count := updated_count + 1;
            WHEN 'samarpan' THEN
                -- Samarpan: 15 Super Likes per month
                UPDATE users 
                SET super_likes_count = 15,
                    updated_at = NOW()
                WHERE id = user_record.id;
                updated_count := updated_count + 1;
        END CASE;
    END LOOP;
    
    -- Log the allocation
    INSERT INTO system_logs (event_type, message, created_at)
    VALUES (
        'monthly_superlikes_allocation',
        'Allocated monthly Super Likes to ' || updated_count || ' users',
        NOW()
    );
    
    RETURN updated_count;
END;
$$;


ALTER FUNCTION public.allocate_monthly_superlikes() OWNER TO postgres;

--
-- Name: FUNCTION allocate_monthly_superlikes(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.allocate_monthly_superlikes() IS 'Allocates monthly Super Likes to all users based on their account_status. Should be run monthly via cron job.';


--
-- Name: allocate_user_superlikes(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.allocate_user_superlikes(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    user_plan TEXT;
BEGIN
    -- Get user's current plan
    SELECT account_status INTO user_plan 
    FROM users 
    WHERE id = p_user_id;
    
    -- Allocate based on plan
    CASE user_plan
        WHEN 'drishti' THEN
            -- Drishti: 0 Super Likes
            UPDATE users SET super_likes_count = 0 WHERE id = p_user_id;
        WHEN 'sparsh' THEN
            -- Sparsh: 0 Super Likes
            UPDATE users SET super_likes_count = 0 WHERE id = p_user_id;
        WHEN 'sangam' THEN
            -- Sangam: 5 Super Likes
            UPDATE users SET super_likes_count = 5 WHERE id = p_user_id;
        WHEN 'samarpan' THEN
            -- Samarpan: 15 Super Likes
            UPDATE users SET super_likes_count = 15 WHERE id = p_user_id;
    END CASE;
END;
$$;


ALTER FUNCTION public.allocate_user_superlikes(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION allocate_user_superlikes(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.allocate_user_superlikes(p_user_id uuid) IS 'Allocates Super Likes for a specific user based on their current plan. Useful for immediate allocation after plan changes.';


--
-- Name: can_user_swipe(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.can_user_swipe(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_plan TEXT;
  daily_limit INTEGER;
  swipes_used INTEGER;
BEGIN
  -- Get user's current plan
  SELECT account_status INTO user_plan 
  FROM users 
  WHERE id = p_user_id;
  
  -- If user not found, deny swipe
  IF user_plan IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Set daily limits based on account_status
  CASE user_plan
    WHEN 'sparsh' THEN daily_limit := 20;
    WHEN 'sangam' THEN daily_limit := 50;
    WHEN 'samarpan' THEN daily_limit := -1; -- Unlimited
    ELSE daily_limit := 5; -- Drishti (free)
  END CASE;
  
  -- If unlimited plan, allow swipe immediately
  IF daily_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Get today's swipe count directly (avoid function call)
  SELECT COALESCE(swipes_used, 0) INTO swipes_used
  FROM user_daily_stats 
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  -- If no record exists, user hasn't swiped today
  IF swipes_used IS NULL THEN
    swipes_used := 0;
  END IF;
  
  -- Check if user has reached their daily limit
  RETURN swipes_used < daily_limit;
END;
$$;


ALTER FUNCTION public.can_user_swipe(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION can_user_swipe(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.can_user_swipe(p_user_id uuid) IS 'Checks if a user can perform a swipe based on their plan limits and daily usage';


--
-- Name: cancel_like_jobs_on_match(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cancel_like_jobs_on_match() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  update public.notification_jobs
    set status = 'cancelled', updated_at = now()
  where status in ('pending','processing')
    and type in ('like','superlike')
    and (
      (recipient_id = new.user1_id and (payload->>'fromUserId')::uuid = new.user2_id) or
      (recipient_id = new.user2_id and (payload->>'fromUserId')::uuid = new.user1_id)
    );

  return new;
end;
$$;


ALTER FUNCTION public.cancel_like_jobs_on_match() OWNER TO postgres;

--
-- Name: cleanup_expired_notifications(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_notifications() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_notifications() OWNER TO postgres;

--
-- Name: cleanup_expired_otps(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_otps() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Delete verified OTPs older than 1 hour
  DELETE FROM otp_verifications 
  WHERE verified_at IS NOT NULL 
  AND verified_at < NOW() - INTERVAL '1 hour';
  
  -- Delete unverified expired OTPs older than 1 day
  DELETE FROM otp_verifications 
  WHERE verified_at IS NULL 
  AND expires_at < NOW() - INTERVAL '1 day';
  
  -- Delete mobile session tokens older than 10 minutes
  DELETE FROM otp_verifications 
  WHERE purpose = 'mobile_session' 
  AND expires_at < NOW();
END;
$$;


ALTER FUNCTION public.cleanup_expired_otps() OWNER TO postgres;

--
-- Name: create_notification_from_template(character varying, uuid, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_notification_from_template(template_type character varying, recipient_uuid uuid, sender_uuid uuid DEFAULT NULL::uuid, template_data jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  template RECORD;
  notification_id UUID;
  rendered_title VARCHAR;
  rendered_message TEXT;
  rendered_action_url TEXT;
  expires_at_calc TIMESTAMPTZ;
  key_record RECORD;
BEGIN
  -- Get template
  SELECT * INTO template FROM notification_templates 
  WHERE type = template_type AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification template not found: %', template_type;
  END IF;
  
  -- Check if user should receive this notification
  IF NOT should_send_notification(recipient_uuid, template.type, template.category, template.priority) THEN
    RETURN NULL; -- User preferences block this notification
  END IF;
  
  -- Render templates with data
  rendered_title := template.title_template;
  rendered_message := template.message_template;
  rendered_action_url := template.action_url_template;
  
  -- Replace template variables
  FOR key_record IN SELECT jsonb_object_keys(template_data) AS key_name LOOP
    rendered_title := REPLACE(rendered_title, '{{' || key_record.key_name || '}}', template_data->>key_record.key_name);
    rendered_message := REPLACE(rendered_message, '{{' || key_record.key_name || '}}', template_data->>key_record.key_name);
    IF rendered_action_url IS NOT NULL THEN
      rendered_action_url := REPLACE(rendered_action_url, '{{' || key_record.key_name || '}}', template_data->>key_record.key_name);
    END IF;
  END LOOP;
  
  -- Calculate expiration
  IF template.expires_after_hours IS NOT NULL THEN
    expires_at_calc := NOW() + (template.expires_after_hours || ' hours')::INTERVAL;
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    type,
    category,
    priority,
    title,
    message,
    data,
    action_url,
    image_url,
    expires_at
  ) VALUES (
    recipient_uuid,
    sender_uuid,
    template.type,
    template.category,
    template.priority,
    rendered_title,
    rendered_message,
    template_data,
    NULLIF(rendered_action_url, ''),
    template.image_url,
    expires_at_calc
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;


ALTER FUNCTION public.create_notification_from_template(template_type character varying, recipient_uuid uuid, sender_uuid uuid, template_data jsonb) OWNER TO postgres;

--
-- Name: FUNCTION create_notification_from_template(template_type character varying, recipient_uuid uuid, sender_uuid uuid, template_data jsonb); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.create_notification_from_template(template_type character varying, recipient_uuid uuid, sender_uuid uuid, template_data jsonb) IS 'Creates notifications using predefined templates';


--
-- Name: decrement_daily_swipe(uuid, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.decrement_daily_swipe(p_user_id uuid, p_date date DEFAULT CURRENT_DATE) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update existing daily stats or create if doesn't exist
  INSERT INTO user_daily_stats (user_id, date, swipes_used, superlikes_used, message_highlights_used)
  VALUES (p_user_id, p_date, 0, 0, 0)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    swipes_used = GREATEST(user_daily_stats.swipes_used - 1, 0),
    updated_at = CURRENT_TIMESTAMP;
END;
$$;


ALTER FUNCTION public.decrement_daily_swipe(p_user_id uuid, p_date date) OWNER TO postgres;

--
-- Name: enqueue_job_on_match(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enqueue_job_on_match() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


ALTER FUNCTION public.enqueue_job_on_match() OWNER TO postgres;

--
-- Name: enqueue_job_on_message(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enqueue_job_on_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


ALTER FUNCTION public.enqueue_job_on_message() OWNER TO postgres;

--
-- Name: enqueue_job_on_swipe(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enqueue_job_on_swipe() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


ALTER FUNCTION public.enqueue_job_on_swipe() OWNER TO postgres;

--
-- Name: enqueue_notification_job(text, uuid, jsonb, timestamp with time zone, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enqueue_notification_job(p_type text, p_recipient_id uuid, p_payload jsonb DEFAULT '{}'::jsonb, p_scheduled_at timestamp with time zone DEFAULT now(), p_dedupe_key text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  v_id uuid;
begin
  if p_dedupe_key is not null then
    insert into public.notification_jobs(type, recipient_id, payload, scheduled_at, dedupe_key)
    values (p_type, p_recipient_id, coalesce(p_payload, '{}'::jsonb), coalesce(p_scheduled_at, now()), p_dedupe_key)
    on conflict (dedupe_key) do nothing
    returning id into v_id;
  else
    insert into public.notification_jobs(type, recipient_id, payload, scheduled_at)
    values (p_type, p_recipient_id, coalesce(p_payload, '{}'::jsonb), coalesce(p_scheduled_at, now()))
    returning id into v_id;
  end if;

  return v_id;
end;
$$;


ALTER FUNCTION public.enqueue_notification_job(p_type text, p_recipient_id uuid, p_payload jsonb, p_scheduled_at timestamp with time zone, p_dedupe_key text) OWNER TO postgres;

--
-- Name: extract_daily_practices(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.extract_daily_practices(input_text text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
    practices text[];
    temp_array text[];
BEGIN
    practices := '{}';
    
    -- First, try to extract any text between quotes that looks like a practice
    -- This regex finds quoted strings that are actual words (not single characters)
    temp_array := ARRAY(
        SELECT DISTINCT matches[1]
        FROM regexp_matches(input_text, '"([A-Za-z][A-Za-z\s/\-]+)"', 'g') AS matches
        WHERE length(matches[1]) > 2  -- Ignore single characters
    );
    
    -- Add any found practices
    IF array_length(temp_array, 1) > 0 THEN
        practices := temp_array;
    END IF;
    
    -- Also check for known practices that might appear without quotes
    IF input_text LIKE '%Morning Prayer%' AND NOT ('Morning Prayer' = ANY(practices)) THEN
        practices := array_append(practices, 'Morning Prayer');
    END IF;
    
    IF input_text LIKE '%Evening Prayer%' AND NOT ('Evening Prayer' = ANY(practices)) THEN
        practices := array_append(practices, 'Evening Prayer');
    END IF;
    
    IF input_text LIKE '%Japa%' AND input_text NOT LIKE '%J","a","p","a%' AND NOT ('Japa' = ANY(practices)) THEN
        practices := array_append(practices, 'Japa');
    END IF;
    
    RETURN practices;
END;
$$;


ALTER FUNCTION public.extract_daily_practices(input_text text) OWNER TO postgres;

--
-- Name: generate_referral_code(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_referral_code() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    code VARCHAR(10);
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character code
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;
        
        -- If it doesn't exist, we can use it
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION public.generate_referral_code() OWNER TO postgres;

--
-- Name: get_notification_counts(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_notification_counts(user_uuid uuid) RETURNS TABLE(total_count bigint, unread_count bigint, social_count bigint, marketing_count bigint, system_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE NOT is_read) as unread_count,
    COUNT(*) FILTER (WHERE category = 'social' AND NOT is_read) as social_count,
    COUNT(*) FILTER (WHERE category = 'marketing' AND NOT is_read) as marketing_count,
    COUNT(*) FILTER (WHERE category = 'system' AND NOT is_read) as system_count
  FROM notifications
  WHERE recipient_id = user_uuid
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$;


ALTER FUNCTION public.get_notification_counts(user_uuid uuid) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: user_daily_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_daily_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    swipes_used integer DEFAULT 0,
    superlikes_used integer DEFAULT 0,
    message_highlights_used integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_daily_stats OWNER TO postgres;

--
-- Name: get_or_create_daily_stats(uuid, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_or_create_daily_stats(p_user_id uuid, p_date date DEFAULT CURRENT_DATE) RETURNS public.user_daily_stats
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  stats user_daily_stats;
BEGIN
  -- Try to get existing stats record
  SELECT * INTO stats 
  FROM user_daily_stats 
  WHERE user_id = p_user_id AND date = p_date;
  
  -- If not found, create new record
  IF NOT FOUND THEN
    INSERT INTO user_daily_stats (
      user_id, 
      date, 
      swipes_used, 
      superlikes_used, 
      message_highlights_used,
      created_at,
      updated_at
    ) 
    VALUES (
      p_user_id, 
      p_date, 
      0, 
      0, 
      0,
      now(),
      now()
    ) 
    RETURNING * INTO stats;
  END IF;
  
  RETURN stats;
END;
$$;


ALTER FUNCTION public.get_or_create_daily_stats(p_user_id uuid, p_date date) OWNER TO postgres;

--
-- Name: get_referral_stats_safe(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_referral_stats_safe(user_id uuid) RETURNS TABLE(total_referrals integer, successful_referrals integer, pending_referrals integer, total_rewards integer)
    LANGUAGE plpgsql
    AS $_$
DECLARE
    has_referred_id boolean;
    has_referred_user_id boolean;
    query_text text;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referred_id'
    ) INTO has_referred_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referred_user_id'
    ) INTO has_referred_user_id;
    
    -- Build query based on available columns
    IF has_referred_id THEN
        query_text := 'SELECT 
            COUNT(*)::INTEGER as total_referrals,
            COUNT(CASE WHEN r.status = ''completed'' THEN 1 END)::INTEGER as successful_referrals,
            COUNT(CASE WHEN r.status = ''pending'' THEN 1 END)::INTEGER as pending_referrals,
            COALESCE(SUM(COALESCE(r.reward_amount, 0)), 0)::INTEGER as total_rewards
        FROM referrals r
        WHERE r.referrer_id = $1';
    ELSIF has_referred_user_id THEN
        query_text := 'SELECT 
            COUNT(*)::INTEGER as total_referrals,
            COUNT(CASE WHEN r.status = ''completed'' THEN 1 END)::INTEGER as successful_referrals,
            COUNT(CASE WHEN r.status = ''pending'' THEN 1 END)::INTEGER as pending_referrals,
            COALESCE(SUM(COALESCE(r.reward_amount, 0)), 0)::INTEGER as total_rewards
        FROM referrals r
        WHERE r.referrer_id = $1';
    ELSE
        -- Return zeros if no referrals table structure is recognized
        RETURN QUERY SELECT 0, 0, 0, 0;
        RETURN;
    END IF;
    
    RETURN QUERY EXECUTE query_text USING user_id;
END;
$_$;


ALTER FUNCTION public.get_referral_stats_safe(user_id uuid) OWNER TO postgres;

--
-- Name: get_schema_script(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_schema_script() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    result text;
BEGIN
    -- Get the schema definitions
    SELECT string_agg(definition, E'\n\n')
    INTO result
    FROM (
        -- Tables (including column definitions, constraints, indexes)
        SELECT format(
            E'-- Table: %s\n%s;',
            table_name,
            pg_get_tabledef(table_name)
        ) AS definition
        FROM (
            SELECT table_schema || '.' || table_name AS table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            AND table_type = 'BASE TABLE'
        ) tables
        
        UNION ALL
        
        -- Views
        SELECT format(
            E'-- View: %s\n%s;',
            view_name,
            pg_get_viewdef(view_name, true)
        ) AS definition
        FROM (
            SELECT table_schema || '.' || table_name AS view_name
            FROM information_schema.views
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ) views
        
        UNION ALL
        
        -- Functions
        SELECT format(
            E'-- Function: %s\n%s;',
            routine_name,
            pg_get_functiondef(routine_name::regproc::oid)
        ) AS definition
        FROM (
            SELECT routine_schema || '.' || routine_name AS routine_name
            FROM information_schema.routines
            WHERE routine_schema NOT IN ('pg_catalog', 'information_schema')
        ) routines
        
        UNION ALL
        
        -- Types (including enums)
        SELECT format(
            E'-- Type: %s\n%s',
            t.typname,
            pg_catalog.pg_get_typedefn(t.oid)
        ) AS definition
        FROM pg_catalog.pg_type t
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND t.typtype = 'e' -- Enum types
        
    ) AS definitions;
    
    RETURN result;
END;
$$;


ALTER FUNCTION public.get_schema_script() OWNER TO postgres;

--
-- Name: get_user_conversations(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_conversations(user_id uuid, limit_count integer DEFAULT 20) RETURNS TABLE(match_id uuid, other_user_id uuid, created_at timestamp with time zone, last_message_at timestamp with time zone, last_message_text text, last_message_sender uuid, last_message_time timestamp with time zone, unread_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id as match_id,
    CASE 
      WHEN cs.user1_id = user_id THEN cs.user2_id 
      ELSE cs.user1_id 
    END as other_user_id,
    cs.created_at,
    cs.last_message_at,
    cs.last_message_text,
    cs.last_message_sender,
    cs.last_message_time,
    CASE 
      WHEN cs.user1_id = user_id THEN cs.user1_unread_count
      ELSE cs.user2_unread_count
    END as unread_count
  FROM conversation_summaries cs
  WHERE cs.user1_id = user_id OR cs.user2_id = user_id
  ORDER BY COALESCE(cs.last_message_time, cs.created_at) DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION public.get_user_conversations(user_id uuid, limit_count integer) OWNER TO postgres;

--
-- Name: get_user_notification_preferences(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_notification_preferences(user_uuid uuid) RETURNS TABLE(social_preferences jsonb, marketing_preferences jsonb, engagement_preferences jsonb, monetization_preferences jsonb, system_preferences jsonb, quiet_hours jsonb, do_not_disturb boolean, push_token text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(unp.social_preferences, '{"messages": true, "likes": true, "superlikes": true, "matches": true}'::JSONB),
    COALESCE(unp.marketing_preferences, '{"promotions": true, "seasonal": true, "features": true, "enabled": true}'::JSONB),
    COALESCE(unp.engagement_preferences, '{"dailyReminders": false, "weeklyDigest": true, "tips": true, "achievements": true, "community": true, "enabled": true}'::JSONB),
    COALESCE(unp.monetization_preferences, '{"subscription": true, "premiumFeatures": true, "enabled": true}'::JSONB),
    COALESCE(unp.system_preferences, '{"general": true, "critical": true}'::JSONB),
    COALESCE(unp.quiet_hours, '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}'::JSONB),
    COALESCE(unp.do_not_disturb, false),
    unp.push_token
  FROM user_notification_preferences unp
  WHERE unp.user_id = user_uuid
  UNION ALL
  SELECT 
    '{"messages": true, "likes": true, "superlikes": true, "matches": true}'::JSONB,
    '{"promotions": true, "seasonal": true, "features": true, "enabled": true}'::JSONB,
    '{"dailyReminders": false, "weeklyDigest": true, "tips": true, "achievements": true, "community": true, "enabled": true}'::JSONB,
    '{"subscription": true, "premiumFeatures": true, "enabled": true}'::JSONB,
    '{"general": true, "critical": true}'::JSONB,
    '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}'::JSONB,
    false,
    NULL::TEXT
  WHERE NOT EXISTS (
    SELECT 1 FROM user_notification_preferences WHERE user_id = user_uuid
  )
  LIMIT 1;
END;
$$;


ALTER FUNCTION public.get_user_notification_preferences(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_notifications(uuid, integer, integer, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_notifications(user_uuid uuid, page_size integer DEFAULT 20, page_offset integer DEFAULT 0, include_read boolean DEFAULT true) RETURNS TABLE(id uuid, sender_id uuid, sender_name text, sender_avatar text, type character varying, category character varying, priority character varying, title character varying, message text, data jsonb, action_url text, image_url text, is_read boolean, is_seen boolean, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.sender_id,
    COALESCE(u.full_name, 'System') as sender_name,
    u.avatar_url as sender_avatar,
    n.type,
    n.category,
    n.priority,
    n.title,
    n.message,
    n.data,
    n.action_url,
    n.image_url,
    n.is_read,
    n.is_seen,
    n.created_at
  FROM notifications n
  LEFT JOIN users u ON n.sender_id = u.id
  WHERE n.recipient_id = user_uuid
    AND (include_read OR NOT n.is_read)
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ORDER BY n.created_at DESC
  LIMIT page_size OFFSET page_offset;
END;
$$;


ALTER FUNCTION public.get_user_notifications(user_uuid uuid, page_size integer, page_offset integer, include_read boolean) OWNER TO postgres;

--
-- Name: get_user_swipe_limit(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_swipe_limit(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_plan TEXT;
BEGIN
  -- Get user's current plan
  SELECT account_status INTO user_plan 
  FROM users 
  WHERE id = p_user_id;
  
  -- If user not found, return free plan limit
  IF user_plan IS NULL THEN
    RETURN 5;
  END IF;
  
  -- Return limits based on plan
  CASE user_plan
    WHEN 'sparsh' THEN RETURN 20;
    WHEN 'sangam' THEN RETURN 50;
    WHEN 'samarpan' THEN RETURN -1; -- Unlimited
    ELSE RETURN 5; -- Drishti (free)
  END CASE;
END;
$$;


ALTER FUNCTION public.get_user_swipe_limit(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_user_swipe_limit(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_user_swipe_limit(p_user_id uuid) IS 'Returns the daily swipe limit for a user based on their plan';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
begin
  begin
    -- use un-qualified http_post now that ‘extensions’ is on search_path
    perform http_post(
      url     := 'https://kcuqbsrurlkfuxrybwqq.functions.supabase.co/send-welcome-email',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object('record', row_to_json(NEW))
    );
  exception when others then                        -- don’t break sign-up
    raise notice 'send-welcome-email failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: handle_referral_signup(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_referral_signup(new_user_id uuid, referral_code text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    referrer_id UUID;
BEGIN
    -- Find referrer by referral code
    SELECT id INTO referrer_id 
    FROM users 
    WHERE users.referral_code = handle_referral_signup.referral_code 
    AND id != new_user_id;
    
    IF referrer_id IS NOT NULL THEN
        -- Create referral record
        INSERT INTO referrals (
            referrer_id,
            referred_id,
            referral_code,
            status,
            created_at
        ) VALUES (
            referrer_id,
            new_user_id,
            handle_referral_signup.referral_code,
            'pending',
            NOW()
        ) ON CONFLICT (referrer_id, referred_id) DO NOTHING;
        
        -- Update referrer's total referral count
        UPDATE users 
        SET total_referrals = COALESCE(total_referrals, 0) + 1,
            updated_at = NOW()
        WHERE id = referrer_id;
        
        RAISE NOTICE 'Referral created: User % referred by % with code %', new_user_id, referrer_id, referral_code;
        RETURN TRUE;
    END IF;
    
    RAISE NOTICE 'Referral code % not found or invalid', referral_code;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION public.handle_referral_signup(new_user_id uuid, referral_code text) OWNER TO postgres;

--
-- Name: increment_daily_swipes(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_daily_swipes(p_user_id uuid, p_action text DEFAULT 'like'::text) RETURNS public.user_daily_stats
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  stats user_daily_stats;
BEGIN
  -- First ensure today's record exists
  INSERT INTO user_daily_stats (user_id, date, swipes_used, superlikes_used, message_highlights_used)
  VALUES (p_user_id, CURRENT_DATE, 0, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  -- Update the counts based on action
  IF p_action = 'superlike' THEN
    UPDATE user_daily_stats 
    SET 
      swipes_used = swipes_used + 1,
      superlikes_used = superlikes_used + 1,
      updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE
    RETURNING * INTO stats;
  ELSE
    UPDATE user_daily_stats 
    SET 
      swipes_used = swipes_used + 1,
      updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE
    RETURNING * INTO stats;
  END IF;
  
  RETURN stats;
END;
$$;


ALTER FUNCTION public.increment_daily_swipes(p_user_id uuid, p_action text) OWNER TO postgres;

--
-- Name: increment_swipe_count(uuid, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_swipe_count(p_user_id uuid, p_date date) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Try to update existing stats
  UPDATE user_daily_stats
  SET swipes_used = COALESCE(swipes_used, 0) + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND date = p_date;
  
  -- If no rows updated, insert new row
  IF NOT FOUND THEN
    INSERT INTO user_daily_stats (user_id, date, swipes_used, likes_sent, superlikes_sent, created_at, updated_at)
    VALUES (p_user_id, p_date, 1, 1, 0, NOW(), NOW())
    ON CONFLICT (user_id, date) DO UPDATE
    SET swipes_used = COALESCE(user_daily_stats.swipes_used, 0) + 1,
        updated_at = NOW();
  END IF;
END;
$$;


ALTER FUNCTION public.increment_swipe_count(p_user_id uuid, p_date date) OWNER TO postgres;

--
-- Name: is_admin_role(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin_role(user_role text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN LOWER(user_role) IN ('admin', 'super_admin', 'superadmin');
END;
$$;


ALTER FUNCTION public.is_admin_role(user_role text) OWNER TO postgres;

--
-- Name: mark_messages_as_read(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_messages_as_read(p_match_id uuid, p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE messages 
  SET read_at = NOW()
  WHERE match_id = p_match_id
    AND sender_id != p_user_id
    AND read_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;


ALTER FUNCTION public.mark_messages_as_read(p_match_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- Name: mark_notifications_read(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_notifications_read(user_uuid uuid, notification_ids uuid[] DEFAULT NULL::uuid[]) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF notification_ids IS NULL THEN
    -- Mark all unread notifications as read
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE recipient_id = user_uuid AND is_read = false;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE recipient_id = user_uuid AND id = ANY(notification_ids);
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;


ALTER FUNCTION public.mark_notifications_read(user_uuid uuid, notification_ids uuid[]) OWNER TO postgres;

--
-- Name: notify_new_like(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_new_like() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  sender_name TEXT;
  notification_type TEXT;
BEGIN
  -- Get sender name
  SELECT COALESCE(full_name, 'Someone') INTO sender_name 
  FROM users WHERE id = NEW.user_id;
  
  -- Determine notification type
  notification_type := CASE 
    WHEN NEW.is_super_like THEN 'superlike'
    ELSE 'like'
  END;
  
  -- Create notification
  PERFORM create_notification_from_template(
    notification_type,
    NEW.liked_user_id,
    NEW.user_id,
    jsonb_build_object(
      'sender_name', sender_name,
      'like_id', NEW.id,
      'is_super_like', NEW.is_super_like
    )
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_new_like() OWNER TO postgres;

--
-- Name: notify_new_match(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_new_match() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user1_name TEXT;
  user2_name TEXT;
BEGIN
  -- Get user names
  SELECT COALESCE(full_name, 'Someone') INTO user1_name 
  FROM users WHERE id = NEW.user1_id;
  
  SELECT COALESCE(full_name, 'Someone') INTO user2_name 
  FROM users WHERE id = NEW.user2_id;
  
  -- Create notification for user1
  PERFORM create_notification_from_template(
    'match',
    NEW.user1_id,
    NEW.user2_id,
    jsonb_build_object(
      'sender_name', user2_name,
      'match_id', NEW.id
    )
  );
  
  -- Create notification for user2
  PERFORM create_notification_from_template(
    'match',
    NEW.user2_id,
    NEW.user1_id,
    jsonb_build_object(
      'sender_name', user1_name,
      'match_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_new_match() OWNER TO postgres;

--
-- Name: notify_new_message(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_new_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  sender_name TEXT;
  message_preview TEXT;
BEGIN
  -- Get sender name
  SELECT COALESCE(full_name, 'Someone') INTO sender_name 
  FROM users WHERE id = NEW.sender_id;
  
  -- Create message preview (first 50 characters)
  message_preview := LEFT(NEW.content, 50);
  IF LENGTH(NEW.content) > 50 THEN
    message_preview := message_preview || '...';
  END IF;
  
  -- Create notification
  PERFORM create_notification_from_template(
    'message',
    NEW.recipient_id,
    NEW.sender_id,
    jsonb_build_object(
      'sender_name', sender_name,
      'message_preview', message_preview,
      'match_id', NEW.match_id,
      'message_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_new_message() OWNER TO postgres;

--
-- Name: poke_notifications_dispatcher(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.poke_notifications_dispatcher() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  -- Fire-and-forget HTTP call; ignore result
  perform net.http_post(
    url := 'https://kcuqbsrurlkfuxrybwqq.supabase.co/functions/v1/notifications-dispatcher',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '"poke"',
    timeout_milliseconds := 1000
  );
  return null; -- AFTER trigger return value is ignored
end;
$$;


ALTER FUNCTION public.poke_notifications_dispatcher() OWNER TO postgres;

--
-- Name: process_referral_completion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_referral_completion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    referrer_id UUID;
    successful_count INTEGER;
BEGIN
    -- Only process if user becomes verified
    IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
        
        -- Update referral status to completed for this user
        UPDATE referrals 
        SET status = 'completed', 
            completed_at = NOW(),
            updated_at = NOW()
        WHERE referred_id = NEW.id 
        AND status = 'pending';
        
        -- Get referrer info
        SELECT r.referrer_id INTO referrer_id
        FROM referrals r 
        WHERE r.referred_id = NEW.id 
        AND r.status = 'completed'
        LIMIT 1;
        
        IF referrer_id IS NOT NULL THEN
            -- Get current successful referral count
            SELECT COUNT(*) INTO successful_count
            FROM referrals r 
            JOIN users u ON r.referred_id = u.id 
            WHERE r.referrer_id = referrer_id 
            AND r.status = 'completed' 
            AND u.verification_status = 'verified';
            
            -- Update referrer's successful referral count
            UPDATE users 
            SET referral_count = successful_count,
                updated_at = NOW()
            WHERE id = referrer_id;
            
            -- Award Fast Track Verification (4 referrals)
            IF successful_count >= 4 AND successful_count < 10 THEN
                UPDATE users 
                SET fast_track_verification = TRUE,
                    updated_at = NOW()
                WHERE id = referrer_id 
                AND fast_track_verification = FALSE;
                
                INSERT INTO referral_rewards (
                    user_id, 
                    reward_type, 
                    reward_value,
                    referrals_required,
                    status, 
                    created_at
                ) VALUES (
                    referrer_id, 
                    'fast_track_verification', 
                    'Priority verification processing',
                    4,
                    'active', 
                    NOW()
                ) ON CONFLICT (user_id, reward_type) DO NOTHING;
                
                RAISE NOTICE 'Fast track verification awarded to user %', referrer_id;
            END IF;
            
            -- Award Sangam Plan (10 referrals)
            IF successful_count >= 10 AND successful_count < 20 THEN
                INSERT INTO referral_rewards (
                    user_id, 
                    reward_type, 
                    reward_value,
                    referrals_required,
                    status, 
                    expires_at,
                    created_at
                ) VALUES (
                    referrer_id, 
                    'sangam_plan_free', 
                    '30 days free Sangam plan access',
                    10,
                    'active', 
                    NOW() + INTERVAL '90 days',
                    NOW()
                ) ON CONFLICT (user_id, reward_type) DO NOTHING;
                
                RAISE NOTICE 'Sangam plan reward awarded to user %', referrer_id;
            END IF;
            
            -- Award Samarpan Plan (20 referrals)
            IF successful_count >= 20 THEN
                INSERT INTO referral_rewards (
                    user_id, 
                    reward_type, 
                    reward_value,
                    referrals_required,
                    status, 
                    expires_at,
                    created_at
                ) VALUES (
                    referrer_id, 
                    'samarpan_plan_free', 
                    '45 days free Samarpan plan access',
                    20,
                    'active', 
                    NOW() + INTERVAL '120 days',
                    NOW()
                ) ON CONFLICT (user_id, reward_type) DO NOTHING;
                
                RAISE NOTICE 'Samarpan plan reward awarded to user %', referrer_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.process_referral_completion() OWNER TO postgres;

--
-- Name: process_referral_reward_safe(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_referral_reward_safe(referrer_uuid uuid, referred_uuid uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    referrer_plan TEXT;
    reward_amount INTEGER := 1; -- Default reward in super_likes
    has_referred_id boolean;
    has_referred_user_id boolean;
    update_query text;
BEGIN
    -- Get referrer's current plan
    SELECT COALESCE(current_plan, 'drishti') INTO referrer_plan
    FROM users WHERE id = referrer_uuid;
    
    -- Set reward based on plan
    CASE referrer_plan
        WHEN 'samarpan' THEN reward_amount := 5;
        WHEN 'sangam' THEN reward_amount := 3;
        WHEN 'sparsh' THEN reward_amount := 2;
        ELSE reward_amount := 1;
    END CASE;
    
    -- Check which columns exist in referrals table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referred_id'
    ) INTO has_referred_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referred_user_id'
    ) INTO has_referred_user_id;
    
    -- Update referral record based on available columns
    IF has_referred_id THEN
        UPDATE referrals 
        SET 
            reward_given = TRUE,
            reward_amount = reward_amount,
            status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE referrer_id = referrer_uuid 
        AND referred_id = referred_uuid;
    ELSIF has_referred_user_id THEN
        UPDATE referrals 
        SET 
            reward_given = TRUE,
            reward_amount = reward_amount,
            status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE referrer_id = referrer_uuid 
        AND referred_user_id = referred_uuid;
    END IF;
    
    -- Add reward to referrer's account
    UPDATE users 
    SET 
        super_likes = COALESCE(super_likes, 0) + reward_amount,
        updated_at = NOW()
    WHERE id = referrer_uuid;
    
    -- Insert reward record
    INSERT INTO referral_rewards (referrer_id, referred_user_id, reward_type, reward_value, status)
    VALUES (referrer_uuid, referred_uuid, 'super_likes', reward_amount, 'completed')
    ON CONFLICT (referrer_id, referred_user_id, reward_type) DO NOTHING;
    
END;
$$;


ALTER FUNCTION public.process_referral_reward_safe(referrer_uuid uuid, referred_uuid uuid) OWNER TO postgres;

--
-- Name: promote_user_to_admin(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.promote_user_to_admin(user_email text, new_role text DEFAULT 'admin'::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    user_found BOOLEAN := FALSE;
BEGIN
    IF new_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role. Must be admin or super_admin';
    END IF;
    
    UPDATE users 
    SET role = new_role, 
        is_active = true,
        updated_at = NOW()
    WHERE email = user_email;
    
    -- Check if any rows were affected
    IF FOUND THEN
        user_found := TRUE;
        RAISE NOTICE 'User % promoted to %', user_email, new_role;
    ELSE
        user_found := FALSE;
        RAISE NOTICE 'User with email % not found', user_email;
    END IF;
    
    RETURN user_found;
END;
$$;


ALTER FUNCTION public.promote_user_to_admin(user_email text, new_role text) OWNER TO postgres;

--
-- Name: protect_message_updates(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_message_updates() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.match_id != NEW.match_id OR 
     OLD.sender_id != NEW.sender_id OR 
     OLD.content != NEW.content OR 
     OLD.created_at != NEW.created_at OR
     OLD.is_highlighted != NEW.is_highlighted THEN
    RAISE EXCEPTION 'Only read_at field can be updated on messages';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.protect_message_updates() OWNER TO postgres;

--
-- Name: set_verification_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_verification_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.verification_status IS NULL THEN
    NEW.verification_status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_verification_status() OWNER TO postgres;

--
-- Name: should_send_notification(uuid, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.should_send_notification(user_uuid uuid, notification_type character varying, notification_category character varying, notification_priority character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  settings RECORD;
  current_hour INTEGER;
  quiet_start INTEGER;
  quiet_end INTEGER;
BEGIN
  -- Get user notification settings
  SELECT * INTO settings FROM notification_settings WHERE user_id = user_uuid;
  
  -- If no settings found, create default settings and allow notification
  IF NOT FOUND THEN
    INSERT INTO notification_settings (user_id) VALUES (user_uuid);
    RETURN TRUE;
  END IF;
  
  -- Check do not disturb
  IF settings.do_not_disturb THEN
    -- Only allow critical notifications during DND
    RETURN notification_priority = 'critical';
  END IF;
  
  -- Check quiet hours
  IF (settings.quiet_hours->>'enabled')::BOOLEAN THEN
    current_hour := EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC');
    quiet_start := (settings.quiet_hours->>'startTime')::TIME;
    quiet_end := (settings.quiet_hours->>'endTime')::TIME;
    
    -- During quiet hours, only allow critical notifications
    IF (quiet_start <= quiet_end AND current_hour >= EXTRACT(HOUR FROM quiet_start) AND current_hour < EXTRACT(HOUR FROM quiet_end))
       OR (quiet_start > quiet_end AND (current_hour >= EXTRACT(HOUR FROM quiet_start) OR current_hour < EXTRACT(HOUR FROM quiet_end))) THEN
      RETURN notification_priority = 'critical';
    END IF;
  END IF;
  
  -- Check category-specific preferences
  CASE notification_category
    WHEN 'social' THEN
      CASE notification_type
        WHEN 'message' THEN RETURN (settings.social_notifications->>'messages')::BOOLEAN;
        WHEN 'like' THEN RETURN (settings.social_notifications->>'likes')::BOOLEAN;
        WHEN 'superlike' THEN RETURN (settings.social_notifications->>'superlikes')::BOOLEAN;
        WHEN 'match' THEN RETURN (settings.social_notifications->>'matches')::BOOLEAN;
        ELSE RETURN TRUE;
      END CASE;
    WHEN 'marketing' THEN
      RETURN (settings.marketing_notifications->>'enabled')::BOOLEAN;
    WHEN 'engagement' THEN
      RETURN (settings.engagement_notifications->>'enabled')::BOOLEAN;
    WHEN 'monetization' THEN
      RETURN (settings.monetization_notifications->>'enabled')::BOOLEAN;
    WHEN 'system' THEN
      IF notification_priority = 'critical' THEN
        RETURN (settings.system_notifications->>'critical')::BOOLEAN;
      ELSE
        RETURN (settings.system_notifications->>'general')::BOOLEAN;
      END IF;
    ELSE
      RETURN TRUE;
  END CASE;
END;
$$;


ALTER FUNCTION public.should_send_notification(user_uuid uuid, notification_type character varying, notification_category character varying, notification_priority character varying) OWNER TO postgres;

--
-- Name: FUNCTION should_send_notification(user_uuid uuid, notification_type character varying, notification_category character varying, notification_priority character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.should_send_notification(user_uuid uuid, notification_type character varying, notification_category character varying, notification_priority character varying) IS 'Checks user preferences before sending notifications';


--
-- Name: touch_tokens_last_used(text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.touch_tokens_last_used(tokens_in text[]) RETURNS void
    LANGUAGE sql
    AS $$
  update public.expo_push_tokens
     set last_used_at = now()
   where token = any(tokens_in);
$$;


ALTER FUNCTION public.touch_tokens_last_used(tokens_in text[]) OWNER TO postgres;

--
-- Name: track_login(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.track_login() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- update the user's last_login_at and mark active
  UPDATE public.users
  SET
    last_login_at = NEW.login_at,
    is_active     = TRUE
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.track_login() OWNER TO postgres;

--
-- Name: trigger_referral_reward_safe(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_referral_reward_safe() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    has_referred_id boolean;
    has_referred_user_id boolean;
BEGIN
    -- Check if user just got verified
    IF OLD.verification_status != 'verified' AND NEW.verification_status = 'verified' THEN
        -- Check which columns exist
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'referrals' AND column_name = 'referred_id'
        ) INTO has_referred_id;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'referrals' AND column_name = 'referred_user_id'
        ) INTO has_referred_user_id;
        
        -- Process reward based on available columns
        IF has_referred_id THEN
            PERFORM process_referral_reward_safe(r.referrer_id, NEW.id)
            FROM referrals r 
            WHERE r.referred_id = NEW.id AND r.status = 'pending';
        ELSIF has_referred_user_id THEN
            PERFORM process_referral_reward_safe(r.referrer_id, NEW.id)
            FROM referrals r 
            WHERE r.referred_user_id = NEW.id AND r.status = 'pending';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_referral_reward_safe() OWNER TO postgres;

--
-- Name: undo_swipe(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.undo_swipe(p_swiper_id uuid, p_swiped_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
   DECLARE
     v_deleted BOOLEAN := FALSE;
   BEGIN
     -- Delete the swipe
     DELETE FROM swipes
     WHERE swiper_id = p_swiper_id
     AND swiped_id = p_swiped_id;
     
     -- Check if any row was deleted
     IF FOUND THEN
       v_deleted := TRUE;
     END IF;
     
     RETURN v_deleted;
   END;
   $$;


ALTER FUNCTION public.undo_swipe(p_swiper_id uuid, p_swiped_id uuid) OWNER TO postgres;

--
-- Name: update_bundles_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_bundles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_bundles_updated_at() OWNER TO postgres;

--
-- Name: update_contact_messages_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_contact_messages_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_contact_messages_updated_at() OWNER TO postgres;

--
-- Name: update_expo_push_tokens_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_expo_push_tokens_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_expo_push_tokens_updated_at() OWNER TO postgres;

--
-- Name: update_match_last_message_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_match_last_message_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE matches 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_match_last_message_at() OWNER TO postgres;

--
-- Name: update_payment_plans_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_payment_plans_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_payment_plans_updated_at() OWNER TO postgres;

--
-- Name: update_transactions_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_transactions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_transactions_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: update_users_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_users_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_users_updated_at() OWNER TO postgres;

--
-- Name: upsert_user_notification_preferences(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, boolean, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upsert_user_notification_preferences(user_uuid uuid, social_prefs jsonb DEFAULT NULL::jsonb, marketing_prefs jsonb DEFAULT NULL::jsonb, engagement_prefs jsonb DEFAULT NULL::jsonb, monetization_prefs jsonb DEFAULT NULL::jsonb, system_prefs jsonb DEFAULT NULL::jsonb, quiet_hours_prefs jsonb DEFAULT NULL::jsonb, dnd boolean DEFAULT NULL::boolean, token text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO user_notification_preferences (
    user_id,
    social_preferences,
    marketing_preferences,
    engagement_preferences,
    monetization_preferences,
    system_preferences,
    quiet_hours,
    do_not_disturb,
    push_token
  ) VALUES (
    user_uuid,
    COALESCE(social_prefs, '{"messages": true, "likes": true, "superlikes": true, "matches": true}'::JSONB),
    COALESCE(marketing_prefs, '{"promotions": true, "seasonal": true, "features": true, "enabled": true}'::JSONB),
    COALESCE(engagement_prefs, '{"dailyReminders": false, "weeklyDigest": true, "tips": true, "achievements": true, "community": true, "enabled": true}'::JSONB),
    COALESCE(monetization_prefs, '{"subscription": true, "premiumFeatures": true, "enabled": true}'::JSONB),
    COALESCE(system_prefs, '{"general": true, "critical": true}'::JSONB),
    COALESCE(quiet_hours_prefs, '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}'::JSONB),
    COALESCE(dnd, false),
    token
  )
  ON CONFLICT (user_id) DO UPDATE SET
    social_preferences = COALESCE(social_prefs, user_notification_preferences.social_preferences),
    marketing_preferences = COALESCE(marketing_prefs, user_notification_preferences.marketing_preferences),
    engagement_preferences = COALESCE(engagement_prefs, user_notification_preferences.engagement_preferences),
    monetization_preferences = COALESCE(monetization_prefs, user_notification_preferences.monetization_preferences),
    system_preferences = COALESCE(system_prefs, user_notification_preferences.system_preferences),
    quiet_hours = COALESCE(quiet_hours_prefs, user_notification_preferences.quiet_hours),
    do_not_disturb = COALESCE(dnd, user_notification_preferences.do_not_disturb),
    push_token = COALESCE(token, user_notification_preferences.push_token),
    updated_at = NOW();
END;
$$;


ALTER FUNCTION public.upsert_user_notification_preferences(user_uuid uuid, social_prefs jsonb, marketing_prefs jsonb, engagement_prefs jsonb, monetization_prefs jsonb, system_prefs jsonb, quiet_hours_prefs jsonb, dnd boolean, token text) OWNER TO postgres;

--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(100) NOT NULL,
    user_id uuid,
    session_id character varying(255),
    properties jsonb,
    "timestamp" timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.analytics_events OWNER TO postgres;

--
-- Name: blocked_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocked_users (
    blocker_id uuid NOT NULL,
    blocked_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.blocked_users OWNER TO postgres;

--
-- Name: bundles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bundles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(20) NOT NULL,
    quantity integer NOT NULL,
    price integer NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bundles_type_check CHECK (((type)::text = ANY (ARRAY[('super_like'::character varying)::text, ('highlight'::character varying)::text])))
);


ALTER TABLE public.bundles OWNER TO postgres;

--
-- Name: cities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cities (
    id bigint NOT NULL,
    name text,
    state_id bigint,
    state_code text,
    state_name text,
    country_id bigint,
    country_code text,
    country_name text,
    latitude double precision,
    longitude double precision,
    "wikiDataId" text
);


ALTER TABLE public.cities OWNER TO postgres;

--
-- Name: TABLE cities; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cities IS 'Database of over 151k cities around the world.';


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    subject character varying(500) NOT NULL,
    message text NOT NULL,
    status character varying(50) DEFAULT 'unread'::character varying NOT NULL,
    replied_by uuid,
    replied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contact_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_messages_id_seq OWNER TO postgres;

--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user1_id uuid NOT NULL,
    user2_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_message_at timestamp with time zone,
    CONSTRAINT matches_check CHECK ((user1_id < user2_id))
);

ALTER TABLE ONLY public.matches REPLICA IDENTITY FULL;


ALTER TABLE public.matches OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    is_highlighted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone
);

ALTER TABLE ONLY public.messages REPLICA IDENTITY FULL;


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: conversation_summaries; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.conversation_summaries AS
 WITH last_messages AS (
         SELECT DISTINCT ON (messages.match_id) messages.match_id,
            messages.content AS last_message_text,
            messages.sender_id AS last_message_sender,
            messages.created_at AS last_message_time
           FROM public.messages
          ORDER BY messages.match_id, messages.created_at DESC
        ), unread_counts AS (
         SELECT messages.match_id,
            messages.sender_id,
            count(*) AS unread_count
           FROM public.messages
          WHERE (messages.read_at IS NULL)
          GROUP BY messages.match_id, messages.sender_id
        )
 SELECT m.id,
    m.user1_id,
    m.user2_id,
    m.created_at,
    m.last_message_at,
    lm.last_message_text,
    lm.last_message_sender,
    lm.last_message_time,
    COALESCE(uc1.unread_count, (0)::bigint) AS user1_unread_count,
    COALESCE(uc2.unread_count, (0)::bigint) AS user2_unread_count
   FROM (((public.matches m
     LEFT JOIN last_messages lm ON ((lm.match_id = m.id)))
     LEFT JOIN unread_counts uc1 ON (((uc1.match_id = m.id) AND (uc1.sender_id = m.user2_id))))
     LEFT JOIN unread_counts uc2 ON (((uc2.match_id = m.id) AND (uc2.sender_id = m.user1_id))));


ALTER VIEW public.conversation_summaries OWNER TO postgres;

--
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.countries (
    id bigint NOT NULL,
    name text,
    iso3 text,
    iso2 text,
    numeric_code bigint,
    phonecode bigint,
    capital text,
    currency text,
    currency_name text,
    currency_symbol text,
    tld text,
    native text,
    region text,
    region_id bigint,
    subregion text,
    subregion_id bigint,
    nationality text,
    timezones text,
    latitude double precision,
    longitude double precision,
    emoji text,
    "emojiU" text
);


ALTER TABLE public.countries OWNER TO postgres;

--
-- Name: expo_push_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expo_push_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform text NOT NULL,
    device_name text,
    app_version text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_used_at timestamp with time zone DEFAULT now(),
    CONSTRAINT expo_push_tokens_platform_check CHECK ((platform = ANY (ARRAY['ios'::text, 'android'::text, 'web'::text])))
);


ALTER TABLE public.expo_push_tokens OWNER TO postgres;

--
-- Name: TABLE expo_push_tokens; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.expo_push_tokens IS 'Stores Expo push notification tokens for mobile app integration';


--
-- Name: COLUMN expo_push_tokens.token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expo_push_tokens.token IS 'Expo push token for sending notifications';


--
-- Name: COLUMN expo_push_tokens.platform; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expo_push_tokens.platform IS 'Platform: ios, android, or web';


--
-- Name: COLUMN expo_push_tokens.device_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expo_push_tokens.device_name IS 'Optional device name for identification';


--
-- Name: COLUMN expo_push_tokens.app_version; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expo_push_tokens.app_version IS 'App version when token was registered';


--
-- Name: COLUMN expo_push_tokens.last_used_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expo_push_tokens.last_used_at IS 'Last time this token was used for sending notifications';


--
-- Name: login_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    login_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.login_history OWNER TO postgres;

--
-- Name: marketing_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketing_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    image_url text,
    action_url text,
    promo_code character varying(50),
    discount jsonb,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    target_audience jsonb,
    is_active boolean DEFAULT true,
    priority character varying(20) DEFAULT 'normal'::character varying,
    max_shows integer DEFAULT 3,
    cooldown_hours integer DEFAULT 24,
    max_uses integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.marketing_campaigns OWNER TO postgres;

--
-- Name: notification_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(50) NOT NULL,
    notification_type character varying(100) NOT NULL,
    notification_category character varying(50),
    notification_priority character varying(20),
    campaign_id uuid,
    match_id uuid,
    user_id uuid,
    is_native_app boolean DEFAULT false,
    properties jsonb,
    "timestamp" timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notification_analytics OWNER TO postgres;

--
-- Name: notification_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_jobs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    type text NOT NULL,
    recipient_id uuid NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    scheduled_at timestamp with time zone DEFAULT now() NOT NULL,
    dedupe_key text,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_jobs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'sent'::text, 'failed'::text, 'cancelled'::text])))
);


ALTER TABLE public.notification_jobs OWNER TO postgres;

--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    social_notifications jsonb DEFAULT '{"likes": true, "matches": true, "messages": true, "superlikes": true}'::jsonb,
    marketing_notifications jsonb DEFAULT '{"enabled": true, "features": true, "seasonal": true, "promotions": true}'::jsonb,
    engagement_notifications jsonb DEFAULT '{"tips": true, "enabled": true, "community": true, "achievements": true, "weeklyDigest": true, "dailyReminders": false}'::jsonb,
    monetization_notifications jsonb DEFAULT '{"enabled": true, "subscription": true, "premiumFeatures": true}'::jsonb,
    system_notifications jsonb DEFAULT '{"general": true, "critical": true}'::jsonb,
    quiet_hours jsonb DEFAULT '{"enabled": false, "endTime": "08:00", "startTime": "22:00"}'::jsonb,
    do_not_disturb boolean DEFAULT false,
    push_enabled boolean DEFAULT true,
    email_enabled boolean DEFAULT true,
    web_enabled boolean DEFAULT true,
    push_token text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notification_settings OWNER TO postgres;

--
-- Name: TABLE notification_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notification_settings IS 'User notification preferences and settings';


--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(50) NOT NULL,
    category character varying(20) NOT NULL,
    priority character varying(10) DEFAULT 'normal'::character varying NOT NULL,
    title_template character varying(255) NOT NULL,
    message_template text NOT NULL,
    action_url_template text,
    image_url text,
    expires_after_hours integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notification_templates OWNER TO postgres;

--
-- Name: TABLE notification_templates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notification_templates IS 'Templates for consistent notification messaging';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_id uuid NOT NULL,
    sender_id uuid,
    type character varying(50) NOT NULL,
    category character varying(20) DEFAULT 'social'::character varying NOT NULL,
    priority character varying(10) DEFAULT 'normal'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    action_url text,
    image_url text,
    is_read boolean DEFAULT false,
    is_seen boolean DEFAULT false,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notifications IS 'Stores all user notifications with real-time capabilities';


--
-- Name: otp_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    mobile_number text NOT NULL,
    otp_code text NOT NULL,
    purpose text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    verified_at timestamp with time zone,
    attempts integer DEFAULT 0
);


ALTER TABLE public.otp_verifications OWNER TO postgres;

--
-- Name: payment_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    price integer NOT NULL,
    duration_days integer NOT NULL,
    features jsonb,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.payment_plans OWNER TO postgres;

--
-- Name: promo_code_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_code_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid,
    user_id uuid,
    promo_code character varying(50) NOT NULL,
    redeemed_at timestamp with time zone DEFAULT now(),
    discount_applied jsonb,
    order_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.promo_code_usage OWNER TO postgres;

--
-- Name: referral_rewards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reward_type character varying(50) NOT NULL,
    reward_value text,
    status character varying(20) DEFAULT 'active'::character varying,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    activated_at timestamp with time zone,
    referrer_id uuid
);


ALTER TABLE public.referral_rewards OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT auth.uid() NOT NULL,
    phone text,
    email text,
    email_verified boolean DEFAULT false,
    mobile_verified boolean DEFAULT false,
    full_name text,
    first_name text,
    last_name text,
    gender text,
    birthdate date,
    city_id bigint,
    state_id bigint,
    country_id bigint,
    profile_photo_url text,
    user_photos jsonb,
    diet text,
    temple_visit_freq text,
    artha_vs_moksha text,
    vanaprastha_interest text,
    favorite_spiritual_quote text,
    education text,
    profession text,
    annual_income text,
    marital_status text,
    super_likes_count integer DEFAULT 0,
    swipe_count integer DEFAULT 0,
    message_highlights_count integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    account_status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    daily_swipe_count integer DEFAULT 0,
    daily_superlike_count integer DEFAULT 0,
    last_swipe_date date,
    is_banned boolean DEFAULT false,
    is_kyc_verified boolean DEFAULT false,
    flagged_reason text,
    role text DEFAULT 'user'::text,
    mother_tongue text,
    about_me text,
    ideal_partner_notes text,
    verification_status text DEFAULT 'unverified'::text,
    height_ft integer,
    height_in integer,
    is_active boolean DEFAULT true,
    referral_code character varying(10),
    referral_count integer DEFAULT 0,
    fast_track_verification boolean DEFAULT false,
    total_referrals integer DEFAULT 0,
    is_onboarded boolean DEFAULT false,
    privacy_settings jsonb DEFAULT '{"show_distance": true, "show_last_active": true, "profile_visibility": true, "show_online_status": true, "allow_search_by_phone": false, "show_verification_badge": true, "allow_profile_screenshots": false, "allow_messages_from_matches_only": false}'::jsonb,
    profile_boosts_count integer DEFAULT 0 NOT NULL,
    welcome_sent boolean DEFAULT false NOT NULL,
    referred_by character varying,
    spiritual_org_backup text,
    daily_practices_backup text,
    spiritual_org text[] DEFAULT ARRAY[]::text[],
    daily_practices text[] DEFAULT ARRAY[]::text[],
    profile_score numeric(3,1),
    CONSTRAINT users_height_ft_check CHECK (((height_ft >= 4) AND (height_ft <= 7))),
    CONSTRAINT users_height_in_check CHECK (((height_in >= 0) AND (height_in <= 11))),
    CONSTRAINT users_profile_score_range CHECK (((profile_score IS NULL) OR ((profile_score >= (0)::numeric) AND (profile_score <= (10)::numeric)))),
    CONSTRAINT users_role_check1 CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'super_admin'::text, 'superadmin'::text]))),
    CONSTRAINT users_v2_gender_check CHECK ((gender = ANY (ARRAY['Male'::text, 'Female'::text, 'Other'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.height_ft; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.height_ft IS 'Height in feet (4-7 feet)';


--
-- Name: COLUMN users.height_in; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.height_in IS 'Height in inches (0-11 inches)';


--
-- Name: COLUMN users.profile_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.profile_score IS 'Profile completeness/quality score from 0 to 10. NULL indicates not calculated yet.';


--
-- Name: referral_analytics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.referral_analytics AS
 SELECT u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.referral_code,
    u.total_referrals,
    u.referral_count AS successful_referrals,
    u.fast_track_verification,
    u.verification_status,
    count(rr.id) AS active_rewards
   FROM (public.users u
     LEFT JOIN public.referral_rewards rr ON (((u.id = rr.user_id) AND ((rr.status)::text = 'active'::text))))
  WHERE ((u.total_referrals > 0) OR (u.referral_count > 0))
  GROUP BY u.id, u.first_name, u.last_name, u.email, u.referral_code, u.total_referrals, u.referral_count, u.fast_track_verification, u.verification_status
  ORDER BY u.referral_count DESC, u.total_referrals DESC;


ALTER VIEW public.referral_analytics OWNER TO postgres;

--
-- Name: referrals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_id uuid NOT NULL,
    referral_code character varying(10) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reward_given boolean DEFAULT false,
    reward_amount integer DEFAULT 0
);


ALTER TABLE public.referrals OWNER TO postgres;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid,
    reported_user_id uuid,
    reason text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.states (
    id bigint NOT NULL,
    name text,
    country_id bigint,
    country_code text,
    country_name text,
    state_code text,
    type text,
    latitude text,
    longitude text
);


ALTER TABLE public.states OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    plan text,
    "interval" text,
    razorpay_subscription_id text,
    razorpay_payment_id text,
    status text DEFAULT 'active'::text,
    starts_at timestamp with time zone DEFAULT now(),
    ends_at timestamp with time zone,
    CONSTRAINT subscriptions_interval_check CHECK (("interval" = ANY (ARRAY['monthly'::text, 'quarterly'::text]))),
    CONSTRAINT subscriptions_plan_check CHECK ((plan = ANY (ARRAY['drishti'::text, 'sparsh'::text, 'sangam'::text, 'samarpan'::text])))
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: superlikes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.superlikes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid,
    receiver_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    type text DEFAULT 'free'::text,
    CONSTRAINT superlikes_type_check CHECK ((type = ANY (ARRAY['free'::text, 'paid'::text])))
);


ALTER TABLE public.superlikes OWNER TO postgres;

--
-- Name: swipes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.swipes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    swiper_id uuid NOT NULL,
    swiped_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT swipes_action_check CHECK (((action)::text = ANY (ARRAY[('like'::character varying)::text, ('dislike'::character varying)::text, ('superlike'::character varying)::text])))
);


ALTER TABLE public.swipes OWNER TO postgres;

--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_logs OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid,
    bundle_id uuid,
    razorpay_order_id character varying(255),
    razorpay_payment_id character varying(255),
    amount integer NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying,
    status character varying(20) DEFAULT 'created'::character varying,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    social_preferences jsonb DEFAULT '{"likes": true, "matches": true, "messages": true, "superlikes": true}'::jsonb,
    marketing_preferences jsonb DEFAULT '{"enabled": true, "features": true, "seasonal": true, "promotions": true}'::jsonb,
    engagement_preferences jsonb DEFAULT '{"tips": true, "enabled": true, "community": true, "achievements": true, "weeklyDigest": true, "dailyReminders": false}'::jsonb,
    monetization_preferences jsonb DEFAULT '{"enabled": true, "subscription": true, "premiumFeatures": true}'::jsonb,
    system_preferences jsonb DEFAULT '{"general": true, "critical": true}'::jsonb,
    quiet_hours jsonb DEFAULT '{"enabled": false, "endTime": "08:00", "startTime": "22:00"}'::jsonb,
    do_not_disturb boolean DEFAULT false,
    push_token text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_notification_preferences OWNER TO postgres;

--
-- Name: whatsapp_outbox; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.whatsapp_outbox (
    id bigint NOT NULL,
    user_id uuid,
    phone text NOT NULL,
    template_name text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    send_after timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    error text
);


ALTER TABLE public.whatsapp_outbox OWNER TO postgres;

--
-- Name: whatsapp_outbox_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.whatsapp_outbox_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.whatsapp_outbox_id_seq OWNER TO postgres;

--
-- Name: whatsapp_outbox_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.whatsapp_outbox_id_seq OWNED BY public.whatsapp_outbox.id;


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: whatsapp_outbox id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_outbox ALTER COLUMN id SET DEFAULT nextval('public.whatsapp_outbox_id_seq'::regclass);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: blocked_users blocked_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_pkey PRIMARY KEY (blocker_id, blocked_id);


--
-- Name: bundles bundles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bundles
    ADD CONSTRAINT bundles_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: expo_push_tokens expo_push_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expo_push_tokens
    ADD CONSTRAINT expo_push_tokens_pkey PRIMARY KEY (id);


--
-- Name: expo_push_tokens expo_push_tokens_user_id_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expo_push_tokens
    ADD CONSTRAINT expo_push_tokens_user_id_token_key UNIQUE (user_id, token);


--
-- Name: login_history login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_pkey PRIMARY KEY (id);


--
-- Name: marketing_campaigns marketing_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketing_campaigns
    ADD CONSTRAINT marketing_campaigns_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: matches matches_user1_id_user2_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_user1_id_user2_id_key UNIQUE (user1_id, user2_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notification_analytics notification_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_analytics
    ADD CONSTRAINT notification_analytics_pkey PRIMARY KEY (id);


--
-- Name: notification_jobs notification_jobs_dedupe_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_jobs
    ADD CONSTRAINT notification_jobs_dedupe_key_unique UNIQUE (dedupe_key);


--
-- Name: notification_jobs notification_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_jobs
    ADD CONSTRAINT notification_jobs_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_key UNIQUE (user_id);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: notification_templates notification_templates_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_type_key UNIQUE (type);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otp_verifications otp_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verifications
    ADD CONSTRAINT otp_verifications_pkey PRIMARY KEY (id);


--
-- Name: payment_plans payment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_plans
    ADD CONSTRAINT payment_plans_pkey PRIMARY KEY (id);


--
-- Name: promo_code_usage promo_code_usage_campaign_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_code_usage
    ADD CONSTRAINT promo_code_usage_campaign_id_user_id_key UNIQUE (campaign_id, user_id);


--
-- Name: promo_code_usage promo_code_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_code_usage
    ADD CONSTRAINT promo_code_usage_pkey PRIMARY KEY (id);


--
-- Name: referral_rewards referral_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_rewards
    ADD CONSTRAINT referral_rewards_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referrer_id_referred_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_referred_id_key UNIQUE (referrer_id, referred_id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: states states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: superlikes superlikes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.superlikes
    ADD CONSTRAINT superlikes_pkey PRIMARY KEY (id);


--
-- Name: swipes swipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_pkey PRIMARY KEY (id);


--
-- Name: swipes swipes_swiper_id_swiped_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_swiper_id_swiped_id_key UNIQUE (swiper_id, swiped_id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_daily_stats user_daily_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_daily_stats
    ADD CONSTRAINT user_daily_stats_pkey PRIMARY KEY (id);


--
-- Name: user_daily_stats user_daily_stats_user_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_daily_stats
    ADD CONSTRAINT user_daily_stats_user_id_date_key UNIQUE (user_id, date);


--
-- Name: user_notification_preferences user_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_notification_preferences user_notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- Name: users users_v2_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_v2_email_key UNIQUE (email);


--
-- Name: users users_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_v2_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_outbox whatsapp_outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_outbox
    ADD CONSTRAINT whatsapp_outbox_pkey PRIMARY KEY (id);


--
-- Name: idx_analytics_events_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analytics_events_type ON public.analytics_events USING btree (event_type);


--
-- Name: idx_analytics_events_user_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analytics_events_user_timestamp ON public.analytics_events USING btree (user_id, "timestamp");


--
-- Name: idx_blocked_users_blocked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocked_users_blocked ON public.blocked_users USING btree (blocked_id);


--
-- Name: idx_blocked_users_blocker; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocked_users_blocker ON public.blocked_users USING btree (blocker_id);


--
-- Name: idx_expo_push_tokens_platform; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expo_push_tokens_platform ON public.expo_push_tokens USING btree (user_id, platform);


--
-- Name: idx_expo_push_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expo_push_tokens_token ON public.expo_push_tokens USING btree (token);


--
-- Name: idx_expo_push_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expo_push_tokens_user_id ON public.expo_push_tokens USING btree (user_id);


--
-- Name: idx_marketing_campaigns_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_marketing_campaigns_active ON public.marketing_campaigns USING btree (is_active, valid_until);


--
-- Name: idx_marketing_campaigns_promo_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_marketing_campaigns_promo_code ON public.marketing_campaigns USING btree (promo_code) WHERE (promo_code IS NOT NULL);


--
-- Name: idx_matches_users; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_matches_users ON public.matches USING btree (user1_id, user2_id);


--
-- Name: idx_messages_content_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_content_trgm ON public.messages USING gin (content public.gin_trgm_ops);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);


--
-- Name: idx_messages_match; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_match ON public.messages USING btree (match_id);


--
-- Name: idx_messages_match_created_desc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_match_created_desc ON public.messages USING btree (match_id, created_at DESC);


--
-- Name: idx_messages_match_sender_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_match_sender_read ON public.messages USING btree (match_id, sender_id, read_at);


--
-- Name: idx_messages_realtime; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_realtime ON public.messages USING btree (match_id, created_at DESC);


--
-- Name: idx_messages_sender_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender_read ON public.messages USING btree (sender_id, read_at) WHERE (read_at IS NULL);


--
-- Name: idx_notification_analytics_campaign; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_analytics_campaign ON public.notification_analytics USING btree (campaign_id, event_type);


--
-- Name: idx_notification_analytics_type_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_analytics_type_category ON public.notification_analytics USING btree (notification_type, notification_category);


--
-- Name: idx_notification_analytics_user_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_analytics_user_timestamp ON public.notification_analytics USING btree (user_id, "timestamp");


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_expires_at ON public.notifications USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_real_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_real_time ON public.notifications USING btree (recipient_id, is_read, created_at DESC);


--
-- Name: idx_notifications_recipient_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_recipient_created ON public.notifications USING btree (recipient_id, created_at DESC);


--
-- Name: idx_notifications_recipient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_recipient_id ON public.notifications USING btree (recipient_id);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_otp_verifications_cleanup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otp_verifications_cleanup ON public.otp_verifications USING btree (expires_at, verified_at);


--
-- Name: idx_otp_verifications_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otp_verifications_expires ON public.otp_verifications USING btree (expires_at);


--
-- Name: idx_otp_verifications_user_purpose; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otp_verifications_user_purpose ON public.otp_verifications USING btree (user_id, purpose);


--
-- Name: idx_promo_code_usage_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promo_code_usage_user ON public.promo_code_usage USING btree (user_id, campaign_id);


--
-- Name: idx_referral_rewards_referrer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_rewards_referrer_id ON public.referral_rewards USING btree (referrer_id);


--
-- Name: idx_referral_rewards_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_rewards_status ON public.referral_rewards USING btree (status);


--
-- Name: idx_referral_rewards_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_rewards_type ON public.referral_rewards USING btree (reward_type);


--
-- Name: idx_referral_rewards_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_rewards_user_id ON public.referral_rewards USING btree (user_id);


--
-- Name: idx_referrals_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referrals_code ON public.referrals USING btree (referral_code);


--
-- Name: idx_referrals_referred_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referrals_referred_id ON public.referrals USING btree (referred_id);


--
-- Name: idx_referrals_referrer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referrals_referrer_id ON public.referrals USING btree (referrer_id);


--
-- Name: idx_referrals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referrals_status ON public.referrals USING btree (status);


--
-- Name: idx_reports_reported_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_reported_user ON public.reports USING btree (reported_user_id);


--
-- Name: idx_reports_reporter_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_reporter_user ON public.reports USING btree (reporter_id);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_subscriptions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_user ON public.subscriptions USING btree (user_id);


--
-- Name: idx_superlikes_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_superlikes_receiver_id ON public.superlikes USING btree (receiver_id);


--
-- Name: idx_superlikes_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_superlikes_sender_id ON public.superlikes USING btree (sender_id);


--
-- Name: idx_swipes_swiped; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_swipes_swiped ON public.swipes USING btree (swiped_id);


--
-- Name: idx_swipes_swiper; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_swipes_swiper ON public.swipes USING btree (swiper_id);


--
-- Name: idx_system_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_created_at ON public.system_logs USING btree (created_at);


--
-- Name: idx_system_logs_event_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_event_type ON public.system_logs USING btree (event_type);


--
-- Name: idx_user_daily_stats_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_daily_stats_user_date ON public.user_daily_stats USING btree (user_id, date);


--
-- Name: idx_user_notification_preferences_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notification_preferences_user_id ON public.user_notification_preferences USING btree (user_id);


--
-- Name: idx_users_country_state_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_country_state_city ON public.users USING btree (country_id, state_id, city_id);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_gender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_gender ON public.users USING btree (gender);


--
-- Name: idx_users_height_composite; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_height_composite ON public.users USING btree (height_ft, height_in);


--
-- Name: idx_users_height_ft; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_height_ft ON public.users USING btree (height_ft);


--
-- Name: idx_users_height_in; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_height_in ON public.users USING btree (height_in);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_users_profile_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_profile_score ON public.users USING btree (profile_score) WHERE (profile_score IS NOT NULL);


--
-- Name: idx_users_referral_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_referral_code ON public.users USING btree (referral_code);


--
-- Name: idx_users_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_verification_status ON public.users USING btree (verification_status);


--
-- Name: notification_jobs_recipient_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notification_jobs_recipient_idx ON public.notification_jobs USING btree (recipient_id);


--
-- Name: notification_jobs_status_scheduled_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notification_jobs_status_scheduled_idx ON public.notification_jobs USING btree (status, scheduled_at);


--
-- Name: messages protect_message_updates_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER protect_message_updates_trigger BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.protect_message_updates();


--
-- Name: users referral_completion_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER referral_completion_trigger AFTER UPDATE OF verification_status ON public.users FOR EACH ROW EXECUTE FUNCTION public.process_referral_completion();


--
-- Name: bundles trg_bundles_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bundles_updated BEFORE UPDATE ON public.bundles FOR EACH ROW EXECUTE FUNCTION public.update_bundles_updated_at();


--
-- Name: matches trg_cancel_like_on_match; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cancel_like_on_match AFTER INSERT ON public.matches FOR EACH ROW EXECUTE FUNCTION public.cancel_like_jobs_on_match();


--
-- Name: matches trg_enqueue_job_on_match; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enqueue_job_on_match AFTER INSERT ON public.matches FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_on_match();


--
-- Name: messages trg_enqueue_job_on_message; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enqueue_job_on_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_on_message();


--
-- Name: swipes trg_enqueue_job_on_swipe; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enqueue_job_on_swipe AFTER INSERT ON public.swipes FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_on_swipe();


--
-- Name: payment_plans trg_payment_plans_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payment_plans_updated BEFORE UPDATE ON public.payment_plans FOR EACH ROW EXECUTE FUNCTION public.update_payment_plans_updated_at();


--
-- Name: notification_jobs trg_poke_notifications_dispatcher; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_poke_notifications_dispatcher AFTER INSERT ON public.notification_jobs FOR EACH ROW EXECUTE FUNCTION public.poke_notifications_dispatcher();


--
-- Name: login_history trg_track_login; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_track_login AFTER INSERT ON public.login_history FOR EACH ROW EXECUTE FUNCTION public.track_login();


--
-- Name: transactions trg_transactions_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_transactions_updated_at();


--
-- Name: contact_messages trg_update_ts; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_ts BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.update_contact_messages_updated_at();


--
-- Name: messages trigger_update_match_last_message; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_match_last_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_match_last_message_at();


--
-- Name: expo_push_tokens update_expo_push_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_expo_push_tokens_updated_at BEFORE UPDATE ON public.expo_push_tokens FOR EACH ROW EXECUTE FUNCTION public.update_expo_push_tokens_updated_at();


--
-- Name: marketing_campaigns update_marketing_campaigns_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_settings update_notification_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_templates update_notification_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notifications update_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: referral_rewards update_referral_rewards_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_rewards_updated_at BEFORE UPDATE ON public.referral_rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_notification_preferences update_user_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON public.user_notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: analytics_events analytics_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: blocked_users blocked_users_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: blocked_users blocked_users_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contact_messages contact_messages_replied_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_replied_by_fkey FOREIGN KEY (replied_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: expo_push_tokens expo_push_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expo_push_tokens
    ADD CONSTRAINT expo_push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: matches matches_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: matches matches_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_analytics notification_analytics_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_analytics
    ADD CONSTRAINT notification_analytics_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;


--
-- Name: notification_analytics notification_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_analytics
    ADD CONSTRAINT notification_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notification_jobs notification_jobs_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_jobs
    ADD CONSTRAINT notification_jobs_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notification_settings notification_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: otp_verifications otp_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verifications
    ADD CONSTRAINT otp_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: promo_code_usage promo_code_usage_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_code_usage
    ADD CONSTRAINT promo_code_usage_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE;


--
-- Name: promo_code_usage promo_code_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_code_usage
    ADD CONSTRAINT promo_code_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: referral_rewards referral_rewards_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_rewards
    ADD CONSTRAINT referral_rewards_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports reports_reported_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: swipes swipes_swiped_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_swiped_id_fkey FOREIGN KEY (swiped_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: swipes swipes_swiper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_swiper_id_fkey FOREIGN KEY (swiper_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_bundle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id);


--
-- Name: transactions transactions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.payment_plans(id);


--
-- Name: user_daily_stats user_daily_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_daily_stats
    ADD CONSTRAINT user_daily_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_notification_preferences user_notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_v2_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_v2_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: users users_v2_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_v2_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: users users_v2_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_v2_state_id_fkey FOREIGN KEY (state_id) REFERENCES public.states(id);


--
-- Name: notification_templates Admin can manage notification templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can manage notification templates" ON public.notification_templates USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role = 'admin'::text) OR (users.role = 'super_admin'::text))))));


--
-- Name: users Admins can manage all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all users" ON public.users TO authenticated USING (true);


--
-- Name: contact_messages Admins can update contact messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update contact messages" ON public.contact_messages FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: contact_messages Admins can view all contact messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all contact messages" ON public.contact_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: reports Admins can view all reports; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE (users.role = 'admin'::text))));


--
-- Name: analytics_events Allow analytics events insertion; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow analytics events insertion" ON public.analytics_events FOR INSERT WITH CHECK (true);


--
-- Name: notification_analytics Allow notification analytics insertion; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow notification analytics insertion" ON public.notification_analytics FOR INSERT WITH CHECK (true);


--
-- Name: contact_messages Anyone can submit contact messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: messages Messages UPDATE policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Messages UPDATE policy" ON public.messages FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: cities Public read - cities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read - cities" ON public.cities FOR SELECT USING (true);


--
-- Name: countries Public read - countries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read - countries" ON public.countries FOR SELECT USING (true);


--
-- Name: states Public read - states; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read - states" ON public.states FOR SELECT USING (true);


--
-- Name: marketing_campaigns Public read access to active campaigns; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access to active campaigns" ON public.marketing_campaigns FOR SELECT USING (((is_active = true) AND (valid_until > now())));


--
-- Name: notification_templates Public read access to notification templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access to notification templates" ON public.notification_templates FOR SELECT USING ((is_active = true));


--
-- Name: messages Secure message read marking; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Secure message read marking" ON public.messages FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM public.matches
  WHERE ((matches.id = messages.match_id) AND ((matches.user1_id = auth.uid()) OR (matches.user2_id = auth.uid()))))) AND (sender_id <> auth.uid()) AND (read_at IS NULL))) WITH CHECK (((EXISTS ( SELECT 1
   FROM public.matches
  WHERE ((matches.id = messages.match_id) AND ((matches.user1_id = auth.uid()) OR (matches.user2_id = auth.uid()))))) AND (sender_id <> auth.uid())));


--
-- Name: matches System can insert matches; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert matches" ON public.matches FOR INSERT WITH CHECK (true);


--
-- Name: subscriptions Users can create subscription; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create subscription" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: blocked_users Users can delete own blocks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own blocks" ON public.blocked_users FOR DELETE USING ((auth.uid() = blocker_id));


--
-- Name: messages Users can insert messages in their matches; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert messages in their matches" ON public.messages FOR INSERT WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.matches
  WHERE ((matches.id = messages.match_id) AND ((matches.user1_id = auth.uid()) OR (matches.user2_id = auth.uid())))))));


--
-- Name: blocked_users Users can insert own blocks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own blocks" ON public.blocked_users FOR INSERT WITH CHECK ((auth.uid() = blocker_id));


--
-- Name: users Users can insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: promo_code_usage Users can insert own promo usage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own promo usage" ON public.promo_code_usage FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_daily_stats Users can insert their own daily stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own daily stats" ON public.user_daily_stats FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: swipes Users can insert their swipe actions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their swipe actions" ON public.swipes FOR INSERT WITH CHECK ((auth.uid() = swiper_id));


--
-- Name: transactions Users can insert their transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their transactions" ON public.transactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_notification_preferences Users can manage own notification preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own notification preferences" ON public.user_notification_preferences USING ((auth.uid() = user_id));


--
-- Name: notification_settings Users can manage own notification settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own notification settings" ON public.notification_settings USING ((user_id = auth.uid()));


--
-- Name: otp_verifications Users can manage their own OTP verifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own OTP verifications" ON public.otp_verifications USING ((auth.uid() = user_id));


--
-- Name: expo_push_tokens Users can manage their own push tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own push tokens" ON public.expo_push_tokens USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: analytics_events Users can read own analytics events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own analytics events" ON public.analytics_events FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notification_analytics Users can read own notification analytics; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own notification analytics" ON public.notification_analytics FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: promo_code_usage Users can read own promo usage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own promo usage" ON public.promo_code_usage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: reports Users can report others; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can report others" ON public.reports FOR INSERT TO authenticated WITH CHECK ((auth.uid() = reporter_id));


--
-- Name: matches Users can update match timestamps; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update match timestamps" ON public.matches FOR UPDATE USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id))) WITH CHECK (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((recipient_id = auth.uid()));


--
-- Name: users Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: subscriptions Users can update own subscription; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_daily_stats Users can update their own daily stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own daily stats" ON public.user_daily_stats FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: messages Users can view messages in their matches; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view messages in their matches" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.matches
  WHERE ((matches.id = messages.match_id) AND ((matches.user1_id = auth.uid()) OR (matches.user2_id = auth.uid()))))));


--
-- Name: blocked_users Users can view own blocks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own blocks" ON public.blocked_users FOR SELECT USING ((auth.uid() = blocker_id));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((recipient_id = auth.uid()));


--
-- Name: users Users can view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: referrals Users can view referrals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view referrals" ON public.referrals FOR SELECT USING (((auth.uid() = referrer_id) OR (auth.uid() = referred_id)));


--
-- Name: matches Users can view their matches; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their matches" ON public.matches FOR SELECT USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));


--
-- Name: user_daily_stats Users can view their own daily stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own daily stats" ON public.user_daily_stats FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view their subscription; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their subscription" ON public.subscriptions FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: swipes Users can view their swipe actions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their swipe actions" ON public.swipes FOR SELECT USING (((auth.uid() = swiper_id) OR (auth.uid() = swiped_id)));


--
-- Name: transactions Users can view their transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their transactions" ON public.transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: analytics_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

--
-- Name: blocked_users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

--
-- Name: cities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: countries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

--
-- Name: expo_push_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.expo_push_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: marketing_campaigns; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: matches match_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY match_insert ON public.matches FOR INSERT WITH CHECK (true);


--
-- Name: matches match_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY match_select ON public.matches FOR SELECT USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));


--
-- Name: matches; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: messages msg_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY msg_insert ON public.messages FOR INSERT WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.matches
  WHERE ((matches.id = messages.match_id) AND ((matches.user1_id = auth.uid()) OR (matches.user2_id = auth.uid())))))));


--
-- Name: messages msg_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY msg_select ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.matches
  WHERE ((matches.id = messages.match_id) AND ((matches.user1_id = auth.uid()) OR (matches.user2_id = auth.uid()))))));


--
-- Name: notification_analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_jobs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: whatsapp_outbox open; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY open ON public.whatsapp_outbox USING (true) WITH CHECK (true);


--
-- Name: otp_verifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: promo_code_usage; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--
-- Name: states; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: swipes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_daily_stats uds_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY uds_insert ON public.user_daily_stats FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_daily_stats uds_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY uds_select ON public.user_daily_stats FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_daily_stats uds_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY uds_update ON public.user_daily_stats FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_daily_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: user_notification_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: expo_push_tokens users manage own expo tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users manage own expo tokens" ON public.expo_push_tokens TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: users users_insert_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_self ON public.users FOR INSERT WITH CHECK ((id = auth.uid()));


--
-- Name: whatsapp_outbox; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.whatsapp_outbox ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION _minute_bucket(ts timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public._minute_bucket(ts timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public._minute_bucket(ts timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public._minute_bucket(ts timestamp with time zone) TO service_role;


--
-- Name: FUNCTION allocate_monthly_superlikes(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.allocate_monthly_superlikes() TO anon;
GRANT ALL ON FUNCTION public.allocate_monthly_superlikes() TO authenticated;
GRANT ALL ON FUNCTION public.allocate_monthly_superlikes() TO service_role;


--
-- Name: FUNCTION allocate_user_superlikes(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.allocate_user_superlikes(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.allocate_user_superlikes(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.allocate_user_superlikes(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION can_user_swipe(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.can_user_swipe(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.can_user_swipe(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.can_user_swipe(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION cancel_like_jobs_on_match(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cancel_like_jobs_on_match() TO anon;
GRANT ALL ON FUNCTION public.cancel_like_jobs_on_match() TO authenticated;
GRANT ALL ON FUNCTION public.cancel_like_jobs_on_match() TO service_role;


--
-- Name: FUNCTION cleanup_expired_notifications(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_expired_notifications() TO anon;
GRANT ALL ON FUNCTION public.cleanup_expired_notifications() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_expired_notifications() TO service_role;


--
-- Name: FUNCTION cleanup_expired_otps(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_expired_otps() TO anon;
GRANT ALL ON FUNCTION public.cleanup_expired_otps() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_expired_otps() TO service_role;


--
-- Name: FUNCTION create_notification_from_template(template_type character varying, recipient_uuid uuid, sender_uuid uuid, template_data jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_notification_from_template(template_type character varying, recipient_uuid uuid, sender_uuid uuid, template_data jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_notification_from_template(template_type character varying, recipient_uuid uuid, sender_uuid uuid, template_data jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.create_notification_from_template(template_type character varying, recipient_uuid uuid, sender_uuid uuid, template_data jsonb) TO service_role;


--
-- Name: FUNCTION decrement_daily_swipe(p_user_id uuid, p_date date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.decrement_daily_swipe(p_user_id uuid, p_date date) TO anon;
GRANT ALL ON FUNCTION public.decrement_daily_swipe(p_user_id uuid, p_date date) TO authenticated;
GRANT ALL ON FUNCTION public.decrement_daily_swipe(p_user_id uuid, p_date date) TO service_role;


--
-- Name: FUNCTION enqueue_job_on_match(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enqueue_job_on_match() TO anon;
GRANT ALL ON FUNCTION public.enqueue_job_on_match() TO authenticated;
GRANT ALL ON FUNCTION public.enqueue_job_on_match() TO service_role;


--
-- Name: FUNCTION enqueue_job_on_message(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enqueue_job_on_message() TO anon;
GRANT ALL ON FUNCTION public.enqueue_job_on_message() TO authenticated;
GRANT ALL ON FUNCTION public.enqueue_job_on_message() TO service_role;


--
-- Name: FUNCTION enqueue_job_on_swipe(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enqueue_job_on_swipe() TO anon;
GRANT ALL ON FUNCTION public.enqueue_job_on_swipe() TO authenticated;
GRANT ALL ON FUNCTION public.enqueue_job_on_swipe() TO service_role;


--
-- Name: FUNCTION enqueue_notification_job(p_type text, p_recipient_id uuid, p_payload jsonb, p_scheduled_at timestamp with time zone, p_dedupe_key text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enqueue_notification_job(p_type text, p_recipient_id uuid, p_payload jsonb, p_scheduled_at timestamp with time zone, p_dedupe_key text) TO anon;
GRANT ALL ON FUNCTION public.enqueue_notification_job(p_type text, p_recipient_id uuid, p_payload jsonb, p_scheduled_at timestamp with time zone, p_dedupe_key text) TO authenticated;
GRANT ALL ON FUNCTION public.enqueue_notification_job(p_type text, p_recipient_id uuid, p_payload jsonb, p_scheduled_at timestamp with time zone, p_dedupe_key text) TO service_role;


--
-- Name: FUNCTION extract_daily_practices(input_text text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.extract_daily_practices(input_text text) TO anon;
GRANT ALL ON FUNCTION public.extract_daily_practices(input_text text) TO authenticated;
GRANT ALL ON FUNCTION public.extract_daily_practices(input_text text) TO service_role;


--
-- Name: FUNCTION generate_referral_code(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_referral_code() TO anon;
GRANT ALL ON FUNCTION public.generate_referral_code() TO authenticated;
GRANT ALL ON FUNCTION public.generate_referral_code() TO service_role;


--
-- Name: FUNCTION get_notification_counts(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_notification_counts(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_notification_counts(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_notification_counts(user_uuid uuid) TO service_role;


--
-- Name: TABLE user_daily_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_daily_stats TO anon;
GRANT ALL ON TABLE public.user_daily_stats TO authenticated;
GRANT ALL ON TABLE public.user_daily_stats TO service_role;


--
-- Name: FUNCTION get_or_create_daily_stats(p_user_id uuid, p_date date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_or_create_daily_stats(p_user_id uuid, p_date date) TO anon;
GRANT ALL ON FUNCTION public.get_or_create_daily_stats(p_user_id uuid, p_date date) TO authenticated;
GRANT ALL ON FUNCTION public.get_or_create_daily_stats(p_user_id uuid, p_date date) TO service_role;


--
-- Name: FUNCTION get_referral_stats_safe(user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_referral_stats_safe(user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_referral_stats_safe(user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_referral_stats_safe(user_id uuid) TO service_role;


--
-- Name: FUNCTION get_schema_script(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_schema_script() TO anon;
GRANT ALL ON FUNCTION public.get_schema_script() TO authenticated;
GRANT ALL ON FUNCTION public.get_schema_script() TO service_role;


--
-- Name: FUNCTION get_user_conversations(user_id uuid, limit_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_conversations(user_id uuid, limit_count integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_conversations(user_id uuid, limit_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_conversations(user_id uuid, limit_count integer) TO service_role;


--
-- Name: FUNCTION get_user_notification_preferences(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_notification_preferences(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_notification_preferences(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_notification_preferences(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_notifications(user_uuid uuid, page_size integer, page_offset integer, include_read boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_notifications(user_uuid uuid, page_size integer, page_offset integer, include_read boolean) TO anon;
GRANT ALL ON FUNCTION public.get_user_notifications(user_uuid uuid, page_size integer, page_offset integer, include_read boolean) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_notifications(user_uuid uuid, page_size integer, page_offset integer, include_read boolean) TO service_role;


--
-- Name: FUNCTION get_user_swipe_limit(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_swipe_limit(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_swipe_limit(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_swipe_limit(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION handle_referral_signup(new_user_id uuid, referral_code text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_referral_signup(new_user_id uuid, referral_code text) TO anon;
GRANT ALL ON FUNCTION public.handle_referral_signup(new_user_id uuid, referral_code text) TO authenticated;
GRANT ALL ON FUNCTION public.handle_referral_signup(new_user_id uuid, referral_code text) TO service_role;


--
-- Name: FUNCTION increment_daily_swipes(p_user_id uuid, p_action text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_daily_swipes(p_user_id uuid, p_action text) TO anon;
GRANT ALL ON FUNCTION public.increment_daily_swipes(p_user_id uuid, p_action text) TO authenticated;
GRANT ALL ON FUNCTION public.increment_daily_swipes(p_user_id uuid, p_action text) TO service_role;


--
-- Name: FUNCTION increment_swipe_count(p_user_id uuid, p_date date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_swipe_count(p_user_id uuid, p_date date) TO anon;
GRANT ALL ON FUNCTION public.increment_swipe_count(p_user_id uuid, p_date date) TO authenticated;
GRANT ALL ON FUNCTION public.increment_swipe_count(p_user_id uuid, p_date date) TO service_role;


--
-- Name: FUNCTION is_admin_role(user_role text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_admin_role(user_role text) TO anon;
GRANT ALL ON FUNCTION public.is_admin_role(user_role text) TO authenticated;
GRANT ALL ON FUNCTION public.is_admin_role(user_role text) TO service_role;


--
-- Name: FUNCTION mark_messages_as_read(p_match_id uuid, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.mark_messages_as_read(p_match_id uuid, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.mark_messages_as_read(p_match_id uuid, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.mark_messages_as_read(p_match_id uuid, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION mark_notifications_read(user_uuid uuid, notification_ids uuid[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.mark_notifications_read(user_uuid uuid, notification_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.mark_notifications_read(user_uuid uuid, notification_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.mark_notifications_read(user_uuid uuid, notification_ids uuid[]) TO service_role;


--
-- Name: FUNCTION notify_new_like(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_new_like() TO anon;
GRANT ALL ON FUNCTION public.notify_new_like() TO authenticated;
GRANT ALL ON FUNCTION public.notify_new_like() TO service_role;


--
-- Name: FUNCTION notify_new_match(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_new_match() TO anon;
GRANT ALL ON FUNCTION public.notify_new_match() TO authenticated;
GRANT ALL ON FUNCTION public.notify_new_match() TO service_role;


--
-- Name: FUNCTION notify_new_message(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_new_message() TO anon;
GRANT ALL ON FUNCTION public.notify_new_message() TO authenticated;
GRANT ALL ON FUNCTION public.notify_new_message() TO service_role;


--
-- Name: FUNCTION poke_notifications_dispatcher(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.poke_notifications_dispatcher() TO anon;
GRANT ALL ON FUNCTION public.poke_notifications_dispatcher() TO authenticated;
GRANT ALL ON FUNCTION public.poke_notifications_dispatcher() TO service_role;


--
-- Name: FUNCTION process_referral_completion(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_referral_completion() TO anon;
GRANT ALL ON FUNCTION public.process_referral_completion() TO authenticated;
GRANT ALL ON FUNCTION public.process_referral_completion() TO service_role;


--
-- Name: FUNCTION process_referral_reward_safe(referrer_uuid uuid, referred_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_referral_reward_safe(referrer_uuid uuid, referred_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.process_referral_reward_safe(referrer_uuid uuid, referred_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.process_referral_reward_safe(referrer_uuid uuid, referred_uuid uuid) TO service_role;


--
-- Name: FUNCTION promote_user_to_admin(user_email text, new_role text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.promote_user_to_admin(user_email text, new_role text) TO anon;
GRANT ALL ON FUNCTION public.promote_user_to_admin(user_email text, new_role text) TO authenticated;
GRANT ALL ON FUNCTION public.promote_user_to_admin(user_email text, new_role text) TO service_role;


--
-- Name: FUNCTION protect_message_updates(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.protect_message_updates() TO anon;
GRANT ALL ON FUNCTION public.protect_message_updates() TO authenticated;
GRANT ALL ON FUNCTION public.protect_message_updates() TO service_role;


--
-- Name: FUNCTION set_verification_status(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_verification_status() TO anon;
GRANT ALL ON FUNCTION public.set_verification_status() TO authenticated;
GRANT ALL ON FUNCTION public.set_verification_status() TO service_role;


--
-- Name: FUNCTION should_send_notification(user_uuid uuid, notification_type character varying, notification_category character varying, notification_priority character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.should_send_notification(user_uuid uuid, notification_type character varying, notification_category character varying, notification_priority character varying) TO anon;
GRANT ALL ON FUNCTION public.should_send_notification(user_uuid uuid, notification_type character varying, notification_category character varying, notification_priority character varying) TO authenticated;
GRANT ALL ON FUNCTION public.should_send_notification(user_uuid uuid, notification_type character varying, notification_category character varying, notification_priority character varying) TO service_role;


--
-- Name: FUNCTION touch_tokens_last_used(tokens_in text[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.touch_tokens_last_used(tokens_in text[]) TO anon;
GRANT ALL ON FUNCTION public.touch_tokens_last_used(tokens_in text[]) TO authenticated;
GRANT ALL ON FUNCTION public.touch_tokens_last_used(tokens_in text[]) TO service_role;


--
-- Name: FUNCTION track_login(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.track_login() TO anon;
GRANT ALL ON FUNCTION public.track_login() TO authenticated;
GRANT ALL ON FUNCTION public.track_login() TO service_role;


--
-- Name: FUNCTION trigger_referral_reward_safe(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trigger_referral_reward_safe() TO anon;
GRANT ALL ON FUNCTION public.trigger_referral_reward_safe() TO authenticated;
GRANT ALL ON FUNCTION public.trigger_referral_reward_safe() TO service_role;


--
-- Name: FUNCTION undo_swipe(p_swiper_id uuid, p_swiped_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.undo_swipe(p_swiper_id uuid, p_swiped_id uuid) TO anon;
GRANT ALL ON FUNCTION public.undo_swipe(p_swiper_id uuid, p_swiped_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.undo_swipe(p_swiper_id uuid, p_swiped_id uuid) TO service_role;


--
-- Name: FUNCTION update_bundles_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_bundles_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_bundles_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_bundles_updated_at() TO service_role;


--
-- Name: FUNCTION update_contact_messages_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_contact_messages_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_contact_messages_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_contact_messages_updated_at() TO service_role;


--
-- Name: FUNCTION update_expo_push_tokens_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_expo_push_tokens_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_expo_push_tokens_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_expo_push_tokens_updated_at() TO service_role;


--
-- Name: FUNCTION update_match_last_message_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_match_last_message_at() TO anon;
GRANT ALL ON FUNCTION public.update_match_last_message_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_match_last_message_at() TO service_role;


--
-- Name: FUNCTION update_payment_plans_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_payment_plans_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_payment_plans_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_payment_plans_updated_at() TO service_role;


--
-- Name: FUNCTION update_transactions_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_transactions_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_transactions_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_transactions_updated_at() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION update_users_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_users_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_users_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_users_updated_at() TO service_role;


--
-- Name: FUNCTION upsert_user_notification_preferences(user_uuid uuid, social_prefs jsonb, marketing_prefs jsonb, engagement_prefs jsonb, monetization_prefs jsonb, system_prefs jsonb, quiet_hours_prefs jsonb, dnd boolean, token text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.upsert_user_notification_preferences(user_uuid uuid, social_prefs jsonb, marketing_prefs jsonb, engagement_prefs jsonb, monetization_prefs jsonb, system_prefs jsonb, quiet_hours_prefs jsonb, dnd boolean, token text) TO anon;
GRANT ALL ON FUNCTION public.upsert_user_notification_preferences(user_uuid uuid, social_prefs jsonb, marketing_prefs jsonb, engagement_prefs jsonb, monetization_prefs jsonb, system_prefs jsonb, quiet_hours_prefs jsonb, dnd boolean, token text) TO authenticated;
GRANT ALL ON FUNCTION public.upsert_user_notification_preferences(user_uuid uuid, social_prefs jsonb, marketing_prefs jsonb, engagement_prefs jsonb, monetization_prefs jsonb, system_prefs jsonb, quiet_hours_prefs jsonb, dnd boolean, token text) TO service_role;


--
-- Name: TABLE analytics_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.analytics_events TO anon;
GRANT ALL ON TABLE public.analytics_events TO authenticated;
GRANT ALL ON TABLE public.analytics_events TO service_role;


--
-- Name: TABLE blocked_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.blocked_users TO anon;
GRANT ALL ON TABLE public.blocked_users TO authenticated;
GRANT ALL ON TABLE public.blocked_users TO service_role;


--
-- Name: TABLE bundles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bundles TO anon;
GRANT ALL ON TABLE public.bundles TO authenticated;
GRANT ALL ON TABLE public.bundles TO service_role;


--
-- Name: TABLE cities; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cities TO anon;
GRANT ALL ON TABLE public.cities TO authenticated;
GRANT ALL ON TABLE public.cities TO service_role;


--
-- Name: TABLE contact_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contact_messages TO anon;
GRANT ALL ON TABLE public.contact_messages TO authenticated;
GRANT ALL ON TABLE public.contact_messages TO service_role;


--
-- Name: SEQUENCE contact_messages_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.contact_messages_id_seq TO anon;
GRANT ALL ON SEQUENCE public.contact_messages_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.contact_messages_id_seq TO service_role;


--
-- Name: TABLE matches; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.matches TO anon;
GRANT ALL ON TABLE public.matches TO authenticated;
GRANT ALL ON TABLE public.matches TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.messages TO anon;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;


--
-- Name: TABLE conversation_summaries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.conversation_summaries TO anon;
GRANT ALL ON TABLE public.conversation_summaries TO authenticated;
GRANT ALL ON TABLE public.conversation_summaries TO service_role;


--
-- Name: TABLE countries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.countries TO anon;
GRANT ALL ON TABLE public.countries TO authenticated;
GRANT ALL ON TABLE public.countries TO service_role;


--
-- Name: TABLE expo_push_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.expo_push_tokens TO anon;
GRANT ALL ON TABLE public.expo_push_tokens TO authenticated;
GRANT ALL ON TABLE public.expo_push_tokens TO service_role;


--
-- Name: TABLE login_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.login_history TO anon;
GRANT ALL ON TABLE public.login_history TO authenticated;
GRANT ALL ON TABLE public.login_history TO service_role;


--
-- Name: TABLE marketing_campaigns; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.marketing_campaigns TO anon;
GRANT ALL ON TABLE public.marketing_campaigns TO authenticated;
GRANT ALL ON TABLE public.marketing_campaigns TO service_role;


--
-- Name: TABLE notification_analytics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_analytics TO anon;
GRANT ALL ON TABLE public.notification_analytics TO authenticated;
GRANT ALL ON TABLE public.notification_analytics TO service_role;


--
-- Name: TABLE notification_jobs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_jobs TO anon;
GRANT ALL ON TABLE public.notification_jobs TO authenticated;
GRANT ALL ON TABLE public.notification_jobs TO service_role;


--
-- Name: TABLE notification_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_settings TO anon;
GRANT ALL ON TABLE public.notification_settings TO authenticated;
GRANT ALL ON TABLE public.notification_settings TO service_role;


--
-- Name: TABLE notification_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_templates TO anon;
GRANT ALL ON TABLE public.notification_templates TO authenticated;
GRANT ALL ON TABLE public.notification_templates TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: TABLE otp_verifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.otp_verifications TO anon;
GRANT ALL ON TABLE public.otp_verifications TO authenticated;
GRANT ALL ON TABLE public.otp_verifications TO service_role;


--
-- Name: TABLE payment_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_plans TO anon;
GRANT ALL ON TABLE public.payment_plans TO authenticated;
GRANT ALL ON TABLE public.payment_plans TO service_role;


--
-- Name: TABLE promo_code_usage; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.promo_code_usage TO anon;
GRANT ALL ON TABLE public.promo_code_usage TO authenticated;
GRANT ALL ON TABLE public.promo_code_usage TO service_role;


--
-- Name: TABLE referral_rewards; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.referral_rewards TO anon;
GRANT ALL ON TABLE public.referral_rewards TO authenticated;
GRANT ALL ON TABLE public.referral_rewards TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: TABLE referral_analytics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.referral_analytics TO anon;
GRANT ALL ON TABLE public.referral_analytics TO authenticated;
GRANT ALL ON TABLE public.referral_analytics TO service_role;


--
-- Name: TABLE referrals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.referrals TO anon;
GRANT ALL ON TABLE public.referrals TO authenticated;
GRANT ALL ON TABLE public.referrals TO service_role;


--
-- Name: TABLE reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.reports TO anon;
GRANT ALL ON TABLE public.reports TO authenticated;
GRANT ALL ON TABLE public.reports TO service_role;


--
-- Name: TABLE states; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.states TO anon;
GRANT ALL ON TABLE public.states TO authenticated;
GRANT ALL ON TABLE public.states TO service_role;


--
-- Name: TABLE subscriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.subscriptions TO anon;
GRANT ALL ON TABLE public.subscriptions TO authenticated;
GRANT ALL ON TABLE public.subscriptions TO service_role;


--
-- Name: TABLE superlikes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.superlikes TO anon;
GRANT ALL ON TABLE public.superlikes TO authenticated;
GRANT ALL ON TABLE public.superlikes TO service_role;


--
-- Name: TABLE swipes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.swipes TO anon;
GRANT ALL ON TABLE public.swipes TO authenticated;
GRANT ALL ON TABLE public.swipes TO service_role;


--
-- Name: TABLE system_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_logs TO anon;
GRANT ALL ON TABLE public.system_logs TO authenticated;
GRANT ALL ON TABLE public.system_logs TO service_role;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transactions TO anon;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;


--
-- Name: TABLE user_notification_preferences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_notification_preferences TO anon;
GRANT ALL ON TABLE public.user_notification_preferences TO authenticated;
GRANT ALL ON TABLE public.user_notification_preferences TO service_role;


--
-- Name: TABLE whatsapp_outbox; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.whatsapp_outbox TO anon;
GRANT ALL ON TABLE public.whatsapp_outbox TO authenticated;
GRANT ALL ON TABLE public.whatsapp_outbox TO service_role;


--
-- Name: SEQUENCE whatsapp_outbox_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.whatsapp_outbox_id_seq TO anon;
GRANT ALL ON SEQUENCE public.whatsapp_outbox_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.whatsapp_outbox_id_seq TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict 5eUSGaCy8foNckKqNvSH4xTtaCQXkgo2hFbQpHgnc53qdr0irJogLOUnFCWkb7g

