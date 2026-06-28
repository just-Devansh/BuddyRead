import { useState } from 'react'
import { StarRating } from './StarRating'
import { RateBookDialog, type RateResult } from './RateBookDialog'
import { rateBook, type LibraryBook } from '../lib/library'
import { useLibrary } from '../library/useLibrary'
import { formatRating } from '../lib/rating'

/**
 * The slim "Rate" control that lives just under a book's cover on its page. It
 * fills the natural gap beside the title block, and is the way to put stars on a
 * book you've already read without going through the shelf menu.
 *
 * Rating **implies read**: if the book isn't shelved yet (or only on To Read), a
 * rating quietly files it on the Read shelf; a Favorite stays a Favorite. Once
 * rated, the control shows the stars and re-opens the dialog to edit. Unlike the
 * Add-to-library flow it never navigates — you stay on the book.
 */
export function BookRating({ uid, book }: { uid: string; book: LibraryBook }) {
  const { items } = useLibrary()
  const [open, setOpen] = useState(false)

  const item = items.find((i) => i.id === book.id) ?? null
  const value = item?.rating ?? null

  const resolve = async (r: RateResult) => {
    setOpen(false)
    if (r.action !== 'submit' && r.action !== 'cancel') return // skip / dismiss → no rating
    const shelf = item?.shelf === 'favorite' ? 'favorite' : 'read'
    const isNew = !item
    try {
      if (r.action === 'submit') {
        await rateBook(uid, book, shelf, { rating: r.rating, review: r.review }, isNew)
      } else {
        await rateBook(uid, book, shelf, { rating: r.rating }, isNew)
      }
    } catch {
      // Best-effort — a failed write simply leaves the rating unchanged.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={value != null ? `Rated ${formatRating(value)} of 5 — edit` : 'Rate this book'}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1.5 text-text-muted transition-colors hover:border-accent/50 hover:text-text"
      >
        {value != null ? (
          <>
            <StarRating value={value} size="text-sm" fillColor="var(--gold)" trackColor="var(--border)" />
            <span className="font-mono text-[11px] text-text-muted">{formatRating(value)}</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L12 16.77 6.8 19.5l.99-5.8-4.21-4.1 5.82-.85z" />
            </svg>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em]">Rate</span>
          </>
        )}
      </button>

      {open && (
        <RateBookDialog
          book={book}
          shelfLabel={item?.shelf === 'favorite' ? 'Favorites' : 'Read'}
          initialRating={item?.rating ?? 0}
          initialReview={item?.review ?? ''}
          onResolve={(r) => void resolve(r)}
        />
      )}
    </>
  )
}
