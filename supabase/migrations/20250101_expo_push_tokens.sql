-- Device tokens (multiple devices per user allowed)
create table if not exists public.expo_push_tokens (
  user_id uuid references auth.users(id) on delete cascade,
  token text not null,
  platform text check (platform in ('ios','android','web')) default 'android',
  updated_at timestamptz default now(),
  last_used_at timestamptz,
  primary key (user_id, token)
);

alter table public.expo_push_tokens enable row level security;

do $$ begin
  create policy "users manage own expo tokens"
  on public.expo_push_tokens
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Helper to bump last_used_at after successful sends
create or replace function public.touch_tokens_last_used(tokens_in text[])
returns void language sql as $$
  update public.expo_push_tokens
     set last_used_at = now()
   where token = any(tokens_in);
$$;
