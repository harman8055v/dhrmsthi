create or replace view public.user_review_rules as
with base as (
  select
    u.id,
    coalesce(u.profile_score,5) as profile_score,
    coalesce(jsonb_array_length(u.user_photos),0) as photo_count,
    coalesce(length(u.about_me),0) + coalesce(length(u.ideal_partner_notes),0) as text_len,
    (
      (u.full_name is not null)::int + (u.gender is not null)::int + (u.birthdate is not null)::int +
      (u.education is not null)::int + (u.profession is not null)::int + (u.mother_tongue is not null)::int +
      (u.about_me is not null)::int + (u.ideal_partner_notes is not null)::int +
      (u.city_id is not null)::int + (u.state_id is not null)::int + (u.country_id is not null)::int
    )::float / 11.0 as completeness,
    (select count(*) from public.reports r where r.reported_user_id = u.id and r.created_at > now() - interval '180 days') as reports_180d,
    (
      case when coalesce(jsonb_array_length(u.user_photos),0)=0 then 2 else 0 end +
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


