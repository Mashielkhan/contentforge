-- ContentForge initial schema
-- Run with Supabase CLI: supabase db push

create extension if not exists pgcrypto;

create type public.content_kind as enum ('repurpose', 'write', 'meeting');
create type public.sync_state as enum ('pending', 'synced', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  product_details text not null default '',
  audience text not null default '',
  voice text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index brand_profiles_one_default_per_user
  on public.brand_profiles(user_id) where is_default;
create index brand_profiles_user_id_idx on public.brand_profiles(user_id);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  kind public.content_kind not null,
  title text not null default '',
  source_url text,
  source_text text,
  tone text,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  is_favorite boolean not null default false,
  sync_state public.sync_state not null default 'synced',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, client_id)
);

create index content_items_user_updated_idx on public.content_items(user_id, updated_at desc);
create index content_items_user_favorites_idx on public.content_items(user_id, is_favorite) where deleted_at is null;
create index content_items_search_idx on public.content_items using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(source_text, '')));

create table public.generation_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  generation_count integer not null default 0 check (generation_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger brand_profiles_set_updated_at before update on public.brand_profiles
for each row execute function public.set_updated_at();
create trigger content_items_set_updated_at before update on public.content_items
for each row execute function public.set_updated_at();
create trigger generation_usage_set_updated_at before update on public.generation_usage
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.content_items enable row level security;
alter table public.generation_usage enable row level security;

create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy brand_profiles_select_own on public.brand_profiles for select using (auth.uid() = user_id);
create policy brand_profiles_insert_own on public.brand_profiles for insert with check (auth.uid() = user_id);
create policy brand_profiles_update_own on public.brand_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy brand_profiles_delete_own on public.brand_profiles for delete using (auth.uid() = user_id);

create policy content_items_select_own on public.content_items for select using (auth.uid() = user_id);
create policy content_items_insert_own on public.content_items for insert with check (auth.uid() = user_id);
create policy content_items_update_own on public.content_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy content_items_delete_own on public.content_items for delete using (auth.uid() = user_id);

create policy generation_usage_select_own on public.generation_usage for select using (auth.uid() = user_id);

-- Atomic usage increment. The backend should call this RPC after auth and plan checks.
create or replace function public.increment_generation_usage(target_user_id uuid)
returns public.generation_usage
language plpgsql security definer set search_path = public as $$
declare result public.generation_usage;
begin
  if auth.uid() is null or auth.uid() <> target_user_id then
    raise exception 'not authorized';
  end if;
  insert into public.generation_usage(user_id, usage_date, generation_count)
  values (target_user_id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set generation_count = public.generation_usage.generation_count + 1, updated_at = now()
  returning * into result;
  return result;
end;
$$;

revoke all on function public.increment_generation_usage(uuid) from public;
grant execute on function public.increment_generation_usage(uuid) to authenticated;
