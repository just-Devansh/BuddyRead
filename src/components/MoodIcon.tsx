/**
 * Expressive duotone glyphs for the curated moods (see lib/moods.ts), keyed by
 * mood key. Each is built in three optional layers — a `soft` filled silhouette
 * (the body, at low opacity), a `solid` detail (the crisp core), and `line`
 * strokes (steam, a flag, a sleepy "z") — all drawn in `currentColor`, so the
 * caller tints the whole thing (muted by default, terracotta when chosen).
 *
 * The two-tone fill gives them an emoji-like, sticker-ish weight and personality
 * without resorting to actual unicode emoji (which render differently on every
 * platform) or a coloured set that would fight the parchment/espresso palette.
 */
interface Glyph {
  soft?: string | string[]
  solid?: string | string[]
  line?: string | string[]
}

const GLYPHS: Record<string, Glyph> = {
  // flame — captivated
  hooked: {
    soft: 'M12 2.4c.4 2.4 1.9 4.1 3.3 5.6C16.8 9.6 18 11.4 18 13.6A6 6 0 0 1 6 13.6c0-1.6.6-2.9 1.5-3.9.2 1.1.9 1.8 1.9 1.9-.6-1.4-.4-2.8.6-4.1C11 8 11.6 5.4 12 2.4Z',
    solid:
      'M12 12.3c1.4 1 2.1 2.1 2.1 3.4A2.2 2.2 0 0 1 12 17.9a2.1 2.1 0 0 1-2.1-2.2c0-.8.3-1.5.9-2 .1.6.4 1 1 1.1-.5-.7-.4-1.6.3-2.5Z',
  },
  // coffee — cosy
  cozy: {
    soft: 'M5 8.5h9.5v4.2a3.3 3.3 0 0 1-3.3 3.3H8.3A3.3 3.3 0 0 1 5 12.7V8.5Z',
    line: [
      'M14.7 9.8h1.1a2.1 2.1 0 0 1 0 4.2h-1.1',
      'M8 3.4c-.7.8-.7 1.7 0 2.5',
      'M11.3 3.4c-.7.8-.7 1.7 0 2.5',
    ],
  },
  // teardrop — wrecked
  wrecked: {
    soft: 'M12 3.2C9 7.4 7 9.9 7 12.6A5 5 0 0 0 17 12.6C17 9.9 15 7.4 12 3.2Z',
    line: 'M9.9 11.6a2.4 2.4 0 0 0 .7 3',
  },
  // crescent moon + a sleepy z — drowsy
  drowsy: {
    soft: 'M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 7.5 7.5 0 1 0 20.5 14.2Z',
    line: 'M14 3.6h3l-3 3h3',
  },
  // mountain + summit flag — a slog uphill
  slog: {
    soft: 'M3.5 19 9 9l3.3 4.2L15.5 9l5 10Z',
    line: ['M15.5 9V5', 'M15.5 5.2 18.3 6 15.5 6.8'],
  },
  // sparkles — mind blown
  moved: {
    soft: 'M12 3.2l1.9 5.4 5.4 1.9-5.4 1.9L12 17.8l-1.9-5.4L4.7 10.5l5.4-1.9Z',
    solid: 'M18.8 3.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z',
  },
}

function asArray(v: string | string[] | undefined): string[] {
  return v == null ? [] : Array.isArray(v) ? v : [v]
}

export function MoodIcon({ mood, className = 'h-6 w-6' }: { mood: string; className?: string }) {
  const g = GLYPHS[mood]
  if (!g) return null
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {asArray(g.soft).map((d, i) => (
        <path key={`s${i}`} d={d} fill="currentColor" fillOpacity={0.24} />
      ))}
      {asArray(g.solid).map((d, i) => (
        <path key={`c${i}`} d={d} fill="currentColor" />
      ))}
      {asArray(g.line).map((d, i) => (
        <path
          key={`l${i}`}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
