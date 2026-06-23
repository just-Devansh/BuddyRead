import { Avatar, type AvatarTone } from './Avatar'
import { ProgressBar } from './ProgressBar'
import type { ProgressEntry } from '../lib/reads'

export type Side = {
  name: string
  tone: AvatarTone
  progress: ProgressEntry | undefined
}

/** One reader's half of the split card. */
function Half({ side, tone }: { side: Side; tone: 'accent' | 'gold' }) {
  const p = side.progress
  const pct = p && p.totalPages ? Math.round((p.currentPage / p.totalPages) * 100) : null
  return (
    <div className="flex flex-1 flex-col items-center px-2 text-center">
      <Avatar name={side.name} tone={side.tone} size="h-11 w-11" />
      <p className="mt-2 text-text">{side.name}</p>
      {p ? (
        <>
          <span className="mt-1.5 rounded-full border border-border bg-bg px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-text-muted">
            {p.edition}
          </span>
          <div className="mt-3 font-display text-5xl font-semibold leading-none text-text">
            {pct}
            <span className="text-xl text-text-muted">%</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            {p.currentPage} / {p.totalPages}
          </p>
          <ProgressBar
            value={p.currentPage / p.totalPages}
            tone={tone}
            className="mt-3 w-3/4"
          />
        </>
      ) : (
        <p className="mt-6 max-w-[8rem] font-display text-lg italic leading-snug text-text-faint">
          Yet to begin
        </p>
      )}
    </div>
  )
}

/**
 * The heart of the app: two readers, side by side, never racing. Your pace in
 * terracotta, your buddy's in gold, parted by a fleuron. The optional `paceLine`
 * below is a nudge to keep company, not a scoreboard.
 */
export function SplitProgressCard({
  you,
  buddy,
  paceLine,
}: {
  you: Side
  buddy: Side
  paceLine?: string | null
}) {
  return (
    <>
      <div className="relative flex rounded-2xl border border-border bg-surface px-1.5 py-5 shadow-[0_18px_34px_-24px_rgba(60,40,20,0.45)]">
        <span className="absolute inset-y-5 left-1/2 w-px bg-border" aria-hidden="true" />
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-1 text-xs text-text-faint"
          aria-hidden="true"
        >
          ❧
        </span>
        <Half side={you} tone="accent" />
        <Half side={buddy} tone="gold" />
      </div>
      {paceLine && (
        <p className="mt-3.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-gold">
          {paceLine}
        </p>
      )}
    </>
  )
}
