import { Avatar } from './Avatar'
import { ProgressBar } from './ProgressBar'
import { fraction, type Reader } from '../demo/coread'

/** One reader's half of the split card. */
function Half({ reader, tone }: { reader: Reader; tone: 'accent' | 'gold' }) {
  const pct = Math.round(fraction(reader) * 100)
  return (
    <div className="flex flex-1 flex-col items-center px-2 text-center">
      <Avatar name={reader.name} tone={reader.tone} size="h-11 w-11" />
      <p className="mt-2 text-text">{reader.name}</p>
      <span className="mt-1.5 rounded-full border border-border bg-bg px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-text-muted">
        {reader.edition}
      </span>
      <div className="mt-3 font-display text-5xl font-semibold leading-none text-text">
        {pct}
        <span className="text-xl text-text-muted">%</span>
      </div>
      <p className="mt-1 font-mono text-[11px] text-text-muted">
        {reader.page} / {reader.total}
      </p>
      <ProgressBar value={fraction(reader)} tone={tone} className="mt-3 w-3/4" />
    </div>
  )
}

/**
 * The heart of the app: two readers, side by side, never racing. Your pace in
 * terracotta, your buddy's in gold, parted by a fleuron. The "ahead" line below
 * is a nudge to keep company, not a scoreboard.
 */
export function SplitProgressCard({
  you,
  buddy,
  paceLine,
}: {
  you: Reader
  buddy: Reader
  paceLine: string
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
        <Half reader={you} tone="accent" />
        <Half reader={buddy} tone="gold" />
      </div>
      <p className="mt-3.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-gold">
        {paceLine}
      </p>
    </>
  )
}
