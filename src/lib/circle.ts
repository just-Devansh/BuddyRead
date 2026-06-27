import { fetchLibrary, type LibraryBook, type Shelf } from './library'
import type { Relationship } from './friends'
import { otherParty } from './friends'

/**
 * A glimpse of what your reading circle is up to — not a recommendation to act
 * on, just company. We surface two kinds of activity, both drawn from each
 * buddy's (friend-readable) library: a book they've **shelved** (any shelf), and
 * a book they've **rated or reviewed**. Buddy reads stay private — a read is
 * readable only by its participants, so who someone is reading *with* never
 * leaks here. The rating/review is mirrored onto the library doc when a book is
 * finished (see `setShelf`), which is what makes it visible to friends at all.
 */
export type CircleEventType = 'shelved' | 'reviewed'

export interface CircleActor {
  uid: string
  name: string
  photoURL: string | null
}

export interface CircleEvent {
  /** Stable key — one event per buddy+book (its latest meaningful state). */
  id: string
  type: CircleEventType
  actor: CircleActor
  book: LibraryBook
  shelf: Shelf
  /** Present on a `reviewed` event — the rating (0–5) and/or the written line. */
  rating: number | null
  review: string | null
  /** Sort key, in millis. */
  at: number
}

/**
 * Gather the circle's recent shelf activity in one pass — newest first. One
 * event per buddy+book: if they've left a rating or a line it reads as a
 * **review**, otherwise as a plain **shelving**. Best-effort per friend — one
 * unreadable library never sinks the rest.
 */
export async function fetchCircleFeed(
  friends: Relationship[],
  myUid: string,
  limit = 8,
): Promise<CircleEvent[]> {
  const buddies = friends.map((r) => otherParty(r, myUid))

  const libraries = await Promise.all(
    buddies.map(async (b) => {
      try {
        return { buddy: b, items: await fetchLibrary(b.uid) }
      } catch {
        return { buddy: b, items: [] }
      }
    }),
  )

  const events: CircleEvent[] = []
  for (const { buddy, items } of libraries) {
    const actor: CircleActor = {
      uid: buddy.uid,
      name: buddy.displayName ?? 'A buddy',
      photoURL: buddy.photoURL,
    }
    for (const item of items) {
      const review = item.review?.trim() || null
      const reviewed = item.rating != null || review !== null
      const shelvedAt = item.updatedAt?.toMillis() ?? item.addedAt?.toMillis() ?? 0
      events.push({
        id: `${buddy.uid}:${item.book.id}`,
        type: reviewed ? 'reviewed' : 'shelved',
        actor,
        book: item.book,
        shelf: item.shelf,
        rating: reviewed ? (item.rating ?? null) : null,
        review: reviewed ? review : null,
        at: (reviewed ? item.reviewedAt?.toMillis() : null) ?? shelvedAt,
      })
    }
  }

  return events.sort((a, b) => b.at - a.at).slice(0, limit)
}
