-- Track when a user explicitly resubmits details for verification
alter table public.users
  add column if not exists resubmitted_at timestamptz;

create index if not exists idx_users_resubmitted_at
  on public.users(resubmitted_at);


