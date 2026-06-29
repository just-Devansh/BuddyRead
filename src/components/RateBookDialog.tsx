import { useEffect, useState } from 'react'
import { BookCover } from './BookCover'
import { Eyebrow } from './Eyebrow'
import { StarRating } from './StarRating'
import { useBackClose } from './useBackClose'
import { formatRating } from '../lib/rating'
import type { LibraryBook } from '../lib/library'

/** How the reader left the dialog. `submit` keeps the typed review; `cancel`
 *  keeps the stars but leaves any existing review untouched; `skip` ("Do this
 *  later") records no rating; `dismiss` is a Back/backdrop bail-out. The parent
 *  decides what to persist and whether to route on. */
export type RateAction = 'submit' | 'cancel' | 'skip' | 'dismiss'

export interface RateResult {
  action: RateAction
  rating: number
  review: string
}

/**
 * A small, two-step ceremony for putting stars (and, if you like, a few words) on
 * a book you've read. Step one is the rating — five stars to the quarter, à la
 * Letterboxd; step two is an optional review. Reached when you shelve a book as
 * Read/Favorite, or from the slim "Rate" control on a book's page.
 *
 * It's deliberately a *centred* dialog (not a bottom sheet like the closing
 * ceremony): it flows out of the Add-to-library menu and stays a quick,
 * contained moment. The hardware Back button dismisses the dialog only — you
 * stay on the page beneath it (see {@link useBackClose}); the on-screen "‹" on
 * step two steps back to the rating without leaving.
 *
 * Mounted only while it's shown (the parent gates it), so it always opens fresh
 * on the book's current verdict — no reset effect needed.
 */
export function RateBookDialog({
  book,
  shelfLabel,
  initialRating = 0,
  initialReview = '',
  saving = false,
  onResolve,
}: {
  book: LibraryBook
  /** The shelf this rating files under, shown as quiet context (e.g. "Read"). */
  shelfLabel?: string
  initialRating?: number
  initialReview?: string
  saving?: boolean
  onResolve: (result: RateResult) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [rating, setRating] = useState(initialRating)
  const [review, setReview] = useState(initialReview)

  // Lock the page behind us. Two reasons: it stops the body scrolling under the
  // dialog, and — because PullToRefresh stands down whenever body overflow is
  // hidden — it stops a horizontal star-drag from being mistaken for a pull and
  // flashing the refresh. Mounted-while-open, so this runs exactly on open/close.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Back/backdrop bails out without recording a rating; the parent stays put.
  useBackClose(true, () => onResolve({ action: 'dismiss', rating, review }))

  const resolve = (action: RateAction) => onResolve({ action, rating, review })
  const stepAnim = { animation: 'rise-in 300ms cubic-bezier(0.22,0.61,0.18,1) both' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Rate ${book.title}`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => resolve('dismiss')}
        className="overlay-enter absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="pop-enter relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xl">
        {/* The book, kept small so the stars are the event */}
        <div className="flex items-start gap-3.5">
          <BookCover
            book={{ title: book.title, coverUrl: book.coverUrl, isbn13: null, isbn10: null }}
            author={book.authors[0]}
            className="w-11 shrink-0"
            rounded="rounded-md"
          />
          <div className="min-w-0 flex-1 pt-0.5">
            {shelfLabel && <Eyebrow className="block text-accent">{shelfLabel}</Eyebrow>}
            <h2 className="mt-0.5 truncate font-display text-lg leading-tight text-text">
              {book.title}
            </h2>
            {book.authors[0] && (
              <p className="truncate font-body text-[13px] italic text-text-faint">
                {book.authors[0]}
              </p>
            )}
          </div>
          {/* A two-step progress meter — segments that *fill*, so it reads as
              "step 1 of 2", not swipeable pagination dots. */}
          <div className="mt-1.5 flex shrink-0 items-center gap-1" aria-hidden="true">
            <span className="h-1 w-4 rounded-full bg-accent transition-colors" />
            <span className={`h-1 w-4 rounded-full transition-colors ${step >= 2 ? 'bg-accent' : 'bg-border'}`} />
          </div>
        </div>

        {step === 1 ? (
          <div key="rate" style={stepAnim}>
            <div className="mt-7 flex flex-col items-center">
              <StarRating value={rating} onChange={setRating} size="text-[2.75rem]" />
              <span className="numeral mt-3 min-w-[3ch] text-center text-2xl text-text-muted">
                {rating > 0 ? formatRating(rating) : '—'}
              </span>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-text-faint">
                {rating > 0 ? 'Drag to fine-tune' : 'Tap the stars to rate'}
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => resolve('skip')}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-text"
              >
                Do this later
              </button>
              <button
                type="button"
                disabled={rating === 0}
                onClick={() => setStep(2)}
                className="rounded-full bg-accent px-7 py-2.5 text-sm font-medium text-accent-contrast transition-[opacity,transform] hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div key="review" style={stepAnim}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-accent"
            >
              <span aria-hidden="true">‹</span>
              <span>{formatRating(rating)} stars</span>
            </button>

            <Eyebrow className="mb-2 mt-4 block">A few words? — optional</Eyebrow>
            <textarea
              rows={4}
              autoFocus
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What stayed with you — a line, a feeling, the verdict…"
              className="w-full resize-none rounded-xl border border-border bg-surface-alt px-4 py-3 italic text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => resolve('cancel')}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-text disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => resolve('submit')}
                className="rounded-full bg-accent px-7 py-2.5 text-sm font-medium text-accent-contrast transition-[opacity,transform] hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
