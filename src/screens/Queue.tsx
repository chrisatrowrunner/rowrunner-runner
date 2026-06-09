// Queue.tsx — Screen 2: the live feed of unclaimed orders, oldest-first.
// This is where runners live. New orders stream in via the realtime feed;
// orders that have waited too long warm from ice → amber → red.
import { useStore, ageLabel, urgency } from '../store/store'
import type { RunnerOrder } from '../types'
import { Icon } from '../components/Icon'
import { AppHeader, RoundBtn, Tag } from '../components/ui'

/** "2× Hot Dog · Draft Beer" — a glanceable line summary. */
function summarize(o: RunnerOrder): string {
  return o.lines.map((l) => (l.qty > 1 ? `${l.qty}× ${l.name}` : l.name)).join(' · ')
}
function itemCount(o: RunnerOrder): number {
  return o.lines.reduce((n, l) => n + l.qty, 0)
}

const URGENCY = {
  fresh: { bg: 'rgba(91,184,212,.16)', c: 'var(--ice-deep)', icon: 'rgba(91,184,212,.16)' },
  warn: { bg: 'rgba(245,158,11,.16)', c: '#B45309' },
  late: { bg: 'rgba(239,68,68,.14)', c: '#B91C1C' },
} as const

function OrderCard({ o }: { o: RunnerOrder }) {
  const s = useStore()
  const u = urgency(o.placedAt, s.now)
  const tone = URGENCY[u]
  const n = itemCount(o)
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 'var(--r-card)',
        padding: '16px 16px 14px',
        boxShadow: 'var(--shadow-card)',
        border: u === 'late' ? '1.5px solid rgba(239,68,68,.4)' : '1px solid var(--line)',
        animation: 'rr-rise .25s ease both',
      }}
    >
      {/* top row: seat (big) + live age */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, color: 'var(--faint)', textTransform: 'uppercase' }}>
            Section {o.seat.section}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)', letterSpacing: -0.5, lineHeight: 1.1 }}>
            Row {o.seat.row} · Seat {o.seat.seat}
          </div>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 13,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            padding: '6px 10px',
            borderRadius: 999,
            background: tone.bg,
            color: tone.c,
            flex: '0 0 auto',
          }}
        >
          <Icon name="clock" size={13} sw={2.4} /> {ageLabel(o.placedAt, s.now)}
        </span>
      </div>

      {/* items + pickup */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <Tag tone="navy">{n} item{n !== 1 ? 's' : ''}</Tag>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {summarize(o)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--faint)', fontSize: 13, fontWeight: 700 }}>
        <Icon name="bag" size={14} sw={2.2} /> Pick up · {o.stand.name}
      </div>
      {o.customerName && (
        <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>
          👤 For {o.customerName}
        </div>
      )}

      {/* claim */}
      <button
        onClick={() => s.claim(o.id)}
        style={{
          width: '100%',
          height: 48,
          marginTop: 14,
          borderRadius: 14,
          background: 'var(--navy)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'transform .12s',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(.975)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Claim order <Icon name="arrowR" size={18} sw={2.6} />
      </button>
    </div>
  )
}

export function QueueScreen() {
  const s = useStore()
  const first = s.session?.name?.split(' ')[0] ?? 'Runner'
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--offwhite)' }}>
      <AppHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Hi {first} 👋</div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Available orders</h1>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 800,
              color: 'var(--ice)',
              background: 'rgba(91,184,212,.16)',
              padding: '6px 11px',
              borderRadius: 999,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ice)', animation: 'rr-pulse 1.6s infinite' }} /> LIVE
          </span>
          <RoundBtn icon="clock" label="Past orders" light onClick={s.openHistory} />
          <RoundBtn icon="x" label="Sign out" light onClick={s.logout} />
        </div>
      </AppHeader>

      <div className="rr-scroll" style={{ flex: 1, overflow: 'auto', padding: '16px 16px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {s.queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40 }}>🎉</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginTop: 8 }}>Queue is clear</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>New orders will appear here automatically.</div>
          </div>
        ) : (
          s.queue.map((o) => <OrderCard key={o.id} o={o} />)
        )}
      </div>
    </div>
  )
}
