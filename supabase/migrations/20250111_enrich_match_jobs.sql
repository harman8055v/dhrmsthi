-- Ensure match jobs include otherName for better body text
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
  v_other_name text;
  v_dedupe text;
begin
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

  select trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,''))
    into v_other_name
  from public.users u
  where u.id = v_other;

  if v_other_name is null or length(trim(v_other_name)) = 0 then
    v_other_name := 'your match';
  end if;

  v_dedupe := 'match:' || least(new.user1_id, new.user2_id)::text || ':' || greatest(new.user1_id, new.user2_id)::text;

  perform public.enqueue_notification_job(
    'match',
    v_original,
    jsonb_build_object('otherUserId', v_other, 'otherName', v_other_name, 'matchId', new.id),
    now(),
    v_dedupe
  );

  return new;
end;
$$;


