-- event-id.sql — per-event scoping for orders.
-- Run once in Supabase: SQL Editor ▸ New query ▸ paste ▸ Run.
-- Additive and safe to run on a live DB: existing apps don't read event_id until
-- the new builds deploy, and anon still has table-level INSERT so the fan can
-- write it. RUN THIS BEFORE deploying the new fan/runner/KDS builds.

-- the event (game) an order belongs to, e.g. 'uri-lasalle-msoc'
alter table public.orders add column if not exists event_id text;

-- make it readable through the API (additive to the existing column-level SELECT
-- grant that hides `code`). Needed because runner/KDS now select event_id.
grant select (event_id) on public.orders to anon, authenticated;

-- optional: index for per-event queries once there are many events
create index if not exists orders_event_idx on public.orders (event_id, placed_at);
