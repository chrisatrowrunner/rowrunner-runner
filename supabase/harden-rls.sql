-- RowRunner — tighten the pilot RLS policies before going public.
-- Run once in Supabase: SQL Editor ▸ New query ▸ paste ▸ Run.
-- Safe to run on top of the original schema.sql (it drops the old policies first).

-- out with the permissive ones
drop policy if exists "anyone can read orders"  on public.orders;
drop policy if exists "anyone can place orders" on public.orders;
drop policy if exists "staff can update orders" on public.orders;

-- READ — only signed-in staff (runners). Fans never read orders.
create policy "staff read orders" on public.orders
  for select
  using (auth.uid() is not null);

-- PLACE — fans (anon) may insert, but only a fresh, unassigned order:
-- no pre-set stage past "preparing", no runner attached.
create policy "fans place fresh orders" on public.orders
  for insert
  with check (
    stage = 1
    and runner_id is null
    and runner_name is null
  );

-- CLAIM / DELIVER — signed-in staff only. You may act on an order that is
-- unclaimed OR already yours, and you can only ever assign it to yourself.
-- (This enforces the no-double-claim rule at the database, not just the UI.)
create policy "staff claim and deliver" on public.orders
  for update
  using (
    auth.uid() is not null
    and (runner_id is null or runner_id = auth.uid()::text)
  )
  with check (
    runner_id is null or runner_id = auth.uid()::text
  );

-- No DELETE policy on purpose → neither apps' keys can delete orders.
-- (You can still delete from the dashboard, which uses the service role.)
