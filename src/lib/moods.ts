/**
 * The end-of-session mood — a tiny, quiet read on how the night left you. A
 * curated set so it renders the same everywhere (the split card, the activity
 * feed) and never turns into a wall of arbitrary emoji. Stored by `key`; the
 * word is presentation, and the icon is drawn by MoodIcon (keyed by `key`).
 */
export interface Mood {
  key: string
  word: string
}

export const MOODS: Mood[] = [
  { key: 'hooked', word: 'Hooked' },
  { key: 'cozy', word: 'Cozy' },
  { key: 'wrecked', word: 'Wrecked' },
  { key: 'drowsy', word: 'Drowsy' },
  { key: 'slog', word: 'Slog' },
  { key: 'moved', word: 'Mind Blown' },
]

/** Look a stored mood key back up to its word, or null if unknown. */
export function moodByKey(key: string | null | undefined): Mood | null {
  if (!key) return null
  return MOODS.find((m) => m.key === key) ?? null
}
