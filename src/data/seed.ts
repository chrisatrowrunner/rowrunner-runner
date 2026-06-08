// seed.ts — local stand-in for the shared Supabase order feed.
//
// In production the runner queue is a live query on the `orders` table the fan
// app writes to. Here we generate believable orders so the whole claim →
// deliver flow is clickable with no backend. The vendors/seats/items below are
// drawn from the same NYC Tech Week demo venue the fan app ships.
import type { OrderLine, RunnerOrder, Seat, Stand } from '../types'

// Concession stands a runner picks up from (subset of the fan app's vendor pool).
export const STANDS: Stand[] = [
  { name: 'The Brooklyn Grill', loc: 'Concourse A · Sec 110' },
  { name: 'Empire Eats', loc: 'Main Hall · Sec 118' },
  { name: 'Liberty Bites', loc: 'Concourse C · Sec 232' },
  { name: 'Hudson Coffee Co.', loc: 'Atrium · Sec 101' },
  { name: 'Five Boroughs Tap', loc: 'Mezzanine · Sec 220' },
  { name: 'The Official Store', loc: 'Main Hall · Sec 115' },
]

// Item pool: name + the options/add-ons a fan might have chosen.
const ITEM_POOL: OrderLine[] = [
  { name: 'Buffalo Wings', qty: 1, option: 'Classic Buffalo', addons: ['Extra Sauce'] },
  { name: 'Stadium Cheeseburger', qty: 1, option: 'Medium-Well', addons: ['Add Bacon'] },
  { name: 'Loaded Nachos', qty: 1, option: 'Pulled Pork', addons: [] },
  { name: 'Classic Hot Dog', qty: 2, option: 'Chicago', addons: [] },
  { name: 'Jumbo Soft Pretzel', qty: 1, option: null, addons: ['Extra Beer Cheese'] },
  { name: 'Garlic Parm Fries', qty: 1, option: null, addons: [] },
  { name: 'Draft Beer', qty: 2, option: 'Narragansett Lager', addons: [] },
  { name: 'Frozen Margarita', qty: 1, option: 'Strawberry', addons: [] },
  { name: 'Fountain Soda', qty: 1, option: 'Cola', addons: [] },
  { name: 'Bottled Water', qty: 2, option: null, addons: [] },
  { name: 'Kettle Popcorn', qty: 1, option: null, addons: [] },
  { name: 'Game Day Tee', qty: 1, option: 'L', addons: [] },
]

const SECTIONS = ['112', '118', '124', '204', '208', '232']
const ROWS = ['A', 'C', 'F', 'J', 'M', 'R']
const NAMES = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Jamie']

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

function randomSeat(): Seat {
  return {
    section: pick(SECTIONS),
    row: pick(ROWS),
    seat: String(1 + Math.floor(Math.random() * 28)),
  }
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
    seat: randomSeat(),
    stand: pick(STANDS),
    lines: randomLines(),
    placedAt: Date.now() - ageSec * 1000,
    stage: 1, // being prepared — ready for a runner to claim
    runnerId: null,
    runnerName: null,
  }
}

/** Seed the queue with a spread of ages so urgency colors read on first paint. */
export function seedOrders(): RunnerOrder[] {
  return [320, 215, 140, 70, 25].map((age) => makeOrder(age))
}
