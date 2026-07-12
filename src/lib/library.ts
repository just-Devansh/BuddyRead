import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { SpineTone } from './spines'

/**
 * A personal library — books a reader has shelved, à la Goodreads/Fable lists,
 * but surfaced as an actual bookshelf. Lives at `users/{uid}/library/{bookId}`
 * (book id as doc id, so a book is shelved once and simply moves between
 * shelves). Owner-writable; readable by the owner and their friends, which is
 * what lets a buddy's profile show their shelves.
 *
 * One field, `shelf`, with three values. **Favorite implies read**: a favorite
 * is one doc with `shelf: 'favorite'`, and it shows on *both* the Read and
 * Favorites shelves — so there's never a favorite that isn't also read.
 */
export type Shelf = 'tbr' | 'read' | 'favorite'

/** A book, snapshotted into the library entry at shelving time. */
export interface LibraryBook {
  id: string
  title: string
  authors: string[]
  coverUrl: string | null
  pageCount: number | null
}

export interface LibraryDoc {
  book: LibraryBook
  shelf: Shelf
  addedAt: Timestamp | null
  updatedAt: Timestamp | null
  /** A closing verdict, mirrored here from the read when the book is finished, so
   *  it's visible to friends (reads are participant-only; the library is
   *  friend-readable). Absent until the book is finished with a rating/review. */
  rating?: number | null
  review?: string | null
  reviewedAt?: Timestamp | null
  /** A manual sort key **per shelf** (smaller = further left), written when the
   *  reader drags to reorder. Per-shelf because a favorite shows on both Read and
   *  Favorites and can sit differently on each. Absent until reordered — then the
   *  book falls back to newest-added-leftmost (see {@link booksOnShelf}). */
  order?: Partial<Record<Shelf, number>>
}

export interface LibraryItem extends LibraryDoc {
  id: string // === book.id
}

/** The three shelves, in display order, with their labels and empty-shelf hints
 *  (shown beside the dashed placeholder slots when a shelf has no books). `empty`
 *  is your own bookcase; `emptyOther` is a buddy's, in the third person — a little
 *  personality where a bare shelf would otherwise just look broken. */
export const SHELVES: {
  key: Shelf
  label: string
  eyebrow: string
  empty: string
  emptyOther: (name: string) => string
}[] = [
  {
    key: 'tbr',
    label: 'To Read',
    eyebrow: 'TBR',
    empty: 'An empty TBR? Blasphemy.',
    emptyOther: (n) => `${n}'s TBR is empty. Suspicious.`,
  },
  {
    key: 'read',
    label: 'Read',
    eyebrow: 'Read',
    empty: 'Nothing finished yet — the night is young.',
    emptyOther: (n) => `${n} hasn't finished a book here yet.`,
  },
  {
    key: 'favorite',
    label: 'Favorites',
    eyebrow: 'Favorites',
    empty: 'No favorites yet. Hard to please — respect.',
    emptyOther: (n) => `${n} hasn't crowned a favorite yet.`,
  },
]

/** Place (or move) a book onto a shelf. Favorite is stored as-is and also reads
 *  onto the Read shelf via {@link booksOnShelf}. An optional `verdict` mirrors a
 *  finished read's rating/review onto the (friend-readable) library doc, so the
 *  circle feed can surface it — pass it only when closing a book. */
export async function setShelf(
  uid: string,
  book: LibraryBook,
  shelf: Shelf,
  verdict?: { rating: number | null; review: string | null },
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'library', book.id),
    {
      book,
      shelf,
      addedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(verdict
        ? {
            rating: verdict.rating,
            review: verdict.review?.trim() || null,
            reviewedAt: serverTimestamp(),
          }
        : {}),
    },
    { merge: true },
  )
}

/**
 * Record a rating and/or review on a library book. A rating **implies read**, so
 * the book is placed on the given read-type shelf (`read` or `favorite`) — the
 * caller resolves which (a Favorite stays a Favorite; everything else lands on
 * Read). The verdict is mirrored onto this (friend-readable) doc so the circle
 * feed can surface it, exactly like a finished read's verdict.
 *
 * `review === undefined` leaves any existing review untouched (used when only the
 * stars change, e.g. tapping "Cancel" on the review step); `null`/'' clears it.
 * `isNew` stamps `addedAt` only for a book not yet shelved, so re-rating an old
 * book doesn't bump it to the front of its shelf.
 */
export async function rateBook(
  uid: string,
  book: LibraryBook,
  shelf: Extract<Shelf, 'read' | 'favorite'>,
  verdict: { rating: number | null; review?: string | null },
  isNew = false,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'library', book.id),
    {
      book,
      shelf,
      rating: verdict.rating,
      ...(verdict.review !== undefined ? { review: verdict.review?.trim() || null } : {}),
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(isNew ? { addedAt: serverTimestamp() } : {}),
    },
    { merge: true },
  )
}

/** Take a book off the shelves entirely. */
export async function removeFromLibrary(uid: string, bookId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'library', bookId))
}

/** One-shot read of another reader's library (a buddy's profile). */
export async function fetchLibrary(uid: string): Promise<LibraryItem[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'library'))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as LibraryDoc) }))
}

/** Effective left-to-right sort key for a book on a shelf: its manual order if
 *  the reader has dragged it, else `-addedAt` so an untouched book stays
 *  newest-leftmost. Manual keys are assigned as small integers (0,1,2…), which
 *  always sort left of an untouched book's large-negative `-addedAt` — so a
 *  freshly added book still lands leftmost even amongst reordered ones. */
function shelfOrderKey(i: LibraryItem, shelf: Shelf): number {
  const o = i.order?.[shelf]
  return typeof o === 'number' ? o : -(i.addedAt?.toMillis() ?? 0)
}

/** The books that belong on a given shelf — Read also gathers Favorites. */
export function booksOnShelf(items: LibraryItem[], shelf: Shelf): LibraryItem[] {
  const on =
    shelf === 'read'
      ? items.filter((i) => i.shelf === 'read' || i.shelf === 'favorite')
      : items.filter((i) => i.shelf === shelf)
  return on.sort((a, b) => shelfOrderKey(a, shelf) - shelfOrderKey(b, shelf))
}

/**
 * Persist a hand-arranged shelf order. `orderedIds` is the shelf's books in their
 * new left-to-right sequence; each gets `order.{shelf} = index` in one batch. Only
 * this shelf's key is touched, so reordering Read never disturbs how a favorite
 * sits on Favorites (or vice-versa). `updatedAt` is deliberately left alone — a
 * reorder isn't a shelving event and shouldn't resurface in the circle feed.
 */
export async function reorderShelf(
  uid: string,
  shelf: Shelf,
  orderedIds: string[],
): Promise<void> {
  const batch = writeBatch(db)
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'users', uid, 'library', id), { [`order.${shelf}`]: index })
  })
  await batch.commit()
}

const SPINE_TONES: SpineTone[] = ['olive', 'wine', 'sand', 'blue', 'brown', 'plum']

/** A stable spine colour for a book, so a shelf looks varied but never reshuffles. */
export function spineToneFor(id: string): SpineTone {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return SPINE_TONES[h % SPINE_TONES.length]
}
