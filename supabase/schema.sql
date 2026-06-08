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

-- READ — only signed-in staff (runners). Fans never read orders.
create policy "staff read orders" on public.orders
  for select using (auth.uid() is not null);

-- PLACE — fans (anon) may insert, but only a fresh, unassigned order.
create policy "fans place fresh orders" on public.orders
  for insert with check (
    stage = 1 and runner_id is null and runner_name is null
  );

-- CLAIM / DELIVER — signed-in staff only; may act on an unclaimed order or one
-- they already own, and can only ever assign the order to themselves.
create policy "staff claim and deliver" on public.orders
  for update
  using (auth.uid() is not null and (runner_id is null or runner_id = auth.uid()::text))
  with check (runner_id is null or runner_id = auth.uid()::text);

-- No DELETE policy on purpose → app keys can't delete orders (dashboard can).
-- Further hardening to consider: scope reads/inserts to a specific venue_id.
