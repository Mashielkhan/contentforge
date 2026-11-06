-- ContentForge notification registrations and reminder preferences

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now(),
  unique(user_id, token)
);

create index device_tokens_user_id_idx on public.device_tokens(user_id);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_reminder_enabled boolean not null default false,
  daily_reminder_hour smallint not null default 9 check (daily_reminder_hour between 0 and 23),
  daily_reminder_minute smallint not null default 0 check (daily_reminder_minute between 0 and 59),
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now()
);

create trigger device_tokens_set_updated_at before update on public.device_tokens
for each row execute function public.set_updated_at();
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.device_tokens enable row level security;
alter table public.notification_preferences enable row level security;

create policy device_tokens_select_own on public.device_tokens for select using (auth.uid() = user_id);
create policy device_tokens_insert_own on public.device_tokens for insert with check (auth.uid() = user_id);
create policy device_tokens_update_own on public.device_tokens for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy device_tokens_delete_own on public.device_tokens for delete using (auth.uid() = user_id);

create policy notification_preferences_select_own on public.notification_preferences for select using (auth.uid() = user_id);
create policy notification_preferences_insert_own on public.notification_preferences for insert with check (auth.uid() = user_id);
create policy notification_preferences_update_own on public.notification_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notification_preferences_delete_own on public.notification_preferences for delete using (auth.uid() = user_id);
