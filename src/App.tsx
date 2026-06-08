// App.tsx — RowRunner runner dispatch: routing shell + toast.
import { StoreProvider, useStore } from './store/store'
import { Icon } from './components/Icon'
import { LoginScreen } from './screens/Login'
import { QueueScreen } from './screens/Queue'
import { ActiveScreen } from './screens/Active'
import { DeliveredScreen } from './screens/Delivered'

function Router() {
  const s = useStore()
  switch (s.screen) {
    case 'login':
      return <LoginScreen />
    case 'queue':
      return <QueueScreen />
    case 'active':
      // activeOrder is set before navigating here; fall back to the queue.
      return s.activeOrder ? <ActiveScreen /> : <QueueScreen />
    case 'delivered':
      return <DeliveredScreen />
    default:
      return <LoginScreen />
  }
}

function Toast() {
  const { toastMsg } = useStore()
  if (!toastMsg) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 96,
        zIndex: 80,
        background: 'rgba(7,46,72,.96)',
        color: '#fff',
        borderRadius: 14,
        padding: '13px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14.5,
        fontWeight: 700,
        boxShadow: '0 12px 30px rgba(0,0,0,.3)',
        animation: 'rr-rise .25s ease both',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'var(--ice)',
          color: 'var(--navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto',
        }}
      >
        <Icon name="info" size={14} sw={3} />
      </span>
      {toastMsg}
    </div>
  )
}

function Shell() {
  const { screen } = useStore()
  return (
    <div className="rr-app">
      {/* keyed so each screen replays its entrance animation */}
      <div key={screen} style={{ height: '100%', animation: 'rr-rise .3s ease both' }}>
        <Router />
      </div>
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
