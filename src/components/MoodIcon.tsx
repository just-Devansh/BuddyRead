/** Line icons for the curated moods (see lib/moods.ts), keyed by mood key. They
 *  inherit colour via `currentColor`, so the caller tints them. Quieter and more
 *  on-tone than emoji. */
const PATHS: Record<string, string | string[]> = {
  // flame — captivated
  hooked:
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  // coffee — cosy
  cozy: [
    'M10 2v2',
    'M14 2v2',
    'M6 2v2',
    'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1',
  ],
  // teardrop — wrecked
  wrecked:
    'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z',
  // moon — drowsy
  drowsy: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  // mountain peak — a slog uphill
  slog: 'M3 20 12 4l9 16Z',
  // heart — moved
  moved:
    'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
}

export function MoodIcon({ mood, className = 'h-6 w-6' }: { mood: string; className?: string }) {
  const d = PATHS[mood]
  if (!d) return null
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  )
}
