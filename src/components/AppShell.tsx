import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { ThemeToggle } from '../theme/ThemeToggle'

/**
 * The frame every signed-in screen sits inside: a hairline header with the
 * wordmark + theme toggle, a centred reading-width column, and room to breathe.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <Link to="/" className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        {children}
      </main>
    </div>
  )
}
