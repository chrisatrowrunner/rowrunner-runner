// Shared domain types for the RowRunner runner dispatch app.
//
// These mirror the fan app's contract (src/lib/orders.ts in the fan repo):
// the order `stage` uses the SAME 0–4 lifecycle, so a single shared Supabase
// row drives both apps. The runner app only ever reads/writes the slice of that
// row a runner cares about — location, items, stage, and who claimed it.

/** A seat in the venue — identical shape to the fan app's `Seat`. */
export interface Seat {
  section: string
  row: string
  seat: string
}

/** Where the runner physically picks the order up. */
export interface Stand {
  /** restaurant / concession name, e.g. "The Brooklyn Grill" */
  name: string
  /** human location, e.g. "Concourse A · Sec 110" */
  loc: string
}

/** One line of an order, as the runner needs to see it (no pricing). */
export interface OrderLine {
  name: string
  qty: number
  /** chosen option, e.g. "Classic Buffalo" — null when the item has none */
  option: string | null
  /** add-ons, e.g. ["Extra Sauce"] */
  addons: string[]
}

/**
 * Order lifecycle stages — index matches the fan app's StatusTracker STEPS:
 *   0 received · 1 being prepared · 2 picked up by runner · 3 on the way · 4 delivered
 * The runner claims at stage ≤ 1 (→ 2) and delivers (→ 4).
 */
export type OrderStage = 0 | 1 | 2 | 3 | 4

/** The order as the runner app models it. */
export interface RunnerOrder {
  id: string
  orderNo: number
  seat: Seat
  stand: Stand
  lines: OrderLine[]
  /** when the fan placed it (epoch ms) — drives the live age timer */
  placedAt: number
  stage: OrderStage
  /** runner who owns it, or null while it sits in the queue */
  runnerId: string | null
  runnerName: string | null
}

/** A signed-in runner. */
export interface RunnerSession {
  id: string
  name: string
  email: string
}

/** Runner-app screens. */
export type Screen = 'login' | 'queue' | 'active' | 'delivered'
