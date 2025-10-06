-- Text moderation storage for profile fields
create table if not exists public.profile_text_moderation (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  field_name text not null,
  status text not null default 'approved' check (status in ('approved','needs_review','rejected','pending')),
  provider text,
  labels jsonb,
  flags jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ptm_user on public.profile_text_moderation(user_id);
create index if not exists idx_ptm_user_field on public.profile_text_moderation(user_id, field_name);


