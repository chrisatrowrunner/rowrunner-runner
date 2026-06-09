// Active.tsx — Screen 3: the one order this runner owns. Replaces the queue
// until it's delivered (one active order at a time in the MVP). Seat front and
// center, full item list, where to pick up, and a single delivered action.
import { useState } from 'react'
import { useStore, ageLabel } from '../store/store'
import { Icon } from '../components/Icon'
import { AppHeader, CTA, BottomDock } from '../components/ui'

export function ActiveScreen() {
  const s = useStore()
  const o = s.activeOrder
  const [code, setCode] = useState('')
  if (!o) return null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--offwhite)' }}>
      <AppHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Your active order</div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Order #{o.orderNo}</h1>
          </div>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 800,
              color: 'var(--ice)',
              background: 'rgba(91,184,212,.16)',
              padding: '6px 11px',
              borderRadius: 999,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Icon name="clock" size={13} sw={2.4} /> {ageLabel(o.placedAt, s.now)}
          </span>
        </div>
      </AppHeader>

      <div className="rr-scroll" style={{ flex: 1, overflow: 'auto', padding: '16px 16px 24px' }}>
        {/* seat — front and center */}
        <div style={{ background: 'var(--navy)', borderRadius: 'var(--r-card)', padding: '22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: '50%', border: '1.5px solid rgba(91,184,212,.16)' }} />
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>
            Deliver to
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.6, marginTop: 4, lineHeight: 1.05 }}>
            Sec {o.seat.section}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ice)', marginTop: 2 }}>
            Row {o.seat.row} · Seat {o.seat.seat}
          </div>
          {o.customerName && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 14, fontWeight: 700, background: 'rgba(255,255,255,.10)', padding: '7px 12px', borderRadius: 999 }}>
              👤 For {o.customerName}
            </div>
          )}
        </div>

        {/* special instructions / dietary notes */}
        {o.notes && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              background: 'rgba(245,158,11,.10)',
              border: '1.5px solid rgba(245,158,11,.35)',
              borderRadius: 18,
              padding: '14px 16px',
              marginTop: 12,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1.1 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.4, color: '#B45309', textTransform: 'uppercase' }}>
                Special instructions
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginTop: 2, lineHeight: 1.35 }}>
                {o.notes}
              </div>
            </div>
          </div>
        )}

        {/* pickup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 18, padding: '14px 16px', marginTop: 12, boxShadow: 'var(--shadow-card)' }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(91,184,212,.16)', color: 'var(--ice-deep)' }}>
            <Icon name="bag" size={20} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.4, color: 'var(--faint)', textTransform: 'uppercase' }}>Pick up from</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{o.stand.name}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{o.stand.loc}</div>
          </div>
        </div>

        {/* items */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '6px 18px 8px', marginTop: 12, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--faint)', letterSpacing: 0.4, padding: '14px 0 4px' }}>
            ITEMS TO GRAB
          </div>
          {o.lines.map((l, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--line)',
              }}
            >
              <span
                style={{
                  minWidth: 30,
                  height: 30,
                  padding: '0 8px',
                  borderRadius: 9,
                  flex: '0 0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--navy)',
                  color: '#fff',
                  fontSize: 14.5,
                  fontWeight: 800,
                }}
              >
                {l.qty}×
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{l.name}</div>
                {(l.option || l.addons.length > 0) && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginTop: 1 }}>
                    {[l.option, ...l.addons].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomDock>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textAlign: 'center' }}>
          Ask {o.customerName || 'the guest'} for their 6-digit code
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          placeholder="• • • • • •"
          style={{
            width: '100%',
            height: 56,
            textAlign: 'center',
            letterSpacing: 8,
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--navy)',
            background: 'var(--offwhite)',
            border: '1.5px solid var(--line)',
            borderRadius: 14,
            outline: 'none',
            marginBottom: 10,
          }}
        />
        <CTA
          label="Confirm delivery"
          icon="check"
          disabled={code.length !== 6}
          onClick={() => s.deliver(code)}
        />
      </BottomDock>
    </div>
  )
}
