-- RowRunner — shared Supabase schema
-- Run this once in your Supabase project: Dashboard ▸ SQL Editor ▸ New query ▸ paste ▸ Run.
-- It creates the single `orders` table both apps share, turns on Realtime, and
-- sets row-level security suitable for a pilot.

-- ── table ────────────────────────────────────────────────────
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  order_no    bigint generated always as identity (start with 4821),
  venue_id    text,
  seat        jsonb not null,                 -- { "section": "204", "row": "J", "seat": "17" }
  stand       jsonb not null,                 -- { "name": "Empire Eats", "loc": "Main Hall · Sec 118" }
  lines       jsonb not null default '[]',    -- [{ "name", "qty", "option", "addons" }]
  placed_at   timestamptz not null default now(),
  stage       smallint not null default 1,    -- 0 received · 1 preparing · 2 picked up · 3 on the way · 4 delivered
  runner_id   text,
  runner_name text
);

-- runner queue query hits these constantly
create index if not exists orders_active_idx on public.orders (stage, placed_at);

-- ── realtime ─────────────────────────────────────────────────
-- Lets the runner app stream changes via supabase.channel(...).
alter publication supabase_realtime add table public.orders;

-- ── row-level security ───────────────────────────────────────
alter table public.orders enable row level security;

-- Fans place orders without logging in (anon key); anyone may read the queue.
create policy "anyone can read orders"  on public.orders for select using (true);
create policy "anyone can place orders" on public.orders for insert with check (true);

-- Only signed-in staff (runners) may claim/deliver.
create policy "staff can update orders" on public.orders
  for update using (auth.role() = 'authenticated') with check (true);

-- NOTE (pilot-grade): these policies are intentionally permissive so the demo
-- works immediately. Before production, scope reads/inserts to the venue and
-- require the claiming runner to match auth.uid().
