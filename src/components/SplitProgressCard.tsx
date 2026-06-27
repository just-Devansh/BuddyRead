import { Link } from 'react-router-dom'
import { Avatar, type AvatarTone } from './Avatar'
import { MoodIcon } from './MoodIcon'
import { ProgressBar } from './ProgressBar'
import { moodByKey } from '../lib/moods'
import type { ProgressEntry } from '../lib/reads'

export type Side = {
  name: string
  tone: AvatarTone
  /** Real photo, when we have one — falls back to the gradient initial. */
  src?: string | null
  /** Where tapping this reader goes, if anywhere (their profile). */
  to?: string
  progress: ProgressEntry | undefined
}

/** One reader's half of the split card. */
function Half({ side, tone }: { side: Side; tone: 'accent' | 'gold' }) {
  const p = side.progress
  const pct = p && p.totalPages ? Math.round((p.currentPage / p.totalPages) * 100) : null
  const mood = moodByKey(p?.mood)

  const head = (
    <>
      <Avatar
        src={side.src}
        name={side.name}
        tone={side.src ? undefined : side.tone}
        size="h-11 w-11"
      />
      <p className="mt-2 text-text">{side.name}</p>
    </>
  )

  return (
    <div className="flex flex-1 flex-col items-center px-2 text-center">
      {side.to ? (
        <Link to={side.to} className="flex flex-col items-center transition-opacity hover:opacity-80">
          {head}
        </Link>
      ) : (
        head
      )}
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
          {mood && (
            <p className="mt-2.5 flex items-center gap-1.5 text-sm text-text-muted">
              <MoodIcon mood={mood.key} className="h-4 w-4" />
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-faint">
                {mood.word}
              </span>
            </p>
          )}
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
 * below is a nudge to keep company, not a scoreboard. Omit `buddy` for a solo
 * read — the same card, just your one side, full width and undivided.
 */
export function SplitProgressCard({
  you,
  buddy,
  paceLine,
}: {
  you: Side
  buddy?: Side | null
  paceLine?: string | null
}) {
  return (
    <>
      <div className="relative flex rounded-2xl border border-border bg-surface px-1.5 py-5 shadow-[0_18px_34px_-24px_rgba(60,40,20,0.45)]">
        {buddy && (
          <>
            <span className="absolute inset-y-5 left-1/2 w-px bg-border" aria-hidden="true" />
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-1 text-xs text-text-faint"
              aria-hidden="true"
            >
              ❧
            </span>
          </>
        )}
        <Half side={you} tone="accent" />
        {buddy && <Half side={buddy} tone="gold" />}
      </div>
      {buddy && paceLine && (
        <p className="mt-3.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-gold">
          {paceLine}
        </p>
      )}
    </>
  )
}
