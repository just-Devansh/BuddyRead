// ---------------------------------------------------------------------------
// DEMO DATA — presentational only. These screens (co-read, log session, history,
// activity) visualise the M4 "reads" vision before the data model exists. When
// M4 lands, this folder is deleted and the pages read from Firestore instead.
// ---------------------------------------------------------------------------
import type { AvatarTone } from '../components/Avatar'
import type { SpineTone } from '../components/BookCover'

export type Reader = {
  name: string
  initial: string
  tone: AvatarTone
  edition: string
  page: number
  total: number
}

export const DEMO_READ = {
  id: 'demo',
  title: 'The Secret History',
  author: 'Donna Tartt',
  spine: 'olive' as SpineTone,
  day: 6,
  begun: '14 Mar',
  you: {
    name: 'You',
    initial: 'R',
    tone: 'terracotta',
    edition: 'Paperback',
    page: 198,
    total: 559,
  } satisfies Reader,
  buddy: {
    name: 'Meher',
    initial: 'M',
    tone: 'gold',
    edition: 'Kindle',
    page: 240,
    total: 544,
  } satisfies Reader,
  paceLine: 'Meher is 9% ahead · keep pace',
  note: {
    author: 'Meher',
    when: '2h ago',
    page: 240,
    text: '“Beauty is terror. I finally understand what Julian meant — couldn’t put it down.”',
  },
}

export const fraction = (r: Reader) => r.page / r.total
