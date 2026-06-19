import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { Avatar } from './Avatar'
import { useAuth } from '../auth/useAuth'

/**
 * The frame every signed-in screen sits inside: a hairline sticky header with
 * the wordmark + a profile avatar (the theme toggle lives on the Profile page).
 * Width is capped by the surrounding DeviceFrame; this just fills it with room
 * to breathe, nudging padding up a touch on iPad.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userDoc } = useAuth()

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
        <div className="flex items-center justify-between px-5 py-3 ipad:px-8">
          <Link
            to="/home"
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Logo />
          </Link>
          <Link
            to="/profile"
            aria-label="Profile"
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Avatar
              src={user?.photoURL}
              name={userDoc?.displayName ?? user?.displayName}
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 ipad:px-8 ipad:py-10">{children}</main>
    </div>
  )
}
