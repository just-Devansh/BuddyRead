import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { ThemeToggle } from '../theme/ThemeToggle'

/**
 * The frame every signed-in screen sits inside: a hairline sticky header with
 * the wordmark + theme toggle, then the screen body. Width is capped by the
 * surrounding DeviceFrame (phone = full width, iPad = centred column), so this
 * just fills it and adds breathing room. Padding steps up a touch on iPad.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
        <div className="flex items-center justify-between px-5 py-3 ipad:px-8">
          <Link
            to="/"
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 px-5 py-8 ipad:px-8 ipad:py-10">{children}</main>
    </div>
  )
}
