-- RowRunner — customer name + 6-digit handoff code.
-- Run once in Supabase: SQL Editor ▸ New query ▸ paste ▸ Run.

-- 1) New columns
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists code text;  -- 6-digit handoff code

-- 2) Keep the handoff code UNREADABLE via the table API (column-level grants).
--    Everyone can still read every other column; `code` is only ever checked
--    server-side by deliver_order(). This is what makes the code a real
--    confirmation: the runner can't peek at it, they must get it from the guest.
revoke select on public.orders from anon, authenticated;
grant select (id, order_no, venue_id, seat, stand, lines, placed_at, stage, runner_id, runner_name, customer_name)
  on public.orders to anon, authenticated;

-- 3) Deliver ONLY when the entered code matches. Security-definer so it can read
--    the hidden code column and update the row; returns true on success.
create or replace function public.deliver_order(p_id uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare n int;
begin
  update public.orders
     set stage = 4
   where id = p_id and code = p_code and stage < 4;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

grant execute on function public.deliver_order(uuid, text) to authenticated;
