-- Replace partial unique index with a proper UNIQUE constraint on dedupe_key
do $$ begin
  if exists (
    select 1 from pg_indexes 
    where schemaname = 'public' and indexname = 'notification_jobs_dedupe_idx'
  ) then
    drop index public.notification_jobs_dedupe_idx;
  end if;
exception when others then null; end $$;

alter table if exists public.notification_jobs
  add constraint notification_jobs_dedupe_key_unique unique (dedupe_key);


