// Delivered.tsx — Screen 4: brief success state. Auto-bounces back to the queue
// (the store sets a timer) so the runner never has to navigate manually.
import { useStore } from '../store/store'
import { Icon } from '../components/Icon'

export function DeliveredScreen() {
  const s = useStore()
  const o = s.justDelivered
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        background: 'radial-gradient(120% 60% at 50% 0%, #0E3F5E, #072E48 70%)',
        color: '#fff',
        padding: '0 28px',
      }}
    >
      <div style={{ position: 'relative', width: 104, height: 104 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(91,184,212,.18)', animation: 'rr-pop .5s ease both' }} />
        <div
          style={{
            position: 'absolute',
            inset: 16,
            borderRadius: '50%',
            background: 'var(--ice)',
            color: 'var(--navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 34px rgba(91,184,212,.55)',
            animation: 'rr-pop .5s .1s ease both',
          }}
        >
          <Icon name="check" size={46} sw={3.4} />
        </div>
      </div>
      <h1 style={{ margin: '20px 0 0', fontSize: 28, fontWeight: 800, textAlign: 'center' }}>Order delivered</h1>
      {o && (
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ice)', marginTop: 8, textAlign: 'center' }}>
          Sec {o.seat.section} · Row {o.seat.row} · Seat {o.seat.seat}
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.55)', marginTop: 18 }}>
        Back to the queue…
      </div>
    </div>
  )
}
