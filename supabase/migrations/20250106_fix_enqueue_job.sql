-- Fix enqueue_notification_job to avoid invalid ON CONFLICT WHERE predicate
create or replace function public.enqueue_notification_job(
  p_type text,
  p_recipient_id uuid,
  p_payload jsonb default '{}'::jsonb,
  p_scheduled_at timestamptz default now(),
  p_dedupe_key text default null
)
returns uuid
language plpgsql
as $$
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


