-- Meeting privacy preferences, retention records, and user data deletion

create table public.meeting_privacy_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  auto_delete_enabled boolean not null default true,
  retention_days smallint not null default 30 check (retention_days = 30),
  updated_at timestamptz not null default now()
);

create table public.meeting_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled meeting',
  transcript_text text,
  audio_storage_path text,
  analysis_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meeting_records_retention_idx on public.meeting_records(user_id, created_at);

create trigger meeting_privacy_preferences_set_updated_at before update on public.meeting_privacy_preferences
for each row execute function public.set_updated_at();
create trigger meeting_records_set_updated_at before update on public.meeting_records
for each row execute function public.set_updated_at();

alter table public.meeting_privacy_preferences enable row level security;
alter table public.meeting_records enable row level security;

create policy meeting_privacy_preferences_select_own on public.meeting_privacy_preferences for select using (auth.uid() = user_id);
create policy meeting_privacy_preferences_insert_own on public.meeting_privacy_preferences for insert with check (auth.uid() = user_id);
create policy meeting_privacy_preferences_update_own on public.meeting_privacy_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy meeting_privacy_preferences_delete_own on public.meeting_privacy_preferences for delete using (auth.uid() = user_id);

create policy meeting_records_select_own on public.meeting_records for select using (auth.uid() = user_id);
create policy meeting_records_insert_own on public.meeting_records for insert with check (auth.uid() = user_id);
create policy meeting_records_update_own on public.meeting_records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy meeting_records_delete_own on public.meeting_records for delete using (auth.uid() = user_id);

create or replace function public.get_expired_meeting_records()
returns table (id uuid, audio_storage_path text)
language sql security definer set search_path = public as $$
  select m.id, m.audio_storage_path
  from public.meeting_records m
  join public.meeting_privacy_preferences p on p.user_id = m.user_id
  where p.auto_delete_enabled = true
    and m.created_at < now() - make_interval(days => p.retention_days);
$$;

create or replace function public.delete_expired_meeting_records()
returns integer
language plpgsql security definer set search_path = public as $$
declare deleted_count integer;
begin
  with expired as (
    select m.id
    from public.meeting_records m
    join public.meeting_privacy_preferences p on p.user_id = m.user_id
    where p.auto_delete_enabled = true
      and m.created_at < now() - make_interval(days => p.retention_days)
  )
  delete from public.meeting_records m using expired e where m.id = e.id;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

create or replace function public.delete_my_data()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authorized'; end if;
  delete from public.meeting_records where user_id = auth.uid();
  delete from public.meeting_privacy_preferences where user_id = auth.uid();
  delete from public.device_tokens where user_id = auth.uid();
  delete from public.notification_preferences where user_id = auth.uid();
  delete from public.content_items where user_id = auth.uid();
  delete from public.brand_profiles where user_id = auth.uid();
  delete from public.generation_usage where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end;
$$;

revoke all on function public.get_expired_meeting_records() from public;
revoke all on function public.delete_expired_meeting_records() from public;
revoke all on function public.delete_my_data() from public;
grant execute on function public.delete_my_data() to authenticated;
