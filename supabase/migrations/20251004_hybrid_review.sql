-- Hybrid profile review: schema, queues, moderation, rules

-- 1) Users columns for review system
alter table public.users
  add column if not exists review_category text check (review_category in ('eligible','needs_more_details','red_flags','exceptional')),
  add column if not exists review_reason text,
  add column if not exists suspicious_score int default 0,
  add column if not exists missing_fields text[] default '{}',
  add column if not exists needs_review boolean default false,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists review_version int default 1;

create index if not exists idx_users_review_category on public.users(review_category);
create index if not exists idx_users_needs_review on public.users(needs_review);

-- 2) Review queue
create table if not exists public.profile_reviews_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event text not null, -- 'signup' | 'profile_update' | 'backfill'
  status text not null default 'pending' check (status in ('pending','processing','done','failed')),
  attempts int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profile_reviews_queue_status on public.profile_reviews_queue(status);
create index if not exists idx_profile_reviews_queue_user on public.profile_reviews_queue(user_id);

-- 3) Photo moderation table
create table if not exists public.photo_moderation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  object_path text not null,
  status text not null check (status in ('pending','approved','rejected')),
  provider text not null,
  labels jsonb,
  nsfw_score numeric,
  face_count int,
  is_ai_generated boolean,
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_photo_moderation_user on public.photo_moderation(user_id);
create index if not exists idx_photo_moderation_status on public.photo_moderation(status);
create index if not exists idx_photo_moderation_object on public.photo_moderation(object_path);

-- 4) Trigger: enqueue review on signup or profile edits
create or replace function public.enqueue_profile_review() returns trigger as $$
declare
  core_changed boolean;
begin
  core_changed := (tg_op = 'INSERT')
    or (coalesce(new.first_name,'') is distinct from coalesce(old.first_name,''))
    or (coalesce(new.last_name,'')  is distinct from coalesce(old.last_name,''))
    or (coalesce(new.gender,'')     is distinct from coalesce(old.gender,''))
    or (new.birthdate is distinct from old.birthdate)
    or (coalesce(new.education,'')  is distinct from coalesce(old.education,''))
    or (coalesce(new.profession,'') is distinct from coalesce(old.profession,''))
    or (coalesce(new.about_me,'')   is distinct from coalesce(old.about_me,''))
    or (coalesce(new.ideal_partner_notes,'') is distinct from coalesce(old.ideal_partner_notes,''))
    or (coalesce(new.profile_photo_url,'') is distinct from coalesce(old.profile_photo_url,''))
    or (coalesce(jsonb_array_length(new.user_photos),0) <> coalesce(jsonb_array_length(old.user_photos),0));

  if core_changed then
    new.verification_status := coalesce(new.verification_status, 'pending');
    new.is_verified := false;
    new.needs_review := true;

    insert into public.profile_reviews_queue(user_id, event)
    values (new.id, case when tg_op='INSERT' then 'signup' else 'profile_update' end)
    on conflict do nothing;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_enqueue_profile_review on public.users;
create trigger trg_enqueue_profile_review
before insert or update on public.users
for each row execute function public.enqueue_profile_review();

-- 5) Deterministic rules view
create or replace view public.user_review_rules as
with base as (
  select
    u.id,
    coalesce(u.profile_score,5) as profile_score,
    case when u.profile_photo_url is not null then 1 else 0 end + coalesce(jsonb_array_length(u.user_photos),0) as photo_count,
    coalesce(length(u.about_me),0) + coalesce(length(u.ideal_partner_notes),0) as text_len,
    (
      (u.full_name is not null)::int + (u.gender is not null)::int + (u.birthdate is not null)::int +
      (u.education is not null)::int + (u.profession is not null)::int + (u.mother_tongue is not null)::int +
      (u.about_me is not null)::int + (u.ideal_partner_notes is not null)::int +
      (u.city_id is not null)::int + (u.state_id is not null)::int + (u.country_id is not null)::int
    )::float / 11.0 as completeness,
    (select count(*) from public.reports r where r.reported_user_id = u.id and r.created_at > now() - interval '180 days') as reports_180d,
    (
      case when u.profile_photo_url is null and coalesce(jsonb_array_length(u.user_photos),0)=0 then 2 else 0 end +
      case when coalesce(length(u.about_me),0) < 20 then 1 else 0 end +
      case when lower(coalesce(u.about_me,'')) ~ '(http|whatsapp|telegram|instagram|money|crypto)' then 2 else 0 end +
      case when lower(coalesce(u.about_me,'')) ~ '(asdf|qwerty|test)' then 2 else 0 end
    ) as suspicious_score
  from public.users u
)
select
  *,
  array_remove(array[
    case when photo_count < 1 then 'profile_photo' end,
    case when text_len < 100 then 'about_me' end,
    case when completeness < 0.5 then 'basic_profile' end
  ], null) as missing_fields,
  case
    when (completeness < 0.1 and photo_count = 0 and text_len < 20) or suspicious_score >= 3 then 'red_flags'
    when completeness >= 0.8 and photo_count >= 3 and text_len >= 150 and profile_score >= 8 then 'exceptional'
    when completeness >= 0.5 and photo_count >= 1 and text_len >= 80 then 'eligible'
    when completeness >= 0.2 or text_len >= 30 or photo_count >= 1 then 'needs_more_details'
    else 'red_flags'
  end as category_suggested
from base;


