import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Bookshelf } from '../components/Bookshelf'
import { Eyebrow } from '../components/Eyebrow'
import { useLibrary } from '../library/useLibrary'

/** The search affordance — a big magnifier that opens the full search page
 *  straight away (same as the Shelf's "Find a book"; no in-place typing). */
function SearchButton() {
  return (
    <Link
      to="/search"
      aria-label="Search for a book"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-[0_8px_18px_-8px_rgba(138,69,54,0.85)] transition-opacity hover:opacity-90"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
      </svg>
    </Link>
  )
}

/**
 * Your Library — your books as an actual bookshelf (To Read · Read · Favorites),
 * inspired by Goodreads/Fable lists but shown as a shelf you browse: real covers
 * standing on wooden ledges. Search lives here now (the magnifier, top-right, →
 * the full search page). Tap a book for its page.
 */
export function Library() {
  const { items, loading } = useLibrary()

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>Your shelves</Eyebrow>
          <h1 className="mt-1 font-display text-4xl text-text">Your Library</h1>
        </div>
        <SearchButton />
      </div>

      <section className="mt-6">
        {loading ? (
          <p className="py-16 text-center text-sm text-text-muted">Pulling your books…</p>
        ) : (
          <Bookshelf items={items} />
        )}
      </section>
    </AppShell>
  )
}
