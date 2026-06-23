import { useState } from 'react'
import { Eyebrow } from './Eyebrow'
import { ProgressBar } from './ProgressBar'

const FEELINGS = ['Riveted', 'Steady', 'Slogging'] as const

/**
 * A bottom-sheet for logging tonight's pages: a page stepper with a live
 * progress bar, a line worth remembering, and how it sat with you. Presentational
 * until M4 — "save" just closes the sheet. Local state only.
 */
export function LogSessionSheet({
  open,
  startPage,
  total,
  edition,
  buddyName,
  onClose,
}: {
  open: boolean
  startPage: number
  total: number
  edition: string
  buddyName: string
  onClose: () => void
}) {
  const [page, setPage] = useState(startPage)
  const [feeling, setFeeling] = useState<(typeof FEELINGS)[number]>('Riveted')

  if (!open) return null

  const step = (d: number) =>
    setPage((p) => Math.max(0, Math.min(total, p + d)))

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
      />

      {/* Sheet — capped to the app column */}
      <div className="relative w-full max-w-app rounded-t-[28px] bg-surface px-6 pb-8 pt-3 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.5)]">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="font-display text-2xl text-text">Tonight's pages</h2>
        <Eyebrow className="mt-0.5 block">
          {edition} · {total} pages
        </Eyebrow>

        {/* Stepper */}
        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => step(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-alt text-2xl text-accent transition-colors hover:bg-bg"
            aria-label="One page back"
          >
            −
          </button>
          <div className="font-display text-6xl font-semibold leading-none text-text">
            {page}
          </div>
          <button
            type="button"
            onClick={() => step(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl text-accent-contrast transition-opacity hover:opacity-90"
            aria-label="One page forward"
          >
            +
          </button>
        </div>
        <p className="mt-2 text-center font-mono text-[11px] text-text-faint">
          current page · of {total}
        </p>
        <ProgressBar value={total ? page / total : 0} className="mt-3" />

        {/* A line worth remembering */}
        <Eyebrow className="mb-2 mt-6 block">A line worth remembering</Eyebrow>
        <textarea
          rows={2}
          placeholder="The bunny chapters undid me…"
          className="w-full resize-none rounded-xl border border-border bg-surface-alt px-4 py-3 italic text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
        />

        {/* Feeling */}
        <Eyebrow className="mb-2 mt-5 block">How did it sit with you?</Eyebrow>
        <div className="flex gap-2.5">
          {FEELINGS.map((f) => {
            const active = feeling === f
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFeeling(f)}
                className={`flex-1 rounded-lg py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-accent text-accent-contrast'
                    : 'border border-border bg-surface-alt text-text-muted hover:text-text'
                }`}
              >
                {f}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-accent py-3.5 font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          Save &amp; nudge {buddyName}
        </button>
      </div>
    </div>
  )
}
