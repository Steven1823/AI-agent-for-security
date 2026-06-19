-- PulseGuard AI — optional Supabase schema.
-- The app runs fully without this (in-memory temporal store). Apply this
-- only if you set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.

create table if not exists incidents (
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
  metric_impact integer default 0
);

alter table incidents enable row level security;

-- Demo policy: allow anon read/write. Tighten for production.
create policy "anon full access" on incidents
  for all using (true) with check (true);
