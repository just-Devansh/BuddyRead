import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../theme/ThemeToggle'

/**
 * The signed-out landing. Quietly handsome on purpose — it sets the tone before
 * anyone reads a word. In M1 the CTA becomes Google sign-in; for now it walks
 * into the (stub) app so the skeleton is navigable. Lives inside the DeviceFrame,
 * so it fills a phone or the centred iPad column.
 */
export function Welcome() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 py-3 ipad:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="mb-5 text-sm uppercase tracking-[0.2em] text-text-muted">
          A reading ritual for two
        </p>
        <h1 className="font-display text-4xl leading-tight text-text ipad:text-5xl">
          Read the same book,
          <br />
          <span className="text-accent">across the distance.</span>
        </h1>
        <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-text-muted">
          No streaks, no leaderboards, no one racing ahead. Just you, a friend,
          and a book — and a quiet card that keeps you company.
        </p>

        <Link
          to="/home"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-accent px-7 py-3 font-medium text-accent-contrast transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Begin
        </Link>
        <p className="mt-4 text-xs text-text-muted">
          Sign-in arrives next. For now, have a look around.
        </p>
      </main>

      <footer className="px-5 py-6 text-center text-xs text-text-muted">
        Made for two readers, one in Gurgaon and one in Hyderabad.
      </footer>
    </div>
  )
}
