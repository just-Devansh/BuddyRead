import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { formatRating } from '../lib/rating'

const STARS = [0, 1, 2, 3, 4]

/**
 * Five stars rated to the nearest quarter — drag or tap across them (à la
 * Letterboxd). Two identical star rows stacked: a muted outline, and an accent
 * fill clipped from the right to the value, so any fraction renders cleanly
 * without special glyphs. Read-only when `onChange` is omitted.
 */
export function StarRating({
  value,
  onChange,
  size = 'text-4xl',
  fillColor,
  trackColor,
}: {
  value: number
  onChange?: (v: number) => void
  size?: string
  /** Explicit fill colour (defaults to the themed accent). Used by the keepsake
   *  card, which must render a fixed light/dark palette regardless of app theme. */
  fillColor?: string
  trackColor?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const interactive = !!onChange

  const valueFromX = (clientX: number): number => {
    const el = ref.current
    if (!el) return value
    const { left, width } = el.getBoundingClientRect()
    const quarters = Math.round(((clientX - left) / width) * 20)
    return Math.max(0.25, Math.min(5, quarters / 4))
  }

  const onDown = (e: ReactPointerEvent) => {
    if (!interactive) return
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    onChange(valueFromX(e.clientX))
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!interactive || e.buttons === 0) return
    onChange(valueFromX(e.clientX))
  }

  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      role={interactive ? 'slider' : 'img'}
      aria-label={interactive ? 'Rating' : `Rated ${formatRating(value)} of 5`}
      aria-valuenow={interactive ? value : undefined}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? 5 : undefined}
      className={`relative inline-flex select-none leading-none ${size} ${
        interactive ? 'cursor-pointer touch-none' : ''
      }`}
    >
      {/* Outline layer */}
      <div
        className={`flex ${trackColor ? '' : 'text-border'}`}
        style={trackColor ? { color: trackColor } : undefined}
        aria-hidden="true"
      >
        {STARS.map((i) => (
          <span key={i} className="px-0.5">
            ★
          </span>
        ))}
      </div>
      {/* Filled layer, clipped from the right to the value */}
      <div
        className={`absolute inset-0 flex ${fillColor ? '' : 'text-accent'}`}
        style={{
          clipPath: `inset(0 ${100 - pct}% 0 0)`,
          ...(fillColor ? { color: fillColor } : {}),
        }}
        aria-hidden="true"
      >
        {STARS.map((i) => (
          <span key={i} className="px-0.5">
            ★
          </span>
        ))}
      </div>
    </div>
  )
}
