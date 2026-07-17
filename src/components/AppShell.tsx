import { useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { PullToRefresh } from './PullToRefresh'

/**
 * The frame every signed-in screen sits inside: the screen body and a touch-first
 * bottom tab bar (Home · Library · + · Activity · You). There's no top chrome
 * anymore — the wordmark lives in the Home hero now — so the body runs to the top
 * (clearing the status bar via the safe-area inset). Width is capped by the
 * surrounding DeviceFrame; this just fills it, nudging padding up on iPad.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <div className="flex flex-1 flex-col">
      <main
        key={location.pathname}
        className="view-enter flex-1 overflow-x-clip px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1.25rem)] ipad:px-8 ipad:pb-10 ipad:pt-[calc(env(safe-area-inset-top)+1.75rem)]"
      >
        <PullToRefresh>{children}</PullToRefresh>
      </main>

      <BottomNav />
    </div>
  )
}
