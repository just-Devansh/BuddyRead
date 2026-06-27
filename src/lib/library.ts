import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
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
}

export interface LibraryItem extends LibraryDoc {
  id: string // === book.id
}

/** The three shelves, in display order, with their labels and an empty-shelf
 *  hint (shown beside the dashed placeholder slots when a shelf has no books). */
export const SHELVES: {
  key: Shelf
  label: string
  eyebrow: string
  empty: string
}[] = [
  { key: 'tbr', label: 'To Read', eyebrow: 'TBR', empty: 'Your next reads will live here.' },
  { key: 'read', label: 'Read', eyebrow: 'Read', empty: 'Books you finish will gather here.' },
  { key: 'favorite', label: 'Favorites', eyebrow: 'Favorites', empty: 'The ones you loved most.' },
]

/** Place (or move) a book onto a shelf. Favorite is stored as-is and also reads
 *  onto the Read shelf via {@link booksOnShelf}. */
export async function setShelf(
  uid: string,
  book: LibraryBook,
  shelf: Shelf,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'library', book.id),
    {
      book,
      shelf,
      addedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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

/** The books that belong on a given shelf — Read also gathers Favorites. */
export function booksOnShelf(items: LibraryItem[], shelf: Shelf): LibraryItem[] {
  const on =
    shelf === 'read'
      ? items.filter((i) => i.shelf === 'read' || i.shelf === 'favorite')
      : items.filter((i) => i.shelf === shelf)
  return on.sort((a, b) => (b.addedAt?.toMillis() ?? 0) - (a.addedAt?.toMillis() ?? 0))
}

const SPINE_TONES: SpineTone[] = ['olive', 'wine', 'sand', 'blue', 'brown', 'plum']

/** A stable spine colour for a book, so a shelf looks varied but never reshuffles. */
export function spineToneFor(id: string): SpineTone {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return SPINE_TONES[h % SPINE_TONES.length]
}
