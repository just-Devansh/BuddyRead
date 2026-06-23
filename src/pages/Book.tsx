import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BookCover } from '../components/BookCover'
import { Eyebrow } from '../components/Eyebrow'
import { authorLine, getBook, type Book } from '../lib/books'

/** A small muted fact, shown only when we actually have it. */
function Meta({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <Eyebrow as="dt">{label}</Eyebrow>
      <dd className="mt-0.5 text-text">{value}</dd>
    </div>
  )
}

/**
 * A single book's page: cover, title, the facts worth knowing, and its blurb.
 * "Read this together" leads to the invite flow (presentational until M4 reads).
 */
export function BookDetail() {
  const { id } = useParams<{ id: string }>()
  // Tag the fetched result with its id (book === null means that id failed).
  // Status is then derived, so the effect only ever setState's in a callback
  // and a new id reads as "loading" until its own fetch lands.
  const [result, setResult] = useState<{ id: string; book: Book | null } | null>(
    null,
  )

  useEffect(() => {
    if (!id) return
    const ctrl = new AbortController()
    getBook(id, ctrl.signal)
      .then((b) => setResult({ id, book: b }))
      .catch(() => {
        if (!ctrl.signal.aborted) setResult({ id, book: null })
      })
    return () => ctrl.abort()
  }, [id])

  const matched = result && result.id === id ? result : null
  const status = !matched ? 'loading' : matched.book ? 'done' : 'error'
  const book = matched?.book ?? null

  return (
    <AppShell>
      <Link
        to="/search"
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
      >
        ‹ Back to search
      </Link>

      {status === 'loading' && (
        <p className="mt-10 text-center text-sm text-text-muted">
          Fetching the book…
        </p>
      )}

      {status === 'error' && (
        <p className="mt-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          Couldn't open that one. It may have wandered off the shelf — try
          searching again.
        </p>
      )}

      {book && (
        <article className="mt-5">
          <div className="flex gap-5">
            <BookCover
              book={book}
              author={book.authors[0]}
              className="w-28 shrink-0 ipad:w-36"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-pretty font-display text-3xl leading-tight text-text ipad:text-4xl">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="mt-1 text-pretty text-text-muted">
                  {book.subtitle}
                </p>
              )}
              <p className="mt-2 text-text">{authorLine(book.authors)}</p>
            </div>
          </div>

          <button
            type="button"
            disabled
            title="Coming in the next chapter"
            className="mt-6 w-full cursor-not-allowed rounded-xl border border-border bg-surface px-5 py-3.5 font-medium text-text-muted ipad:w-auto ipad:px-10"
          >
            Start a read
          </button>

          <dl className="mt-7 grid grid-cols-2 gap-4">
            <Meta
              label="Pages"
              value={book.pageCount ? String(book.pageCount) : null}
            />
            <Meta
              label="Published"
              value={book.year ? String(book.year) : book.publishedDate}
            />
            <Meta label="Publisher" value={book.publisher} />
            <Meta label="Subjects" value={book.categories[0] ?? null} />
          </dl>

          {book.description && (
            <section className="mt-7">
              <Eyebrow className="block">About</Eyebrow>
              <p className="mt-2 max-w-md whitespace-pre-line text-pretty leading-relaxed text-text-muted">
                {book.description}
              </p>
            </section>
          )}
        </article>
      )}
    </AppShell>
  )
}
