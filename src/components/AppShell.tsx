import { Link, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import { BottomNav } from './BottomNav'
import { PullToRefresh } from './PullToRefresh'

/**
 * The frame every signed-in screen sits inside: a hairline sticky header with
 * the wordmark, the screen body, and a touch-first bottom tab bar (Home ·
 * Library · Activity · You). Width is capped by the surrounding DeviceFrame; this just
 * fills it, nudging padding up a touch on iPad.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border-soft bg-bg/80 backdrop-blur">
        <div className="flex items-center justify-between px-5 py-3 ipad:px-8">
          <Link
            to="/home"
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Logo />
          </Link>
        </div>
      </header>

      <main
        key={location.pathname}
        className="view-enter flex-1 overflow-x-clip px-5 py-8 ipad:px-8 ipad:py-10"
      >
        <PullToRefresh>{children}</PullToRefresh>
      </main>

      <BottomNav />
    </div>
  )
}
