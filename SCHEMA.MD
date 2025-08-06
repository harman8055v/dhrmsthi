Database Schema on Supabase - 

create table public.users (
  id uuid not null default auth.uid (),
  phone text null,
  email text null,
  email_verified boolean null default false,
  mobile_verified boolean null default false,
  full_name text null,
  first_name text null,
  last_name text null,
  gender text null,
  birthdate date null,
  city_id bigint null,
  state_id bigint null,
  country_id bigint null,
  profile_photo_url text null,
  user_photos jsonb null,
  diet text null,
  temple_visit_freq text null,
  artha_vs_moksha text null,
  vanaprastha_interest text null,
  favorite_spiritual_quote text null,
  education text null,
  profession text null,
  annual_income text null,
  marital_status text null,
  super_likes_count integer null default 0,
  swipe_count integer null default 0,
  message_highlights_count integer null default 0,
  is_verified boolean null default false,
  account_status text null default 'drishti'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  daily_swipe_count integer null default 0,
  daily_superlike_count integer null default 0,
  last_swipe_date date null,
  is_banned boolean null default false,
  is_kyc_verified boolean null default false,
  flagged_reason text null,
  role text null default 'user'::text,
  mother_tongue text null,
  about_me text null,
  ideal_partner_notes text null,
  verification_status text null default 'unverified'::text,
  height_ft integer null,
  height_in integer null,
  is_active boolean null default true,
  referral_code character varying(10) null,
  referral_count integer null default 0,
  fast_track_verification boolean null default false,
  total_referrals integer null default 0,
  is_onboarded boolean null default false,
  privacy_settings jsonb null default '{"show_distance": true, "show_last_active": true, "profile_visibility": true, "show_online_status": true, "allow_search_by_phone": false, "show_verification_badge": true, "allow_profile_screenshots": false, "allow_messages_from_matches_only": false}'::jsonb,
  profile_boosts_count integer not null default 0,
  welcome_sent boolean not null default false,
  referred_by character varying null,
  spiritual_org_backup text null,
  daily_practices_backup text null,
  spiritual_org text[] null default array[]::text[],
  daily_practices text[] null default array[]::text[],
  profile_score numeric(3, 1) null,
  constraint users_v2_pkey primary key (id),
  constraint users_referral_code_key unique (referral_code),
  constraint users_v2_email_key unique (email),
  constraint users_v2_state_id_fkey foreign KEY (state_id) references states (id),
  constraint users_v2_city_id_fkey foreign KEY (city_id) references cities (id),
  constraint users_v2_country_id_fkey foreign KEY (country_id) references countries (id),
  constraint users_height_ft_check check (
    (
      (height_ft >= 4)
      and (height_ft <= 7)
    )
  ),
  constraint users_profile_score_range check (
    (
      (profile_score is null)
      or (
        (profile_score >= (0)::numeric)
        and (profile_score <= (10)::numeric)
      )
    )
  ),
  constraint users_v2_gender_check check (
    (
      gender = any (
        array['Male'::text, 'Female'::text, 'Other'::text]
      )
    )
  ),
  constraint users_role_check1 check (
    (
      role = any (
        array[
          'user'::text,
          'admin'::text,
          'super_admin'::text,
          'superadmin'::text
        ]
      )
    )
  ),
  constraint users_height_in_check check (
    (
      (height_in >= 0)
      and (height_in <= 11)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_users_phone on public.users using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_users_created_at on public.users using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_users_country_state_city on public.users using btree (country_id, state_id, city_id) TABLESPACE pg_default;

create index IF not exists idx_users_gender on public.users using btree (gender) TABLESPACE pg_default;

create index IF not exists idx_users_profile_score on public.users using btree (profile_score) TABLESPACE pg_default
where
  (profile_score is not null);

create index IF not exists idx_users_height_ft on public.users using btree (height_ft) TABLESPACE pg_default;

create index IF not exists idx_users_height_in on public.users using btree (height_in) TABLESPACE pg_default;

create index IF not exists idx_users_height_composite on public.users using btree (height_ft, height_in) TABLESPACE pg_default;

create index IF not exists idx_users_referral_code on public.users using btree (referral_code) TABLESPACE pg_default;

create index IF not exists idx_users_verification_status on public.users using btree (verification_status) TABLESPACE pg_default;

create trigger referral_completion_trigger
after
update OF verification_status on users for EACH row
execute FUNCTION process_referral_completion ();

-------

create table public.user_daily_stats (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  date date not null default CURRENT_DATE,
  swipes_used integer null default 0,
  superlikes_used integer null default 0,
  message_highlights_used integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_daily_stats_pkey primary key (id),
  constraint user_daily_stats_user_id_date_key unique (user_id, date),
  constraint user_daily_stats_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_daily_stats_user_date on public.user_daily_stats using btree (user_id, date) TABLESPACE pg_default;


-------


create table public.user_daily_stats (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  date date not null default CURRENT_DATE,
  swipes_used integer null default 0,
  superlikes_used integer null default 0,
  message_highlights_used integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_daily_stats_pkey primary key (id),
  constraint user_daily_stats_user_id_date_key unique (user_id, date),
  constraint user_daily_stats_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_daily_stats_user_date on public.user_daily_stats using btree (user_id, date) TABLESPACE pg_default;


------

create table public.swipes (
  id uuid not null default gen_random_uuid (),
  swiper_id uuid not null,
  swiped_id uuid not null,
  action character varying(20) not null,
  created_at timestamp with time zone null default now(),
  constraint swipes_pkey primary key (id),
  constraint swipes_swiper_id_swiped_id_key unique (swiper_id, swiped_id),
  constraint swipes_swiped_id_fkey foreign KEY (swiped_id) references users (id) on delete CASCADE,
  constraint swipes_swiper_id_fkey foreign KEY (swiper_id) references users (id) on delete CASCADE,
  constraint swipes_action_check check (
    (
      (action)::text = any (
        (
          array[
            'like'::character varying,
            'dislike'::character varying,
            'superlike'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_swipes_swiper on public.swipes using btree (swiper_id) TABLESPACE pg_default;

create index IF not exists idx_swipes_swiped on public.swipes using btree (swiped_id) TABLESPACE pg_default;



-----

create table public.states (
  id bigint not null,
  name text null,
  country_id bigint null,
  country_code text null,
  country_name text null,
  state_code text null,
  type text null,
  latitude text null,
  longitude text null,
  constraint states_pkey primary key (id)
) TABLESPACE pg_default;


----

create table public.reports (
  id uuid not null default gen_random_uuid (),
  reporter_id uuid null,
  reported_user_id uuid null,
  reason text null,
  created_at timestamp with time zone null default now(),
  constraint reports_pkey primary key (id),
  constraint reports_reported_user_id_fkey foreign KEY (reported_user_id) references users (id) on delete CASCADE,
  constraint reports_reporter_id_fkey foreign KEY (reporter_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_reports_reported_user on public.reports using btree (reported_user_id) TABLESPACE pg_default;

create index IF not exists idx_reports_reporter_user on public.reports using btree (reporter_id) TABLESPACE pg_default;


-----


create table public.referrals (
  id uuid not null default gen_random_uuid (),
  referrer_id uuid not null,
  referred_id uuid not null,
  referral_code character varying(10) not null,
  status character varying(20) null default 'pending'::character varying,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  reward_given boolean null default false,
  reward_amount integer null default 0,
  constraint referrals_pkey primary key (id),
  constraint referrals_referrer_id_referred_id_key unique (referrer_id, referred_id)
) TABLESPACE pg_default;

create index IF not exists idx_referrals_referrer_id on public.referrals using btree (referrer_id) TABLESPACE pg_default;

create index IF not exists idx_referrals_referred_id on public.referrals using btree (referred_id) TABLESPACE pg_default;

create index IF not exists idx_referrals_code on public.referrals using btree (referral_code) TABLESPACE pg_default;

create index IF not exists idx_referrals_status on public.referrals using btree (status) TABLESPACE pg_default;



-----

create table public.messages (
  id uuid not null default gen_random_uuid (),
  match_id uuid not null,
  sender_id uuid not null,
  content text not null,
  is_highlighted boolean null default false,
  created_at timestamp with time zone null default now(),
  read_at timestamp with time zone null,
  constraint messages_pkey primary key (id),
  constraint messages_match_id_fkey foreign KEY (match_id) references matches (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_messages_match on public.messages using btree (match_id) TABLESPACE pg_default;

create index IF not exists idx_messages_created_at on public.messages using btree (created_at) TABLESPACE pg_default;

create trigger protect_message_updates_trigger BEFORE
update on messages for EACH row
execute FUNCTION protect_message_updates ();


-----

create table public.messages (
  id uuid not null default gen_random_uuid (),
  match_id uuid not null,
  sender_id uuid not null,
  content text not null,
  is_highlighted boolean null default false,
  created_at timestamp with time zone null default now(),
  read_at timestamp with time zone null,
  constraint messages_pkey primary key (id),
  constraint messages_match_id_fkey foreign KEY (match_id) references matches (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_messages_match on public.messages using btree (match_id) TABLESPACE pg_default;

create index IF not exists idx_messages_created_at on public.messages using btree (created_at) TABLESPACE pg_default;

create trigger protect_message_updates_trigger BEFORE
update on messages for EACH row
execute FUNCTION protect_message_updates ();


-----

create table public.messages (
  id uuid not null default gen_random_uuid (),
  match_id uuid not null,
  sender_id uuid not null,
  content text not null,
  is_highlighted boolean null default false,
  created_at timestamp with time zone null default now(),
  read_at timestamp with time zone null,
  constraint messages_pkey primary key (id),
  constraint messages_match_id_fkey foreign KEY (match_id) references matches (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_messages_match on public.messages using btree (match_id) TABLESPACE pg_default;

create index IF not exists idx_messages_created_at on public.messages using btree (created_at) TABLESPACE pg_default;

create trigger protect_message_updates_trigger BEFORE
update on messages for EACH row
execute FUNCTION protect_message_updates ();



-----

create table public.contact_messages (
  id bigserial not null,
  name character varying(255) not null,
  email character varying(255) not null,
  subject character varying(500) not null,
  message text not null,
  status character varying(50) not null default 'unread'::character varying,
  replied_by uuid null,
  replied_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint contact_messages_pkey primary key (id),
  constraint contact_messages_replied_by_fkey foreign KEY (replied_by) references users (id) on delete set null
) TABLESPACE pg_default;

create trigger trg_update_ts BEFORE
update on contact_messages for EACH row
execute FUNCTION update_contact_messages_updated_at ();


-----

create table public.cities (
  id bigint not null,
  name text null,
  state_id bigint null,
  state_code text null,
  state_name text null,
  country_id bigint null,
  country_code text null,
  country_name text null,
  latitude double precision null,
  longitude double precision null,
  "wikiDataId" text null,
  constraint cities_pkey primary key (id)
) TABLESPACE pg_default;

