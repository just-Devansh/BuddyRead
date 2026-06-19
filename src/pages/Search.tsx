import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BookCover } from '../components/BookCover'
import { authorLine, searchBooks, type Book } from '../lib/books'

type Status = 'idle' | 'searching' | 'done' | 'error'

/**
 * Find a book to read. A debounced search over Google Books; each result links
 * to its detail page. This is the doorway from the empty Shelf into M4's reads.
 */
export function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Book[]>([])
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    const q = query.trim()
    const ctrl = new AbortController()

    // Everything runs inside the debounce timer (a callback, not the effect
    // body) so a few keystrokes don't fire a search — or a cascade of renders.
    const timer = setTimeout(() => {
      if (q.length < 2) {
        setResults([])
        setStatus('idle')
        return
      }
      setStatus('searching')
      searchBooks(q, ctrl.signal)
        .then((books) => {
          setResults(books)
          setStatus('done')
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setStatus('error')
        })
    }, 350)

    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [query])

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-text">Find a book</h1>
      <p className="mt-1 text-text-muted">
        Search by title, author, or ISBN — then start a read.
      </p>

      <div className="mt-6">
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="The Secret History…"
          autoCorrect="off"
          className="w-full rounded-xl border border-border bg-surface-alt px-4 py-3 text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {status === 'searching' && (
        <p className="mt-8 text-center text-sm text-text-muted">Looking…</p>
      )}

      {status === 'error' && (
        <p className="mt-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          That search didn't go through. Try again in a moment?
        </p>
      )}

      {status === 'done' && results.length === 0 && (
        <p className="mt-8 text-center text-sm text-text-muted">
          Nothing under that. Mind the spelling, or try another title?
        </p>
      )}

      {status === 'idle' && (
        <p className="mt-10 text-center text-pretty text-sm leading-relaxed text-text-muted">
          A few letters of a title or an author's name is enough to start.
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-6 divide-y divide-border">
          {results.map((book) => (
            <li key={book.id}>
              <Link
                to={`/book/${book.id}`}
                className="flex items-center gap-4 rounded-lg py-3 transition-colors hover:bg-surface/60"
              >
                <BookCover book={book} className="w-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{book.title}</p>
                  <p className="truncate text-sm text-text-muted">
                    {authorLine(book.authors)}
                    {book.year ? ` · ${book.year}` : ''}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
