import { useState } from 'react'
import { Eyebrow } from './Eyebrow'
import { ProgressBar } from './ProgressBar'

/**
 * A bottom-sheet for logging tonight's pages: a page stepper with a live
 * progress bar and an optional line worth remembering. Calls `onSave(page, note)`
 * — the co-read screen writes it to the read. Local state only otherwise.
 */
export function LogSessionSheet({
  open,
  startPage,
  total,
  edition,
  buddyName,
  saving,
  onSave,
  onClose,
}: {
  open: boolean
  startPage: number
  total: number
  edition: string
  buddyName: string
  saving: boolean
  onSave: (page: number, note: string) => void
  onClose: () => void
}) {
  const [page, setPage] = useState(startPage)
  const [note, setNote] = useState('')

  if (!open) return null

  const step = (d: number) => setPage((p) => Math.max(0, Math.min(total, p + d)))

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
      />

      <div className="relative w-full max-w-app rounded-t-[28px] bg-surface px-6 pb-8 pt-3 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.5)]">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="font-display text-2xl text-text">Tonight's pages</h2>
        <Eyebrow className="mt-0.5 block">
          {edition} · {total} pages
        </Eyebrow>

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
          onClick={() => onSave(page, note)}
          className="mt-6 w-full rounded-xl bg-accent py-3.5 font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : `Save & nudge ${buddyName}`}
        </button>
      </div>
    </div>
  )
}
