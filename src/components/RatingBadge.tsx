import { formatRating } from '../lib/rating'

/**
 * A tiny "★ 4.25" pill, à la Fable, for stamping a reader's rating onto a book
 * cover in the library. Always a dark, translucent chip with a gold star, so it
 * reads cleanly over any cover art in either theme. Decorative — the cover it
 * sits on already carries the title for screen readers.
 */
export function RatingBadge({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span
      aria-label={`Rated ${formatRating(value)} of 5`}
      className={`pointer-events-none inline-flex items-center gap-0.5 rounded-full bg-black/72 px-1.5 py-[3px] font-mono text-[10px] font-medium leading-none text-[#f6efe0] shadow-[0_2px_6px_-1px_rgba(0,0,0,0.5)] backdrop-blur-sm ${className}`}
    >
      <span className="text-gold" aria-hidden="true">
        ★
      </span>
      <span className="numeral">{formatRating(value)}</span>
    </span>
  )
}
