-- order_status(p_id) — lets the fan app read ONE order's live status by id.
-- Run once in Supabase: SQL Editor ▸ New query ▸ paste ▸ Run.
--
-- Why an RPC: the hardened RLS blocks anonymous SELECTs on `orders` (no
-- enumeration). The fan still needs to track its own order, and it knows that
-- order's id (it generates it at checkout). This security-definer function
-- returns just the row for that id — status only, no way to list others.

create or replace function public.order_status(p_id uuid)
returns table (stage smallint, order_no bigint, runner_name text)
language sql
security definer
set search_path = public
as $$
  select stage, order_no, runner_name
  from public.orders
  where id = p_id;
$$;

-- Fans are anonymous; runners are authenticated. Both may call it.
grant execute on function public.order_status(uuid) to anon, authenticated;
