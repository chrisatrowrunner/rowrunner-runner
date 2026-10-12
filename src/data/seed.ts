// seed.ts — local stand-in for the shared Supabase order feed.
//
// In production the runner queue is a live query on the `orders` table the fan
// app writes to. Here we generate believable orders so the whole claim →
// deliver flow is clickable with no backend. The stand/zones/items below match
// the URI men's soccer pilot the fan app ships (one food truck, zone seating).
// The multi-vendor NYC Tech Week version is at the `pre-uri-soccer` git tag.
import type { OrderLine, RunnerOrder, Seat, Stand } from '../types'

// The one food truck for the pilot.
export const STANDS: Stand[] = [{ name: "Pam's Grill", loc: 'Food truck · East gate, Tootell Rd' }]

// Item pool: name + the options/add-ons a fan might have chosen.
const ITEM_POOL: OrderLine[] = [
  { name: 'Classic Cheeseburger', qty: 1, option: 'Double', addons: ['Bacon'] },
  { name: 'Black Bean Veggie Burger', qty: 1, option: null, addons: ['Avocado'] },
  { name: 'Crispy Chicken Sandwich', qty: 1, option: 'Spicy', addons: [] },
  { name: 'All-Beef Hot Dog', qty: 2, option: 'Chili Dog', addons: [] },
  { name: 'Chicken Tenders', qty: 1, option: 'Honey Mustard', addons: ['Extra Sauce'] },
  { name: 'French Fries', qty: 1, option: 'Large', addons: ['Cheese Sauce'] },
  { name: 'Onion Rings', qty: 1, option: null, addons: [] },
  { name: 'Mozzarella Sticks', qty: 1, option: null, addons: ['Extra Marinara'] },
]

// Zones on the URI Soccer Complex map (same as the fan app's ZONES).
const ZONE_SEATS: Seat[] = [
  ...['A0', 'A1', 'A2', 'A3', 'A4'].map((z) => ({
    section: z, row: '', seat: '', zone: z, label: `Section ${z}`, detail: 'South bleachers',
  })),
  { section: 'B', row: '', seat: '', zone: 'B', label: 'Zone B', detail: 'North sideline' },
  { section: 'C', row: '', seat: '', zone: 'C', label: 'Zone C', detail: 'East end' },
  { section: 'D', row: '', seat: '', zone: 'D', label: 'Zone D', detail: 'West end' },
]
const NAMES = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Jamie']

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

function randomSeat(): Seat {
  return { ...pick(ZONE_SEATS) }
}

function randomLines(): OrderLine[] {
  const n = 1 + Math.floor(Math.random() * 3) // 1–3 distinct items
  const shuffled = [...ITEM_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n).map((l) => ({ ...l }))
}

let nextOrderNo = 4821

/** Build one fresh, unclaimed order placed `ageSec` seconds ago. */
export function makeOrder(ageSec = 0): RunnerOrder {
  return {
    id: 'ord_' + Math.random().toString(36).slice(2, 10),
    orderNo: nextOrderNo++,
    customerName: pick(NAMES),
    notes: null,
    seat: randomSeat(),
    stand: pick(STANDS),
    lines: randomLines(),
    placedAt: Date.now() - ageSec * 1000,
    // Mock has no KDS step, so treat every seeded order as kitchen-ready
    // (otherwise the ready_at queue gate would hide them all).
    readyAt: Date.now() - ageSec * 1000,
    stage: 1, // being prepared — ready for a runner to claim
    runnerId: null,
    runnerName: null,
  }
}

/** Seed the queue with a spread of ages so urgency colors read on first paint. */
export function seedOrders(): RunnerOrder[] {
  return [320, 215, 140, 70, 25].map((age) => makeOrder(age))
}
