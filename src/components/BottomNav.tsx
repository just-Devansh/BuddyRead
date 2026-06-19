import { NavLink } from 'react-router-dom'
import { useFriends } from '../friends/useFriends'

type Tab = {
  to: string
  label: string
  icon: React.ReactNode
}

const iconProps = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
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
    to: '/friends',
    label: 'Friends',
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 13.6A5.5 5.5 0 0 1 20.5 18.5" />
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

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border bg-bg/90 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                [
                  'relative flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                  isActive ? 'text-accent' : 'text-text-muted hover:text-text',
                ].join(' ')
              }
            >
              <span className="relative">
                {tab.icon}
                {tab.to === '/friends' && incoming.length > 0 && (
                  <span
                    className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-semibold leading-4 text-accent-contrast"
                    aria-label={`${incoming.length} pending request${incoming.length > 1 ? 's' : ''}`}
                  >
                    {incoming.length}
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
