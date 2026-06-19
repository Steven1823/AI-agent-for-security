-- PulseGuard AI — Supabase schema.
-- Apply this in the Supabase SQL editor after creating the project.
-- The app still runs without Supabase (in-memory temporal store, no auth),
-- but auth + profiles + persisted incidents require this schema.

-- ---------------------------------------------------------------------------
-- Profiles + RBAC
-- ---------------------------------------------------------------------------
-- Roles enum: admin | engineer | viewer
do $$ begin
  create type public.user_role as enum ('admin', 'engineer', 'viewer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  full_name    text not null default '',
  organization text not null default '',
  role         public.user_role not null default 'viewer',
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

-- Each user can read and update their own profile.
drop policy if exists "profiles self read"   on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles admin read"  on public.profiles;

create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can read everyone (used by the future user-management screen).
create policy "profiles admin read"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Auto-create a profile row when a new auth.users row is inserted. Pulls
-- full_name / organization / role from the `options.data` payload supplied
-- by the signup form. Falls back to safe defaults so the trigger never
-- breaks an auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := coalesce(new.raw_user_meta_data ->> 'role', 'viewer');
begin
  if meta_role not in ('admin', 'engineer', 'viewer') then
    meta_role := 'viewer';
  end if;

  insert into public.profiles (id, email, full_name, organization, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'organization', ''),
    meta_role::public.user_role,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Incidents
-- ---------------------------------------------------------------------------
create table if not exists public.incidents (
  id text primary key,
  type text not null,
  title text not null,
  service text not null,
  severity text not null,
  status text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_ms integer,
  recovery_action text,
  recovery_stage text,
  root_cause text,
  explanation text,
  threat_score integer default 0,
  metric_impact integer default 0,
  owner_id uuid references auth.users (id) on delete set null
);

alter table public.incidents enable row level security;

drop policy if exists "incidents read authenticated"   on public.incidents;
drop policy if exists "incidents write engineer+admin" on public.incidents;
drop policy if exists "incidents update engineer+admin" on public.incidents;
drop policy if exists "incidents delete admin" on public.incidents;

-- Any authenticated user can read incidents.
create policy "incidents read authenticated"
  on public.incidents for select
  using (auth.role() = 'authenticated');

-- Engineers + admins can insert/update.
create policy "incidents write engineer+admin"
  on public.incidents for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('engineer', 'admin')
    )
  );

create policy "incidents update engineer+admin"
  on public.incidents for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('engineer', 'admin')
    )
  );

-- Only admins can delete.
create policy "incidents delete admin"
  on public.incidents for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
