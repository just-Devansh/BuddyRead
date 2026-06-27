import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BookCover } from '../components/BookCover'
import { Eyebrow } from '../components/Eyebrow'
import { authorLine, searchBooks, type Book } from '../lib/books'

type Status = 'idle' | 'searching' | 'done' | 'error'

/**
 * Find a book to read. A debounced search over Google Books; each result links
 * to its detail page. This is the doorway from the empty Shelf into M4's reads.
 * A `?q=` param prefills the query — used by the Shelf's curated starter picks.
 */
export function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQueryState] = useState(() => searchParams.get('q') ?? '')
  // Mirror the query into the URL (?q=) so navigating into a book and back
  // restores the search bar instead of clearing it.
  const setQuery = (v: string) => {
    setQueryState(v)
    setSearchParams(
      (prev) => {
        if (v) prev.set('q', v)
        else prev.delete('q')
        return prev
      },
      { replace: true },
    )
  }
  const [results, setResults] = useState<Book[]>([])
  const [status, setStatus] = useState<Status>('idle')

  // Arrived from a friend's "Read" button — carry that buddy through to the book.
  const withUid = searchParams.get('with')
  const withName = searchParams.get('name')
  const bookHref = (bookId: string) =>
    withUid ? `/book/${bookId}?with=${withUid}` : `/book/${bookId}`

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
      <h1 className="font-display text-3xl text-text">Add a book</h1>

      {withName && (
        <p className="mt-2 text-text-muted">
          Finding a book to read with{' '}
          <span className="text-text">{withName}</span>.
        </p>
      )}

      <Eyebrow className="mt-4 block">Searching Google Books</Eyebrow>
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-surface-alt px-4 py-3">
        <span className="text-lg text-text-faint" aria-hidden="true">
          ⌕
        </span>
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, author, or ISBN…"
          autoCorrect="off"
          className="min-w-0 flex-1 bg-transparent text-text placeholder:text-text-muted/60 focus:outline-none"
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
        <ul>
          {results.map((book) => (
            <li key={book.id}>
              <Link
                to={bookHref(book.id)}
                state={{ from: '/search' }}
                className="flex items-center gap-4 border-t border-border-soft py-3.5 transition-colors hover:bg-surface/60"
              >
                <BookCover book={book} className="w-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-medium leading-tight text-text">
                    {book.title}
                  </p>
                  <p className="truncate text-sm text-text-muted">
                    {authorLine(book.authors)}
                    {book.year ? ` · ${book.year}` : ''}
                  </p>
                  {book.pageCount != null && (
                    <Eyebrow className="mt-0.5 block">
                      {book.pageCount} pp
                      {book.publisher ? ` · ${book.publisher}` : ''}
                    </Eyebrow>
                  )}
                </div>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-xl text-accent"
                  aria-hidden="true"
                >
                  +
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
