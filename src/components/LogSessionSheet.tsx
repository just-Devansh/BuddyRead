import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Eyebrow } from './Eyebrow'
import { MOODS } from '../lib/moods'

const DISMISS_PX = 120 // drag past this and the sheet lets go

/**
 * A bottom-sheet for logging tonight's pages: a draggable page bar (with fine
 * ± nudges), a curated end-of-session mood, and an optional line worth keeping.
 * Calls `onSave(page, note, mood)` — the co-read screen writes it to the read.
 *
 * It behaves like a real sheet: it slides up on open, you can drag the handle
 * down to dismiss it, and the page behind is locked from scrolling so the grab
 * gesture never leaks into the document.
 */
export function LogSessionSheet({
  open,
  startPage,
  startMood,
  total,
  edition,
  buddyName,
  saving,
  onSave,
  onClose,
}: {
  open: boolean
  startPage: number
  startMood?: string | null
  total: number
  edition: string
  buddyName: string
  saving: boolean
  onSave: (page: number, note: string, mood: string | null) => void
  onClose: () => void
}) {
  const [page, setPage] = useState(startPage)
  const [note, setNote] = useState('')
  const [mood, setMood] = useState<string | null>(startMood ?? null)

  // Slide + drag state. `show` drives the open/close slide; `dragY` follows the
  // finger while dragging the handle.
  const [show, setShow] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startYRef = useRef(0)

  // Slide up once mounted; lock the page behind from scrolling while open.
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

  // Slide the sheet out, then let the parent unmount it.
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

  const clamp = (v: number) => Math.max(0, Math.min(total, v))
  const step = (d: number) => setPage((p) => clamp(p + d))
  const pct = total ? Math.round((page / total) * 100) : 0

  const translateY = show ? `${dragY}px` : '100%'
  const backdropOpacity = show ? Math.max(0, 1 - dragY / 420) : 0

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
          <h2 className="mt-3 font-display text-2xl text-text">Tonight's pages</h2>
          <Eyebrow className="mt-0.5 block">
            {edition} · {total} pages
          </Eyebrow>
        </div>

        {/* Page count with fine nudges */}
        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => step(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-alt text-2xl text-accent transition-colors hover:bg-bg"
            aria-label="One page back"
          >
            −
          </button>
          <div className="min-w-[4ch] text-center font-display text-6xl font-semibold leading-none text-text">
            {page}
          </div>
          <button
            type="button"
            onClick={() => step(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-2xl text-accent-contrast transition-opacity hover:opacity-90"
            aria-label="One page forward"
          >
            +
          </button>
        </div>
        <p className="mt-2 text-center font-mono text-[11px] text-text-faint">
          {pct}% · of {total}
        </p>

        {/* Draggable page bar */}
        <input
          type="range"
          min={0}
          max={total}
          value={page}
          onChange={(e) => setPage(clamp(Number(e.target.value)))}
          aria-label="Set current page"
          style={{
            background: `linear-gradient(to right, var(--accent) ${pct}%, var(--bar-track) ${pct}%)`,
          }}
          className="page-range mt-4 w-full"
        />

        {/* End-of-session mood */}
        <Eyebrow className="mb-2 mt-6 block">Mood tonight</Eyebrow>
        <div className="grid grid-cols-3 gap-2">
          {MOODS.map((m) => {
            const on = mood === m.key
            return (
              <button
                key={m.key}
                type="button"
                aria-pressed={on}
                onClick={() => setMood((cur) => (cur === m.key ? null : m.key))}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-colors ${
                  on
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface-alt hover:border-accent/40'
                }`}
              >
                <span className="text-2xl leading-none" aria-hidden="true">
                  {m.emoji}
                </span>
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.08em] ${
                    on ? 'text-accent' : 'text-text-faint'
                  }`}
                >
                  {m.word}
                </span>
              </button>
            )
          })}
        </div>

        {/* A line worth remembering */}
        <Eyebrow className="mb-2 mt-6 block">A line worth remembering</Eyebrow>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional — a sentence that stayed with you…"
          className="w-full resize-none rounded-xl border border-border bg-surface-alt px-4 py-3 italic text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(page, note, mood)}
          className="mt-6 w-full rounded-xl bg-accent py-3.5 font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : `Save & nudge ${buddyName}`}
        </button>
      </div>
    </div>
  )
}
