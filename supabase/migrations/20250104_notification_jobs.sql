-- Notification jobs queue
create table if not exists public.notification_jobs (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0,
  scheduled_at timestamptz not null default now(),
  dedupe_key text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes to efficiently fetch due jobs and look up by recipient
create index if not exists notification_jobs_status_scheduled_idx on public.notification_jobs (status, scheduled_at);
create index if not exists notification_jobs_recipient_idx on public.notification_jobs (recipient_id);
create unique index if not exists notification_jobs_dedupe_idx on public.notification_jobs (dedupe_key) where dedupe_key is not null;

-- Optional: enable RLS (service role bypasses)
alter table public.notification_jobs enable row level security;

-- Helper to enqueue a job
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
  insert into public.notification_jobs(type, recipient_id, payload, scheduled_at, dedupe_key)
  values (p_type, p_recipient_id, coalesce(p_payload, '{}'::jsonb), coalesce(p_scheduled_at, now()), p_dedupe_key)
  on conflict (dedupe_key) where p_dedupe_key is not null do nothing
  returning id into v_id;
  return v_id;
end;
$$;


