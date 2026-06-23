import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { BookCover } from '../components/BookCover'
import { StarRating } from '../components/StarRating'
import { FINISHED, type FinishedBook } from '../demo/history'

const FILTERS = ['All', 'Solo', 'Buddy'] as const

function Card({ book }: { book: FinishedBook }) {
  return (
    <li className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
      <BookCover
        book={{ title: book.title, coverUrl: null, isbn13: null, isbn10: null }}
        author={book.author}
        tone={book.spine}
        className="w-14 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-xl leading-tight text-text">
              {book.title}
            </h2>
            <p className="text-sm text-text-muted">{book.author}</p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] ${
              book.kind === 'Buddy'
                ? 'border-accent/50 text-accent'
                : 'border-border text-text-muted'
            }`}
          >
            {book.kind}
          </span>
        </div>
        <StarRating value={book.rating} className="mt-2" />
        <p className="mt-1.5 font-display italic leading-snug text-text-muted">
          {book.note}
        </p>
        <div className="mt-2.5 flex items-center gap-2.5">
          {book.buddies.length > 0 && (
            <span className="flex">
              {book.buddies.map((b, i) => (
                <Avatar
                  key={b.initial}
                  name={b.initial}
                  tone={b.tone}
                  size="h-5.5 w-5.5"
                  className={`text-[11px] ring-2 ring-surface ${i > 0 ? '-ml-2' : ''}`}
                />
              ))}
            </span>
          )}
          <span className="font-mono text-[9px] tracking-[0.06em] text-text-faint">
            {book.meta}
          </span>
        </div>
      </div>
    </li>
  )
}

/**
 * The shelf of finished books — solo and buddy reads, with ratings and the line
 * each one left behind. Demo data until M4. Reached from the Profile "Finished"
 * shelf.
 */
export function History() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const shown =
    filter === 'All' ? FINISHED : FINISHED.filter((b) => b.kind === filter)

  return (
    <AppShell>
      <Link
        to="/profile"
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
      >
        ‹ You
      </Link>
      <h1 className="mt-2 font-display text-3xl text-text">Read</h1>

      <div className="mt-3 flex gap-2">
        {FILTERS.map((f) => {
          const active = filter === f
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                active
                  ? 'bg-accent text-accent-contrast'
                  : 'border border-border bg-surface text-text-muted hover:text-text'
              }`}
            >
              {f}
            </button>
          )
        })}
      </div>

      <ul className="mt-5 space-y-3.5">
        {shown.map((book) => (
          <Card key={book.id} book={book} />
        ))}
      </ul>
    </AppShell>
  )
}
