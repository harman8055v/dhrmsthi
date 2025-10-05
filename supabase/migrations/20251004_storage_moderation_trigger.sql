-- Storage -> moderate-photo hook via DB trigger (no Dashboard config required)

create or replace function public.trigger_moderate_photo() returns trigger as $$
begin
  -- Fire-and-forget HTTP call; never block storage write
  begin
    perform net.http_post(
      url := 'https://kcuqbsrurlkfuxrybwqq.supabase.co/functions/v1/moderate-photo',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object(
        'userId', new.owner,
        'bucket', new.bucket_id,
        'path', new.name
      )::text,
      timeout_milliseconds := 3000
    );
  exception when others then
    -- swallow errors; moderation can be retried separately
    null;
  end;
  return null; -- AFTER trigger return ignored
end;
$$ language plpgsql;

drop trigger if exists trg_storage_moderate_photo on storage.objects;
create trigger trg_storage_moderate_photo
after insert on storage.objects
for each row execute function public.trigger_moderate_photo();


