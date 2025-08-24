-- Fix match dedupe to allow new match notifications after re-matching
-- Add day bucket to dedupe key so matches can be re-notified daily

create or replace function public.enqueue_job_on_swipe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
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
begin
  if new.action in ('like','superlike') then
    -- Check if reciprocal like exists first
    select * into v_reciprocal
    from public.swipes
    where swiper_id = new.swiped_id and swiped_id = new.swiper_id and action in ('like','superlike')
    order by created_at asc
    limit 1;

    if found then
      -- This is a match! Only send match notification to original liker
      v_is_match := true;
      v_user1 := least(new.swiper_id, new.swiped_id);
      v_user2 := greatest(new.swiper_id, new.swiped_id);

      -- Determine who liked first via timestamps
      select created_at into v_user1_ts from public.swipes where swiper_id = v_user1 and swiped_id = v_user2 and action in ('like','superlike') order by created_at asc limit 1;
      select created_at into v_user2_ts from public.swipes where swiper_id = v_user2 and swiped_id = v_user1 and action in ('like','superlike') order by created_at asc limit 1;

      if v_user2_ts is null or (v_user1_ts is not null and v_user1_ts < v_user2_ts) then
        v_original := v_user1;
        v_other := v_user2;
      else
        v_original := v_user2;
        v_other := v_user1;
      end if;

      -- Add day bucket to dedupe key so re-matches can be notified daily
      v_day_bucket := to_char(now() at time zone 'UTC', 'YYYY-MM-DD');
      v_dedupe := 'match:' || v_user1::text || ':' || v_user2::text || ':' || v_day_bucket;

      -- Resolve other name
      select trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')) into v_other_name from public.users u where u.id = v_other;
      if v_other_name is null or length(trim(v_other_name)) = 0 then v_other_name := 'your match'; end if;

      perform public.enqueue_notification_job(
        'match',
        v_original,
        jsonb_build_object('otherUserId', v_other, 'otherName', v_other_name),
        now(),
        v_dedupe
      );
    else
      -- No reciprocal like exists, send regular like/superlike notification
      v_type := case when new.action = 'superlike' then 'superlike' else 'like' end;
      v_bucket := public._minute_bucket(now());
      v_dedupe := v_type || ':' || new.swiped_id::text || ':' || new.swiper_id::text || ':' || v_bucket;

      perform public.enqueue_notification_job(
        v_type,
        new.swiped_id,
        jsonb_build_object('fromUserId', new.swiper_id),
        now(),
        v_dedupe
      );
    end if;
  end if;

  return new;
end;
$$;
