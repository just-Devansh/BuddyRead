import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Eyebrow } from './Eyebrow'
import { StarRating } from './StarRating'
import { formatRating } from '../lib/rating'
import type { Verdict } from '../lib/reads'

const DISMISS_PX = 120 // drag past this and the sheet lets go

/**
 * The closing ceremony — a bottom sheet you reach for once, at the end. Stars to
 * the nearest quarter, a heart if you loved it, and the line it left you. Or set
 * the book down unfinished, no rating, no shame. Mirrors LogSessionSheet's
 * slide-up / drag-to-dismiss / scroll-lock so the two feel of a piece.
 *
 * Calls `onSave(verdict)` — the co-read screen writes it (and shelves the book).
 */
export function CloseReadSheet({
  open,
  bookTitle,
  buddyName,
  saving,
  onSave,
  onClose,
}: {
  open: boolean
  bookTitle: string
  buddyName: string
  saving: boolean
  onSave: (verdict: Verdict) => void
  onClose: () => void
}) {
  const [rating, setRating] = useState(0)
  const [favorite, setFavorite] = useState(false)
  const [review, setReview] = useState('')

  // Slide + drag state, identical to the log sheet.
  const [show, setShow] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startYRef = useRef(0)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true))
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = prev
    }
  }, [])

  if (!open) return null

  const requestClose = () => {
    setShow(false)
    setTimeout(onClose, 300)
  }

  const onHandleDown = (e: ReactPointerEvent) => {
    startYRef.current = e.clientY
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onHandleMove = (e: ReactPointerEvent) => {
    if (!dragging) return
    setDragY(Math.max(0, e.clientY - startYRef.current))
  }
  const onHandleUp = () => {
    setDragging(false)
    if (dragY > DISMISS_PX) requestClose()
    else setDragY(0)
  }

  const translateY = show ? `${dragY}px` : '100%'
  const backdropOpacity = show ? Math.max(0, 1 - dragY / 420) : 0

  const finish = () =>
    onSave({ rating: rating > 0 ? rating : null, review, favorite, dnf: false })
  const setDown = () => onSave({ rating: null, review, favorite: false, dnf: true })

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={requestClose}
        style={{ opacity: backdropOpacity }}
        className="absolute inset-0 bg-black/55 transition-opacity duration-300"
      />

      <div
        style={{
          transform: `translateY(${translateY})`,
          transition: dragging ? 'none' : 'transform 320ms cubic-bezier(0.22,0.61,0.18,1)',
        }}
        className="relative w-full max-w-app rounded-t-[28px] bg-surface px-6 pb-8 pt-3 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.5)]"
      >
        {/* Grab handle — drag this down to dismiss */}
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          className="-mx-6 -mt-3 cursor-grab touch-none px-6 pb-1 pt-3 active:cursor-grabbing"
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
          <h2 className="mt-3 font-display text-2xl text-text">Closing the book</h2>
          <Eyebrow className="mt-0.5 block">{bookTitle}</Eyebrow>
        </div>

        {/* The rating — stars to the quarter, and a heart if you loved it */}
        <div className="mt-7 flex flex-col items-center">
          <StarRating value={rating} onChange={setRating} size="text-[2.75rem]" />
          <div className="mt-2 flex items-center gap-3">
            <span className="min-w-[3ch] text-center font-display text-xl text-text-muted">
              {rating > 0 ? formatRating(rating) : '—'}
            </span>
            <button
              type="button"
              aria-pressed={favorite}
              onClick={() => setFavorite((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                favorite
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-surface-alt text-text-muted hover:border-accent/40'
              }`}
            >
              <span aria-hidden="true">{favorite ? '♥' : '♡'}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em]">
                Loved it
              </span>
            </button>
          </div>
        </div>

        {/* The line it left you */}
        <Eyebrow className="mb-2 mt-7 block">The line it left you</Eyebrow>
        <textarea
          rows={3}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Optional — a sentence, a verdict, the thing you'll remember…"
          className="w-full resize-none rounded-xl border border-border bg-surface-alt px-4 py-3 italic text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <button
          type="button"
          disabled={saving}
          onClick={finish}
          className="mt-6 w-full rounded-xl bg-accent py-3.5 font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Closing…' : 'Close the book'}
        </button>
        <p className="mt-2.5 text-center text-xs leading-relaxed text-text-muted">
          Your verdict stays sealed until {buddyName} finishes too — then you'll
          read each other's at once.
        </p>

        <button
          type="button"
          disabled={saving}
          onClick={setDown}
          className="mx-auto mt-4 block font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint transition-colors hover:text-accent disabled:opacity-60"
        >
          I set this one down unfinished
        </button>
      </div>
    </div>
  )
}
