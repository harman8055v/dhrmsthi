-- Add review_notified flag to users for one-time backlog notification
alter table public.users
  add column if not exists review_notified boolean default false;

create index if not exists idx_users_review_notified on public.users(review_notified);


