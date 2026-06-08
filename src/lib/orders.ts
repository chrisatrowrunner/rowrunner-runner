// orders.ts — the integration seam between the runner UI and the backend.
//
// By default the runner app talks to the shared **edge server** (see
// ../../../rowrunner-edge) — the same order bus the fan app POSTs to, so the
// queue is fed by REAL fan orders, not a simulator. Realtime arrives over SSE.
//
// This is the runner-side mirror of the fan app's seam. Swapping the edge for
// Supabase later means implementing `createSupabaseApi` (reference calls below)
// and changing the one line in `createOrdersApi()`. The screens never change —
// they only ever see the RunnerOrdersApi interface.
//
// A local simulator (`createMockApi`) is kept for offline/dev work; opt in with
// VITE_USE_MOCK=1.
import type { RunnerOrder, RunnerSession } from '../types'
import { makeOrder, seedOrders } from '../data/seed'
import { getSupabase, hasSupabase } from './supabase'

/** Everything the runner screens need from the backend. */
export interface RunnerOrdersApi {
  /** Active orders: not delivered, not cancelled. Sorted oldest-first. */
  listActive(): Promise<RunnerOrder[]>
  /** Claim an order for a runner: stage → 2 (picked up), runner assigned. */
  claim(orderId: string, runner: RunnerSession): Promise<RunnerOrder>
  /** Deliver an order — only succeeds if `code` matches the guest's. Returns true on success. */
  deliver(orderId: string, code: string): Promise<boolean>
  /** Live updates — fires the full active set whenever anything changes. */
  subscribe(onChange: (orders: RunnerOrder[]) => void): () => void
}

const byAge = (a: RunnerOrder, b: RunnerOrder) => a.placedAt - b.placedAt

const EDGE_URL = import.meta.env.VITE_EDGE_URL || 'http://localhost:4000'
const USE_MOCK = !!import.meta.env.VITE_USE_MOCK

// ── Edge implementation (default) ────────────────────────────
// Talks to the shared rowrunner-edge server over fetch + Server-Sent Events.
function createEdgeApi(): RunnerOrdersApi {
  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`${EDGE_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`edge ${res.status}`)
    return (await res.json()) as RunnerOrder
  }
  return {
    async listActive() {
      const res = await fetch(`${EDGE_URL}/orders?active=1`)
      return ((await res.json()) as RunnerOrder[]).sort(byAge)
    },
    claim(orderId, runner) {
      return patch(orderId, { stage: 2, runnerId: runner.id, runnerName: runner.name })
    },
    async deliver(orderId) {
      // Edge server has no code verification — just mark delivered.
      await patch(orderId, { stage: 4 })
      return true
    },
    subscribe(onChange) {
      const es = new EventSource(`${EDGE_URL}/events`)
      es.onmessage = (e) => {
        try {
          onChange((JSON.parse(e.data) as RunnerOrder[]).sort(byAge))
        } catch {
          /* ignore malformed frame */
        }
      }
      return () => es.close()
    },
  }
}

// ── Mock implementation (opt-in via VITE_USE_MOCK) ───────────
// In-memory store that streams a new order every so often — for offline dev only.
function createMockApi(): RunnerOrdersApi {
  let orders = seedOrders()
  const subs = new Set<(o: RunnerOrder[]) => void>()
  let timer: ReturnType<typeof setInterval> | null = null

  const active = () => orders.filter((o) => o.stage < 4).sort(byAge)
  const emit = () => {
    const snapshot = active()
    subs.forEach((fn) => fn(snapshot))
  }

  const start = () => {
    if (timer) return
    timer = setInterval(() => {
      orders = [...orders, makeOrder(0)]
      emit()
    }, 14000 + Math.floor(Math.random() * 8000))
  }
  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
  }

  const find = (id: string) => {
    const o = orders.find((x) => x.id === id)
    if (!o) throw new Error(`order ${id} not found`)
    return o
  }

  return {
    async listActive() {
      return active()
    },
    async claim(orderId, runner) {
      const o = find(orderId)
      o.runnerId = runner.id
      o.runnerName = runner.name
      o.stage = 2
      emit()
      return o
    },
    async deliver(orderId) {
      const o = find(orderId)
      o.stage = 4
      emit()
      return true
    },
    subscribe(onChange) {
      subs.add(onChange)
      start()
      onChange(active())
      return () => {
        subs.delete(onChange)
        if (subs.size === 0) stop()
      }
    },
  }
}

// ── Supabase implementation (used when env vars are set) ─────
// Explicit column list — NEVER select `code` (the handoff code is hidden from
// the table API by column-level grants; it's only verified via deliver_order).
const COLS = 'id, order_no, customer_name, seat, stand, lines, placed_at, stage, runner_id, runner_name'

/** Raw `orders` table row (snake_case) → RunnerOrder (camelCase). */
type OrderRow = {
  id: string
  order_no: number
  customer_name: string | null
  seat: RunnerOrder['seat']
  stand: RunnerOrder['stand']
  lines: RunnerOrder['lines'] | null
  placed_at: string
  stage: RunnerOrder['stage']
  runner_id: string | null
  runner_name: string | null
}
function rowToOrder(r: OrderRow): RunnerOrder {
  return {
    id: r.id,
    orderNo: r.order_no,
    customerName: r.customer_name,
    seat: r.seat,
    stand: r.stand,
    lines: r.lines ?? [],
    placedAt: new Date(r.placed_at).getTime(),
    stage: r.stage,
    runnerId: r.runner_id,
    runnerName: r.runner_name,
  }
}

function createSupabaseApi(): RunnerOrdersApi {
  const sb = getSupabase()
  const listActive = async () => {
    const { data, error } = await sb
      .from('orders')
      .select(COLS)
      .lt('stage', 4)
      .order('placed_at', { ascending: true })
    if (error) throw error
    return (data as unknown as OrderRow[]).map(rowToOrder)
  }
  return {
    listActive,
    async claim(orderId, runner) {
      // .is('runner_id', null) makes the claim atomic — a second runner gets 0 rows.
      const { data, error } = await sb
        .from('orders')
        .update({ stage: 2, runner_id: runner.id, runner_name: runner.name })
        .eq('id', orderId)
        .is('runner_id', null)
        .select(COLS)
        .single()
      if (error) throw new Error('This order was just claimed by someone else.')
      return rowToOrder(data as unknown as OrderRow)
    },
    async deliver(orderId, code) {
      // Server verifies the guest's code and only then sets stage 4.
      const { data, error } = await sb.rpc('deliver_order', { p_id: orderId, p_code: code })
      if (error) throw error
      return data === true
    },
    subscribe(onChange) {
      listActive().then(onChange).catch(() => {})
      const ch = sb
        .channel('orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          listActive().then(onChange).catch(() => {})
        })
        .subscribe()
      return () => {
        sb.removeChannel(ch)
      }
    },
  }
}

/** Supabase when configured; else edge; else local simulator (VITE_USE_MOCK). */
export function createOrdersApi(): RunnerOrdersApi {
  if (hasSupabase) return createSupabaseApi()
  return USE_MOCK ? createMockApi() : createEdgeApi()
}

/** True when no real auth backend is configured (drives the login demo hint). */
export const isMockMode = !hasSupabase
