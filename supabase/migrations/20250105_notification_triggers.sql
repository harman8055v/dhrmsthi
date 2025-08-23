-- Backend-driven notifications: enqueue jobs on DB events
-- Messages → message job; Swipes → like/superlike job; Matches → match job (original liker)

-- Helper to get current minute bucket for dedupe
create or replace function public._minute_bucket(ts timestamptz default now())
returns text language sql immutable as $$
  select floor(extract(epoch from ts) / 60)::bigint::text;
$$;

-- AFTER INSERT ON messages
create or replace function public.enqueue_job_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_preview text;
  v_bucket text;
  v_dedupe text;
begin
  -- Determine recipient (other user in the match)
  select case when m.user1_id = new.sender_id then m.user2_id else m.user1_id end
    into v_recipient
  from public.matches m
  where m.id = new.match_id;

  if v_recipient is null then
    return new;
  end if;

  v_preview := left(coalesce(new.content, ''), 140);
  v_bucket := public._minute_bucket(now());
  v_dedupe := 'msg:' || new.match_id::text || ':' || v_recipient::text || ':' || v_bucket;

  perform public.enqueue_notification_job(
    'message',
    v_recipient,
    jsonb_build_object(
      'preview', v_preview,
      'matchId', new.match_id,
      'senderId', new.sender_id
    ),
    now(),
    v_dedupe
  );

  return new;
end;
$$;

drop trigger if exists trg_enqueue_job_on_message on public.messages;
create trigger trg_enqueue_job_on_message
after insert on public.messages
for each row execute function public.enqueue_job_on_message();

-- AFTER INSERT ON swipes
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
begin
  if new.action not in ('like','superlike') then
    return new;
  end if;

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

  return new;
end;
$$;

drop trigger if exists trg_enqueue_job_on_swipe on public.swipes;
create trigger trg_enqueue_job_on_swipe
after insert on public.swipes
for each row execute function public.enqueue_job_on_swipe();

-- AFTER INSERT ON matches → notify original liker
create or replace function public.enqueue_job_on_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user1_ts timestamptz;
  v_user2_ts timestamptz;
  v_original uuid;
  v_other uuid;
  v_dedupe text;
begin
  -- Look up earliest like times in both directions
  select created_at into v_user1_ts
    from public.swipes
    where swiper_id = new.user1_id and swiped_id = new.user2_id and action in ('like','superlike')
    order by created_at asc limit 1;

  select created_at into v_user2_ts
    from public.swipes
    where swiper_id = new.user2_id and swiped_id = new.user1_id and action in ('like','superlike')
    order by created_at asc limit 1;

  if v_user1_ts is null and v_user2_ts is null then
    return new;
  end if;

  if v_user2_ts is null or (v_user1_ts is not null and v_user1_ts < v_user2_ts) then
    v_original := new.user1_id;
    v_other := new.user2_id;
  else
    v_original := new.user2_id;
    v_other := new.user1_id;
  end if;

  v_dedupe := 'match:' || least(new.user1_id, new.user2_id)::text || ':' || greatest(new.user1_id, new.user2_id)::text;

  perform public.enqueue_notification_job(
    'match',
    v_original,
    jsonb_build_object('otherUserId', v_other, 'matchId', new.id),
    now(),
    v_dedupe
  );

  return new;
end;
$$;

drop trigger if exists trg_enqueue_job_on_match on public.matches;
create trigger trg_enqueue_job_on_match
after insert on public.matches
for each row execute function public.enqueue_job_on_match();


