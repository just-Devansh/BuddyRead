import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Eyebrow } from '../components/Eyebrow'

/**
 * The signed-in home. Empty until M4 wires up reads; "Find a book" opens the
 * catalog. M4 fills this with active reads and the split progress card.
 */
export function Home() {
  return (
    <AppShell>
      <section>
        <Eyebrow>Reading together</Eyebrow>
        <h1 className="mt-1 font-display text-4xl text-text">Your shelf</h1>
      </section>

      <section className="mt-8 rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
        <p className="font-display text-2xl text-text">Nothing on the go yet</p>
        <p className="mx-auto mt-2 max-w-sm text-pretty leading-relaxed text-text-muted">
          When you start a read — alone or with a buddy — it'll settle in here,
          spine out, waiting for you.
        </p>
        <Link
          to="/search"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          Find a book
        </Link>
      </section>
    </AppShell>
  )
}
