import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Bookshelf } from '../components/Bookshelf'
import { BookSpotlight } from '../components/BookSpotlight'
import { Eyebrow } from '../components/Eyebrow'
import { useLibrary } from '../library/useLibrary'
import type { LibraryItem } from '../lib/library'

/** A collapsible search affordance — a big magnifier that opens into a field
 *  and hands off to the full search page (the one place search now lives here). */
function SearchBox() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const go = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search')
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Search for a book"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-accent transition-colors hover:border-accent/50"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
      </button>
    )
  }

  return (
    <form onSubmit={go} className="flex min-w-0 items-center gap-1.5">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onBlur={() => !q && setOpen(false)}
        placeholder="Search for a book…"
        className="min-w-0 flex-1 rounded-full border border-border bg-surface-alt px-4 py-2 text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-contrast"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
      </button>
    </form>
  )
}

/**
 * Your Library — your books as an actual bookshelf (To Read · Read · Favorites),
 * inspired by Goodreads/Fable lists but shown as a shelf you browse. Search lives
 * here now (the collapsible magnifier, top-right). Tap a spine to bring its cover
 * forward; tap the cover for the book's page.
 */
export function Library() {
  const { items, loading } = useLibrary()
  const [selected, setSelected] = useState<LibraryItem | null>(null)

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>Your shelves</Eyebrow>
          <h1 className="mt-1 font-display text-4xl text-text">Your Library</h1>
        </div>
        <SearchBox />
      </div>

      <section className="mt-6">
        {loading ? (
          <p className="py-16 text-center text-sm text-text-muted">Pulling your books…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
            <p className="font-display text-2xl text-text">An empty bookcase</p>
            <p className="mx-auto mt-2 max-w-sm text-pretty leading-relaxed text-text-muted">
              Find a book and add it to a shelf — To Read, Read, or Favorites —
              and it'll take its place here.
            </p>
            <Link
              to="/search"
              className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-accent"
            >
              Find a book ›
            </Link>
          </div>
        ) : (
          <Bookshelf items={items} onSelect={setSelected} />
        )}
      </section>

      {selected && <BookSpotlight item={selected} onClose={() => setSelected(null)} />}
    </AppShell>
  )
}
