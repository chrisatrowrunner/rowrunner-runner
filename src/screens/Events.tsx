// Events.tsx — Screen 2: after sign-in the runner picks which game they're
// working. For the pilot there's one event (URI vs La Salle); the list is
// data-driven so more games just appear here.
import { useStore } from '../store/store'
import { Icon } from '../components/Icon'
import type { RunnerEvent } from '../data/events'

function EventCard({ ev, onPick }: { ev: RunnerEvent; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'rgba(255,255,255,.06)',
        border: '1px solid rgba(255,255,255,.14)',
        borderRadius: 18,
        padding: '18px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        color: '#fff',
        transition: 'transform .12s, background .2s',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(.985)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: 'var(--ice)',
            background: 'rgba(91,184,212,.16)',
            padding: '4px 9px',
            borderRadius: 999,
            marginBottom: 10,
          }}
        >
          {ev.sport}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.15 }}>
          {ev.home} <span style={{ color: 'rgba(255,255,255,.45)' }}>vs</span> {ev.away}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.65)' }}>
          <Icon name="pin" size={14} sw={2.2} /> {ev.venue}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ice)', marginTop: 4 }}>{ev.startsAt}</div>
      </div>
      <span
        style={{
          width: 40,
          height: 40,
          flex: '0 0 auto',
          borderRadius: '50%',
          background: 'var(--ice)',
          color: 'var(--navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="arrowR" size={20} sw={2.6} />
      </span>
    </button>
  )
}

export function EventsScreen() {
  const s = useStore()
  const first = s.session?.name?.split(' ')[0] ?? 'Runner'
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(120% 60% at 50% 0%, #0E3F5E, #072E48 70%)',
        color: '#fff',
      }}
    >
      <div
        className="rr-scroll"
        style={{ flex: 1, overflow: 'auto', padding: '0 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <img
          src="/assets/logo-lockup-white.png"
          alt="RowRunner"
          style={{ height: 34, objectFit: 'contain', alignSelf: 'flex-start', marginBottom: 10 }}
        />
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.4 }}>
          Hi {first} 👋
        </h1>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ice)', marginTop: 6, marginBottom: 24 }}>
          Which event are you running?
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {s.events.map((ev) => (
            <EventCard key={ev.id} ev={ev} onPick={() => s.selectEvent(ev)} />
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 24px max(30px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={s.logout}
          style={{ width: '100%', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.6)', padding: 8 }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
