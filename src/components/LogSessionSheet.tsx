import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Eyebrow } from './Eyebrow'
import { MoodIcon } from './MoodIcon'
import { useBackClose } from './useBackClose'
import { MOODS } from '../lib/moods'

const DISMISS_PX = 120 // drag past this and the sheet lets go

/**
 * Press-and-hold auto-repeat for the ± buttons — the way a phone volume rocker
 * or a remote behaves. A tap nudges once; holding fires once, waits out a short
 * delay, then repeats, *accelerating* the step so you can travel 50 pages
 * without 50 taps (1 → 5 → 10 a tick the longer you hold). Returns a `start`
 * factory (called with the direction) and a `stop` to wire to pointer-up/leave.
 */
function useHoldRepeat(action: (delta: number) => void) {
  const actionRef = useRef(action)
  useEffect(() => {
    actionRef.current = action
  })
  const timers = useRef<{ to?: number; iv?: number }>({})

  const stop = () => {
    if (timers.current.to) clearTimeout(timers.current.to)
    if (timers.current.iv) clearInterval(timers.current.iv)
    timers.current = {}
  }
  useEffect(() => stop, [])

  const start = (dir: 1 | -1) => (e: ReactPointerEvent) => {
    if (e.button != null && e.button > 0) return // ignore non-primary pointers
    e.preventDefault()
    stop()
    actionRef.current(dir) // the immediate nudge (so a plain tap still works)
    const began = Date.now()
    timers.current.to = window.setTimeout(() => {
      timers.current.iv = window.setInterval(() => {
        const held = Date.now() - began
        const mag = held > 2600 ? 10 : held > 1300 ? 5 : 1
        actionRef.current(dir * mag)
      }, 90)
    }, 380)
  }

  return { start, stop }
}

/** The ± glyph as a crisp, optically-centred SVG — the text "+"/"−" sat a hair
 *  off-centre inside the round buttons because of font metrics. */
function Stepper({ sign }: { sign: 'plus' | 'minus' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      {sign === 'plus' && <path d="M12 5v14" />}
    </svg>
  )
}

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
  solo = false,
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
  /** Solo read — no buddy to nudge, so the save button reads plainly. */
  solo?: boolean
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

  // Slide up once mounted; lock the page behind from scrolling while open. That
  // body lock is also the signal PullToRefresh watches to stand down, so a pull
  // inside the sheet can't trip the app's custom refresh.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true))
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = prev
    }
  }, [])

  // Auto-repeat for the ± steppers (kept above the early return so the hook
  // order is stable). Clamps against `total` itself so it never overruns.
  const hold = useHoldRepeat((d) =>
    setPage((p) => Math.max(0, Math.min(total, p + d))),
  )

  // Slide the sheet out, then let the parent unmount it.
  const requestClose = useCallback(() => {
    setShow(false)
    setTimeout(onClose, 300)
  }, [onClose])

  // The hardware/browser Back button dismisses the sheet, rather than leaving
  // the co-read screen underneath it.
  useBackClose(open, requestClose)

  if (!open) return null

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
        className="relative flex max-h-[90dvh] w-full max-w-app flex-col rounded-t-[28px] bg-surface px-6 pb-5 pt-3 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.5)]"
      >
        {/* Grab handle — drag this down to dismiss. Kept outside the scroll
            area so the title + handle never clip off the top of the screen. */}
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          className="-mx-6 -mt-3 shrink-0 cursor-grab touch-none px-6 pb-1 pt-3 active:cursor-grabbing"
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
          <h2 className="mt-3 font-display text-2xl text-text">Tonight's pages</h2>
          <Eyebrow className="mt-0.5 block">
            {edition} · {total} pages
          </Eyebrow>
        </div>

        {/* Everything below the handle scrolls if it ever has to, so the sheet
            can never grow past the viewport and lose its drag-back handle. */}
        <div className="no-scrollbar -mx-6 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-1">
          {/* Page count, lifted onto a warm accent-lit stage. Tap a stepper to
              nudge; hold to auto-repeat and accelerate — see useHoldRepeat. */}
          <div className="log-stage mt-4 flex items-center justify-between rounded-3xl px-5 py-4">
            <button
              type="button"
              onPointerDown={hold.start(-1)}
              onPointerUp={hold.stop}
              onPointerLeave={hold.stop}
              onPointerCancel={hold.stop}
              onContextMenu={(e) => e.preventDefault()}
              className="flex h-12 w-12 shrink-0 select-none touch-none items-center justify-center rounded-full border border-border bg-surface-alt text-accent transition-transform hover:bg-bg active:scale-90"
              aria-label="Page back (hold to rewind)"
            >
              <Stepper sign="minus" />
            </button>

            <div className="flex flex-col items-center leading-none">
              <span className="font-display text-5xl font-semibold leading-none text-text">
                {page}
              </span>
              <span className="mt-2 font-mono text-[10px] text-text-faint">
                <span className="text-accent">{pct}%</span> · of {total}
              </span>
            </div>

            <button
              type="button"
              onPointerDown={hold.start(1)}
              onPointerUp={hold.stop}
              onPointerLeave={hold.stop}
              onPointerCancel={hold.stop}
              onContextMenu={(e) => e.preventDefault()}
              className="flex h-12 w-12 shrink-0 select-none touch-none items-center justify-center rounded-full bg-accent text-accent-contrast shadow-[0_10px_22px_-10px_rgba(190,90,55,0.8)] transition-transform hover:opacity-95 active:scale-90"
              aria-label="Page forward (hold to fast-forward)"
            >
              <Stepper sign="plus" />
            </button>
          </div>

          {/* End-of-session mood */}
          <Eyebrow className="mb-2 mt-5 block">Mood tonight</Eyebrow>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map((m) => {
              const on = mood === m.key
              return (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMood((cur) => (cur === m.key ? null : m.key))}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-all ${
                    on
                      ? 'border-accent bg-accent/10 shadow-[0_10px_24px_-14px_rgba(190,90,55,0.85)]'
                      : 'border-border bg-surface-alt hover:border-accent/40 hover:bg-accent/[0.04]'
                  }`}
                >
                  <MoodIcon
                    mood={m.key}
                    className={`h-7 w-7 transition-transform ${
                      on ? 'scale-110 text-accent' : 'text-text-muted'
                    }`}
                  />
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
          <Eyebrow className="mb-2 mt-5 block">A line worth remembering</Eyebrow>
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
            className="mt-5 w-full rounded-xl bg-accent py-3.5 font-medium text-accent-contrast shadow-[0_14px_30px_-14px_rgba(190,90,55,0.9)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : solo ? 'Save progress' : `Save & nudge ${buddyName}`}
          </button>
        </div>
      </div>
    </div>
  )
}
