/**
 * A hairline progress bar. `value` is 0–1. The fill is the terracotta accent by
 * default; pass `tone="gold"` for a buddy's pace, so the two readers stay
 * distinguishable at a glance without ever reading as a race.
 */
export function ProgressBar({
  value,
  tone = 'accent',
  className = '',
}: {
  value: number
  tone?: 'accent' | 'gold'
  className?: string
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-bar-track ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          backgroundColor: tone === 'gold' ? 'var(--gold)' : 'var(--bar-fill)',
        }}
      />
    </div>
  )
}
