import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { BookCover } from '../components/BookCover'
import { Eyebrow } from '../components/Eyebrow'
import { authorLine, getBook, type Book } from '../lib/books'
import { DEMO_READ } from '../demo/coread'

const EDITIONS = ['Paperback', 'Hardcover', 'Kindle', 'Ebook'] as const

/**
 * "Read this together" — pick your edition and where you're starting, then send
 * the invitation. The book is real (via getBook); the invite itself is
 * presentational until M4 reads exist, so "send" just returns you to the shelf.
 */
export function InviteRead() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [edition, setEdition] = useState<(typeof EDITIONS)[number]>('Paperback')
  const buddy = DEMO_READ.buddy

  useEffect(() => {
    if (!id) return
    const ctrl = new AbortController()
    getBook(id, ctrl.signal)
      .then(setBook)
      .catch(() => {})
    return () => ctrl.abort()
  }, [id])

  return (
    <AppShell>
      <Link
        to={id ? `/book/${id}` : '/search'}
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
      >
        ‹ Back
      </Link>

      {/* Book + the ask */}
      <section className="mt-4 flex flex-col items-center text-center">
        {book ? (
          <BookCover book={book} author={book.authors[0]} className="w-24" />
        ) : (
          <div className="aspect-[2/3] w-24 rounded-sm border border-border bg-surface-alt" />
        )}
        <h1 className="mt-5 font-display text-3xl leading-tight text-text">
          Read this with {buddy.name}?
        </h1>
        <p className="mt-1 text-text-muted">
          {book ? authorLine(book.authors) : '…'}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Avatar name={buddy.name} tone={buddy.tone} size="h-6 w-6" />
          <span className="text-sm text-text-muted">{buddy.name} · Hyderabad</span>
        </div>
      </section>

      {/* Edition */}
      <section className="mt-7">
        <Eyebrow className="block">
          Your edition <span className="opacity-60">· just for the vibes</span>
        </Eyebrow>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {EDITIONS.map((e) => {
            const active = edition === e
            return (
              <button
                key={e}
                type="button"
                onClick={() => setEdition(e)}
                className={`rounded-xl py-3 text-sm transition-colors ${
                  active
                    ? 'bg-accent text-accent-contrast'
                    : 'border border-border bg-surface text-text-muted hover:text-text'
                }`}
              >
                {e}
              </button>
            )
          })}
        </div>
      </section>

      {/* Pages */}
      <section className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <Eyebrow className="mb-2 block">Total pages</Eyebrow>
          <div className="rounded-xl border border-border bg-surface px-4 py-3 font-mono text-text">
            {book?.pageCount ?? '—'}
          </div>
        </div>
        <div>
          <Eyebrow className="mb-2 block">Starting at</Eyebrow>
          <div className="rounded-xl border border-border bg-surface px-4 py-3 font-mono text-text">
            0
          </div>
        </div>
      </section>
      <p className="mt-3 text-sm italic text-text-faint">
        {buddy.name} sets her own edition &amp; page count when she accepts.
      </p>

      <button
        type="button"
        onClick={() => navigate('/home')}
        className="mt-7 w-full rounded-xl bg-accent py-4 font-medium text-accent-contrast transition-opacity hover:opacity-90"
      >
        Send the invitation
      </button>
    </AppShell>
  )
}
