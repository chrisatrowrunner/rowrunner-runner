-- RowRunner — add customer name, handoff code, and special-instructions notes.
-- Run once in Supabase: SQL Editor ▸ New query ▸ paste ▸ Run. Idempotent.

-- columns
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists code text;          -- 6-digit handoff code
alter table public.orders add column if not exists notes text;         -- dietary / special instructions

-- Hide the handoff `code` from the table API (column-level grants), so a runner
-- can't read it — they must get it from the guest. Everything else stays
-- readable, including customer_name and notes.
revoke select on public.orders from anon, authenticated;
grant select (id, order_no, venue_id, seat, stand, lines, placed_at, stage,
              runner_id, runner_name, customer_name, notes)
  on public.orders to anon, authenticated;

-- Deliver only when the guest's code matches (security definer can read `code`).
create or replace function public.deliver_order(p_id uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare n int;
begin
  update public.orders set stage = 4
   where id = p_id and code = p_code and stage < 4;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;
grant execute on function public.deliver_order(uuid, text) to anon, authenticated;
