import { Link, NavLink, useLocation } from 'react-router-dom'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'
import { tapHaptic } from '../lib/haptics'

type Tab = {
  to: string
  label: string
  icon: React.ReactNode
}

const iconProps = {
  viewBox: '0 0 24 24',
  width: 21,
  height: 21,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const TABS: Tab[] = [
  {
    to: '/home',
    label: 'Home',
    // An actual house — pitched roof over a body, with a doorway.
    icon: (
      <svg {...iconProps}>
        <path d="M3.5 11.2 12 4l8.5 7.2" />
        <path d="M5.3 9.7V19a1 1 0 0 0 1 1H17.7a1 1 0 0 0 1-1V9.7" />
        <path d="M9.6 20v-5.2a1 1 0 0 1 1-1h2.8a1 1 0 0 1 1 1V20" />
      </svg>
    ),
  },
  {
    to: '/library',
    label: 'Library',
    // A cosy stack of books — three volumes resting on a shelf line.
    icon: (
      <svg {...iconProps}>
        <rect x="4.5" y="5" width="11.5" height="3.4" rx="0.8" />
        <rect x="4.5" y="8.4" width="14" height="3.4" rx="0.8" />
        <rect x="4.5" y="11.8" width="9.5" height="3.4" rx="0.8" />
        <path d="M3.5 18.6h17" />
      </svg>
    ),
  },
  {
    to: '/activity',
    label: 'Activity',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 1.8" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'You',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const { incoming } = useFriends()
  const { incoming: incomingReads } = useReads()
  const { pathname } = useLocation()

  const badgeFor = (to: string): number => {
    // Friends no longer has its own tab; its requests surface in Activity too.
    if (to === '/activity') return incoming.length + incomingReads.length
    return 0
  }

  const renderTab = (tab: Tab) => (
    <li key={tab.to} className="flex-1">
      <NavLink
        to={tab.to}
        onClick={tapHaptic}
        className={({ isActive }) =>
          [
            'group flex flex-col items-center gap-1 py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors',
            isActive ? 'text-accent' : 'text-text-muted hover:text-text',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            {/* The active tab is marked two ways: the accent colour and a soft
                accent-tinted pill cradling the icon. */}
            <span
              className={[
                'flex h-8 items-center justify-center rounded-xl px-4 transition-all duration-300',
                isActive
                  ? 'bg-accent/12 ring-1 ring-inset ring-accent/15'
                  : 'bg-transparent group-active:bg-accent/5',
              ].join(' ')}
            >
              <span className="relative">
                {tab.icon}
                {badgeFor(tab.to) > 0 && (
                  <span
                    className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center font-mono text-[10px] font-semibold leading-4 text-accent-contrast"
                    aria-label={`${badgeFor(tab.to)} pending`}
                  >
                    {badgeFor(tab.to)}
                  </span>
                )}
              </span>
            </span>
            {tab.label}
          </>
        )}
      </NavLink>
    </li>
  )

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border-soft bg-bg/90 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.slice(0, 2).map(renderTab)}

        {/* The add-a-book action, docked dead-centre and raised above the bar. */}
        <li className="flex flex-1 justify-center">
          <Link
            to="/search"
            state={{ from: pathname }}
            onClick={tapHaptic}
            aria-label="Add a book"
            title="Add a book"
            className="relative -top-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-[0_12px_26px_-8px_rgba(0,0,0,0.55)] ring-4 ring-bg outline-none transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </li>

        {TABS.slice(2).map(renderTab)}
      </ul>
    </nav>
  )
}
