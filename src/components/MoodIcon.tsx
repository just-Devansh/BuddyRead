import {
  Smiley,
  SmileyMeh,
  SmileyMelting,
  SmileyNervous,
  SmileyWink,
  SmileyXEyes,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'

/**
 * A face for each curated mood (see lib/moods.ts). We use Phosphor's smiley set
 * in its **duotone** weight: a soft filled face under crisp single-tone
 * features. They draw in `currentColor`, so the caller tints the whole thing
 * (muted by default, terracotta when chosen) — expressive, facial, and on-tone
 * without resorting to coloured platform emoji.
 */
const FACES: Record<string, Icon> = {
  hooked: SmileyWink, // delighted, drawn in
  cozy: Smiley, // content, warm
  wrecked: SmileyMelting, // emotionally undone
  drowsy: SmileyMeh, // heavy-lidded, fading
  slog: SmileyNervous, // gritted teeth, uphill
  moved: SmileyXEyes, // mind blown
}

export function MoodIcon({ mood, className = 'h-6 w-6' }: { mood: string; className?: string }) {
  const Face = FACES[mood]
  if (!Face) return null
  return <Face weight="duotone" className={className} aria-hidden />
}
