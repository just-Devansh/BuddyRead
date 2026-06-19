import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'

/**
 * The signed-in home. The shelf is still empty until M4 wires up reads, but
 * "Find a book" now opens the catalog. M4/M5 fill this with active reads and
 * the split progress card.
 */
export function Home() {
  return (
    <AppShell>
      <section>
        <h1 className="font-display text-3xl text-text">Your shelf</h1>
        <p className="mt-1 text-text-muted">Where current reads will live.</p>
      </section>

      <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
        <p className="font-display text-xl text-text">Nothing on the go yet</p>
        <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-text-muted">
          When you start a read — alone or with a buddy — it'll settle in here,
          spine out, waiting for you.
        </p>
        <Link
          to="/search"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          Find a book
        </Link>
      </div>
    </AppShell>
  )
}
