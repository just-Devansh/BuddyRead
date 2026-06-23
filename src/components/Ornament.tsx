/**
 * The fleuron (❧) used as a quiet section break — optionally flanked by hairline
 * rules, the way a printed book parts one passage from the next.
 */
export function Ornament({
  rules = false,
  className = '',
}: {
  rules?: boolean
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-text-faint ${className}`}
      aria-hidden="true"
    >
      {rules && <span className="h-px w-11 bg-border" />}
      <span className="text-sm">❧</span>
      {rules && <span className="h-px w-11 bg-border" />}
    </div>
  )
}
