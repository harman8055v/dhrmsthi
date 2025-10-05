alter table public.users
  add column if not exists email_notified_at timestamptz,
  add column if not exists wati_notified_at timestamptz;

create index if not exists idx_users_email_notified on public.users(email_notified_at);
create index if not exists idx_users_wati_notified on public.users(wati_notified_at);


