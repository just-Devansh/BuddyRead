/**
 * The end-of-session mood — a tiny, playful read on how the night left you. A
 * curated set so it renders the same everywhere (the split card, the activity
 * feed) and never turns into a wall of arbitrary emoji. Stored by `key`; the
 * emoji and word are presentation only.
 */
export interface Mood {
  key: string
  emoji: string
  word: string
}

export const MOODS: Mood[] = [
  { key: 'hooked', emoji: '🤩', word: 'Hooked' },
  { key: 'cozy', emoji: '😌', word: 'Cozy' },
  { key: 'wrecked', emoji: '😭', word: 'Wrecked' },
  { key: 'drowsy', emoji: '😴', word: 'Drowsy' },
  { key: 'puzzled', emoji: '🤔', word: 'Puzzled' },
  { key: 'restless', emoji: '😐', word: 'Restless' },
]

/** Look a stored mood key back up to its emoji + word, or null if unknown. */
export function moodByKey(key: string | null | undefined): Mood | null {
  if (!key) return null
  return MOODS.find((m) => m.key === key) ?? null
}
