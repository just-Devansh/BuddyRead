import { fetchLibrary, type LibraryBook } from './library'
import type { Relationship } from './friends'
import { otherParty } from './friends'

/**
 * A book surfaced from your reading circle's shelves — something a buddy loved
 * or has lined up to read — offered as a thing to begin *together*. This is the
 * one genuinely relevant, non-fabricated "what next" we can show on the nook:
 * a buddy's reads aren't readable (participants only), but their library is
 * friend-readable, so we lean on that. Favorites carry the strongest signal
 * ("loved"), then to-read lists.
 */
export interface CirclePick {
  book: LibraryBook
  /** The buddies behind this pick (those who loved or listed it), de-duplicated. */
  owners: { uid: string; name: string; photoURL: string | null }[]
  /** At least one buddy has this on their Favorites shelf. */
  loved: boolean
}

/**
 * Gather picks from every buddy's library in one pass. Favorites rank above
 * to-read; a book several buddies share collapses into one pick crediting all
 * of them. `excludeBookIds` drops anything you're already reading. Best-effort
 * per friend — one unreadable library never sinks the rest.
 */
export async function fetchCirclePicks(
  friends: Relationship[],
  myUid: string,
  excludeBookIds: Set<string>,
  limit = 4,
): Promise<CirclePick[]> {
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

  // Collapse to one pick per book, crediting every buddy who has it shelved.
  const byBook = new Map<string, CirclePick>()
  for (const { buddy, items } of libraries) {
    for (const item of items) {
      if (item.shelf !== 'favorite' && item.shelf !== 'tbr') continue
      if (excludeBookIds.has(item.book.id)) continue

      const owner = { uid: buddy.uid, name: buddy.displayName ?? 'A buddy', photoURL: buddy.photoURL }
      const existing = byBook.get(item.book.id)
      if (existing) {
        if (!existing.owners.some((o) => o.uid === owner.uid)) existing.owners.push(owner)
        existing.loved = existing.loved || item.shelf === 'favorite'
      } else {
        byBook.set(item.book.id, {
          book: item.book,
          owners: [owner],
          loved: item.shelf === 'favorite',
        })
      }
    }
  }

  // Loved books first, then those shared by more of the circle.
  return [...byBook.values()]
    .sort((a, b) => Number(b.loved) - Number(a.loved) || b.owners.length - a.owners.length)
    .slice(0, limit)
}
