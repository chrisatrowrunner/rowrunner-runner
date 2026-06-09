// History.tsx — past (delivered) orders, most recent first.
import { useStore } from '../store/store'
import type { RunnerOrder } from '../types'
import { Icon } from '../components/Icon'
import { AppHeader, RoundBtn, Tag } from '../components/ui'

function summarize(o: RunnerOrder): string {
  return o.lines.map((l) => (l.qty > 1 ? `${l.qty}× ${l.name}` : l.name)).join(' · ')
}

function HistoryCard({ o }: { o: RunnerOrder }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 'var(--r-card)',
        padding: '14px 16px',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--line)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.5, color: 'var(--faint)', textTransform: 'uppercase' }}>
            #{o.orderNo} · Sec {o.seat.section}
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', letterSpacing: -0.3, lineHeight: 1.15 }}>
            Row {o.seat.row} · Seat {o.seat.seat}
          </div>
        </div>
        <Tag tone="green">Delivered</Tag>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--muted)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {summarize(o)}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--faint)' }}>
        {o.customerName && <span>👤 {o.customerName}</span>}
        {o.runnerName && <span>🏃 {o.runnerName}</span>}
      </div>
    </div>
  )
}

export function HistoryScreen() {
  const s = useStore()
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--offwhite)' }}>
      <AppHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RoundBtn icon="back" label="Back to queue" light onClick={s.closeHistory} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Completed</div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Past orders</h1>
          </div>
        </div>
      </AppHeader>

      <div className="rr-scroll" style={{ flex: 1, overflow: 'auto', padding: '16px 16px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {s.history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--muted)' }}>
            <div style={{ color: 'var(--faint)', display: 'flex', justifyContent: 'center' }}>
              <Icon name="clock" size={40} sw={1.6} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginTop: 10 }}>No deliveries yet</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Delivered orders will show up here.</div>
          </div>
        ) : (
          s.history.map((o) => <HistoryCard key={o.id} o={o} />)
        )}
      </div>
    </div>
  )
}
