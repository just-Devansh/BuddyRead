import { NavLink } from 'react-router-dom'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'

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
    label: 'Shelf',
    icon: (
      <svg {...iconProps}>
        <path d="M4 5.5C4 4.7 4.7 4 5.5 4H10v16H5.5C4.7 20 4 19.3 4 18.5z" />
        <path d="M20 5.5C20 4.7 19.3 4 18.5 4H14v16h4.5c.8 0 1.5-.7 1.5-1.5z" />
      </svg>
    ),
  },
  {
    to: '/library',
    label: 'Library',
    icon: (
      <svg {...iconProps}>
        <path d="M5 4.5h3.2v14H5z" />
        <path d="M10.2 4.5h3.2v14h-3.2z" />
        <path d="M15.6 5.4l3 .7-2.9 13-3-.7z" />
        <path d="M3.5 19.2h17" />
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

  const badgeFor = (to: string): number => {
    // Friends no longer has its own tab; its requests surface in Activity too.
    if (to === '/activity') return incoming.length + incomingReads.length
    return 0
  }

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border-soft bg-bg/90 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                [
                  'relative flex flex-col items-center gap-1.5 py-2.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors',
                  isActive ? 'text-accent' : 'text-text-muted hover:text-text',
                ].join(' ')
              }
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
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
