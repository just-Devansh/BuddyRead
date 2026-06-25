import type { SpineTone } from './spines'

/**
 * An editorial "front table" — a few real books to begin a read with, for when
 * the shelf is empty. NOT user data: a fixed, curated set of buddy-read-friendly
 * dark-academia titles. Covers come from Open Library by cover id (a different
 * host from Google Books, so it isn't subject to that shared quota); tapping a
 * pick opens a prefilled catalog search. Spine placeholder covers any miss.
 */
export type Starter = {
  title: string
  author: string
  coverId: number // Open Library cover_i
  tone: SpineTone
}

export const STARTERS: Starter[] = [
  { title: 'The Secret History', author: 'Donna Tartt', coverId: 744854, tone: 'olive' },
  { title: 'Piranesi', author: 'Susanna Clarke', coverId: 10226290, tone: 'sand' },
  { title: 'If We Were Villains', author: 'M. L. Rio', coverId: 8835640, tone: 'plum' },
  { title: 'A Little Life', author: 'Hanya Yanagihara', coverId: 12065783, tone: 'wine' },
  { title: 'The Name of the Rose', author: 'Umberto Eco', coverId: 15023290, tone: 'brown' },
  { title: 'Normal People', author: 'Sally Rooney', coverId: 8794265, tone: 'blue' },
]

/** Open Library cover by id; `default=false` 404s a miss so the spine shows. */
export const starterCover = (id: number) =>
  `https://covers.openlibrary.org/b/id/${id}-M.jpg?default=false`
