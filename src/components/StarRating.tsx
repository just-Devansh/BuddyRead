/**
 * Read-only gold star rating, 0–5 in half steps. Filled stars and the filled
 * half are gold; the remainder sits in a faint track tone. The numeric value
 * trails in mono for readers who'd rather have the number.
 */
export function StarRating({
  value,
  showValue = true,
  className = '',
}: {
  value: number
  showValue?: boolean
  className?: string
}) {
  const v = Math.max(0, Math.min(5, value))
  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      role="img"
      aria-label={`${v} out of 5 stars`}
    >
      <span className="flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, v - i)) // 0, 0.5, or 1 per star
          return (
            <span key={i} className="relative text-[15px] leading-none text-border">
              ★
              <span
                className="absolute left-0 top-0 overflow-hidden text-gold"
                style={{ width: `${fill * 100}%` }}
              >
                ★
              </span>
            </span>
          )
        })}
      </span>
      {showValue && (
        <span className="font-mono text-[11px] text-text-faint">
          {v.toFixed(1)}
        </span>
      )}
    </div>
  )
}
