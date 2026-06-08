// store.tsx — runner app state: session, routing, the live order feed, and the
// claim → deliver actions. One context so screens read a small `useStore()`
// surface instead of prop-drilling (same pattern as the fan app's store).
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { RunnerOrder, RunnerSession, Screen } from '../types'
import { createOrdersApi } from '../lib/orders'
import { restore, signIn, signOut } from '../lib/auth'

export interface Store {
  // session
  session: RunnerSession | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  // routing
  screen: Screen
  // live data
  queue: RunnerOrder[] // unclaimed, oldest-first
  activeOrder: RunnerOrder | null // the one order this runner owns
  justDelivered: RunnerOrder | null // snapshot for the success screen
  /** ms-precision clock that ticks every second, for live age timers */
  now: number
  // actions
  claim: (orderId: string) => Promise<void>
  deliver: () => Promise<void>
  // chrome
  toast: (msg: string) => void
  toastMsg: string | null
}

const StoreContext = createContext<Store | null>(null)

// One API instance for the app's lifetime (mock today, Supabase when wired).
const api = createOrdersApi()

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<RunnerSession | null>(null)
  const [screen, setScreen] = useState<Screen>('login')
  const [orders, setOrders] = useState<RunnerOrder[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [justDelivered, setJustDelivered] = useState<RunnerOrder | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const redirectT = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── restore a persisted session on load ──
  useEffect(() => {
    restore().then((s) => {
      if (s) {
        setSession(s)
        setScreen('queue')
      }
    })
  }, [])

  // ── live order feed ──
  // Subscribe only once authenticated. Supabase RLS (staff-only reads) and
  // Realtime both key off the connection's role, so subscribing before login
  // would bind the channel to the anon role — which can see nothing — and no
  // orders would ever arrive. Re-subscribing when the session appears fixes it.
  //
  // Realtime is the fast path, but its delivery under RLS can be unreliable, so
  // we ALSO poll every few seconds as a guaranteed fallback. Both just replace
  // the full active set, so they're safe to run together.
  useEffect(() => {
    if (!session) {
      setOrders([])
      return
    }
    const unsubscribe = api.subscribe(setOrders)
    const poll = setInterval(() => {
      api.listActive().then(setOrders).catch(() => {})
    }, 4000)
    return () => {
      unsubscribe()
      clearInterval(poll)
    }
  }, [session])

  // ── 1s clock for age timers ──
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // The order this runner currently owns (stage 2–3, not yet delivered).
  const activeOrder = useMemo(
    () => orders.find((o) => o.id === activeId && o.stage < 4) ?? null,
    [orders, activeId],
  )

  // Queue = unclaimed and not yet picked up. Hidden while this runner is busy.
  const queue = useMemo(
    () => orders.filter((o) => !o.runnerId && o.stage < 2),
    [orders],
  )

  const toast = (msg: string) => {
    setToastMsg(msg)
    if (toastT.current) clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToastMsg(null), 1900)
  }

  const login = async (email: string, password: string) => {
    const s = await signIn(email, password)
    setSession(s)
    setScreen('queue')
  }

  const logout = () => {
    void signOut()
    setSession(null)
    setActiveId(null)
    setScreen('login')
  }

  const claim = async (orderId: string) => {
    if (!session) return
    if (activeOrder) {
      toast('Finish your current delivery first')
      return
    }
    try {
      await api.claim(orderId, session)
      setActiveId(orderId)
      setScreen('active')
    } catch (e) {
      // e.g. another runner claimed it first
      toast(e instanceof Error ? e.message : 'Could not claim that order')
    }
  }

  const deliver = async () => {
    if (!activeOrder) return
    const delivered = await api.deliver(activeOrder.id)
    setJustDelivered(delivered)
    setActiveId(null)
    setScreen('delivered')
    // Bounce back to the queue automatically — no manual nav for the runner.
    if (redirectT.current) clearTimeout(redirectT.current)
    redirectT.current = setTimeout(() => {
      setJustDelivered(null)
      setScreen('queue')
    }, 2600)
  }

  const value: Store = {
    session,
    login,
    logout,
    screen,
    queue,
    activeOrder,
    justDelivered,
    now,
    claim,
    deliver,
    toast,
    toastMsg,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within <StoreProvider>')
  return ctx
}

// ── live age helpers ─────────────────────────────────────────
/** "3:05" style elapsed time since the order was placed. */
export function ageLabel(placedAt: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - placedAt) / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export type Urgency = 'fresh' | 'warn' | 'late'
/** Color tier by how long the order has waited. */
export function urgency(placedAt: number, now: number): Urgency {
  const sec = (now - placedAt) / 1000
  if (sec >= 240) return 'late'
  if (sec >= 120) return 'warn'
  return 'fresh'
}
