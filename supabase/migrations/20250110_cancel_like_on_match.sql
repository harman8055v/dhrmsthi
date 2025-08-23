-- When a match is created, cancel like/superlike jobs between these two users
create or replace function public.cancel_like_jobs_on_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

drop trigger if exists trg_cancel_like_on_match on public.matches;
create trigger trg_cancel_like_on_match
after insert on public.matches
for each row execute function public.cancel_like_jobs_on_match();


