-- Trigger an immediate dispatcher run after a job is enqueued (near-instant pushes)
create extension if not exists pg_net;

create or replace function public.poke_notifications_dispatcher()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

drop trigger if exists trg_poke_notifications_dispatcher on public.notification_jobs;
create trigger trg_poke_notifications_dispatcher
after insert on public.notification_jobs
for each row execute function public.poke_notifications_dispatcher();


