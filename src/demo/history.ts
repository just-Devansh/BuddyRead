// DEMO DATA — see src/demo/coread.ts. Replaced by real reads in M4.
import type { AvatarTone } from '../components/Avatar'
import type { SpineTone } from '../components/BookCover'

export type FinishedBook = {
  id: string
  title: string
  author: string
  spine: SpineTone
  kind: 'Solo' | 'Buddy'
  rating: number
  note: string
  meta: string
  buddies: { initial: string; tone: AvatarTone }[]
}

export const FINISHED: FinishedBook[] = [
  {
    id: 'normal-people',
    title: 'Normal People',
    author: 'Sally Rooney',
    spine: 'blue',
    kind: 'Buddy',
    rating: 4.5,
    note: '“Read it in two feverish weekends with M.”',
    meta: 'Feb 2026 · 11 days · Paperback',
    buddies: [{ initial: 'M', tone: 'gold' }],
  },
  {
    id: 'piranesi',
    title: 'Piranesi',
    author: 'Susanna Clarke',
    spine: 'brown',
    kind: 'Solo',
    rating: 5,
    note: '“The Beauty of the House is immeasurable.”',
    meta: 'Jan 2026 · 6 days · Hardcover',
    buddies: [],
  },
  {
    id: 'a-little-life',
    title: 'A Little Life',
    author: 'Hanya Yanagihara',
    spine: 'plum',
    kind: 'Buddy',
    rating: 4,
    note: '“Wept on the phone together at 2am.”',
    meta: 'Dec 2025 · 34 days · Ebook',
    buddies: [
      { initial: 'M', tone: 'gold' },
      { initial: 'A', tone: 'green' },
    ],
  },
]
