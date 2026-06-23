// DEMO DATA — see src/demo/coread.ts. Replaced by real reads/activity in M4.
import type { AvatarTone } from '../components/Avatar'

/** A run of text where some spans are emphasised; rendered in Activity.tsx. */
export type Part = { t: string; strong?: boolean; em?: boolean }

export type ActivityItem = {
  id: string
  initial: string
  tone: AvatarTone
  parts: Part[]
  quote?: string
  stars?: number
  meta: string
}

export const REQUEST = {
  who: 'Meher',
  book: 'The Secret History',
}

export const TODAY: ActivityItem[] = [
  {
    id: 'a1',
    initial: 'M',
    tone: 'gold',
    parts: [
      { t: 'Meher', strong: true },
      { t: ' logged 30 pages — now at ' },
      { t: 'p.240', strong: true },
      { t: '.' },
    ],
    meta: '2h ago · 9% ahead of you',
  },
  {
    id: 'a2',
    initial: 'M',
    tone: 'gold',
    parts: [
      { t: 'Meher', strong: true },
      { t: ' left a note on ' },
      { t: 'The Secret History', em: true },
      { t: '.' },
    ],
    quote: '“Beauty is terror…”',
    meta: '2h ago',
  },
]

export const YESTERDAY: ActivityItem[] = [
  {
    id: 'a3',
    initial: 'A',
    tone: 'green',
    parts: [
      { t: 'Aisha', strong: true },
      { t: ' finished ' },
      { t: 'Piranesi', em: true },
    ],
    stars: 5,
    meta: 'Yesterday · 19:20',
  },
  {
    id: 'a4',
    initial: 'R',
    tone: 'terracotta',
    parts: [
      { t: 'You added ' },
      { t: 'The Goldfinch', em: true },
      { t: ' to ' },
      { t: 'To Be Read', strong: true },
      { t: '.' },
    ],
    meta: 'Yesterday · 08:05',
  },
]
