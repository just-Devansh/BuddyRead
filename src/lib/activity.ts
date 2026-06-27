import type { User } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * The activity log. Each reader has a private feed at `users/{uid}/activity` that
 * the *other* party appends to — a real, immutable record of what happened, so
 * things that leave no other trace (a declined request, every page logged) still
 * show up and survive. The signed-in user is always the actor; the recipient is
 * whose feed it lands in. Best-effort: a failed log never breaks its action.
 */
export type ActivityType =
  | 'friend_accepted'
  | 'friend_declined'
  | 'read_accepted'
  | 'read_started'
  | 'read_declined'
  | 'read_logged'
  | 'read_left'
  // Closing a read. The *fact* lands in the buddy's feed; the verdict (rating,
  // the line it left) stays sealed on the read until they finish too.
  | 'read_finished'
  | 'read_set_down'

export interface ActivityEventDoc {
  actorUid: string
  actorName: string | null
  actorPhotoURL: string | null
  type: ActivityType
  bookTitle: string | null
  /** The book's id, so a read's events can be found/cleared as a group. */
  bookId: string | null
  /** The other reader's name, when an event reads better with it (e.g. starts). */
  withName: string | null
  page: number | null
  note: string | null
  /** A curated mood key (see lib/moods.ts), when one was shared. */
  mood: string | null
  createdAt: Timestamp | null
}

export interface ActivityItem extends ActivityEventDoc {
  id: string
}

type Detail = {
  bookTitle?: string | null
  bookId?: string | null
  withName?: string | null
  page?: number | null
  note?: string | null
  mood?: string | null
}

export async function logActivity(
  recipientUid: string,
  actor: User,
  type: ActivityType,
  detail: Detail = {},
): Promise<void> {
  try {
    await addDoc(collection(db, 'users', recipientUid, 'activity'), {
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorPhotoURL: actor.photoURL,
      type,
      bookTitle: detail.bookTitle ?? null,
      bookId: detail.bookId ?? null,
      withName: detail.withName ?? null,
      page: detail.page ?? null,
      note: detail.note ?? null,
      mood: detail.mood ?? null,
      createdAt: serverTimestamp(),
    })
  } catch {
    // Best-effort — the action it records already succeeded.
  }
}

/**
 * Clear my own activity for one read (by book id) when I leave it, keeping only
 * the "begun together" line (read_started / read_accepted) so the feed reads:
 * we started this, then I left. Best-effort; only ever touches my own feed (the
 * rules don't permit deleting from anyone else's).
 */
export async function clearReadActivity(uid: string, bookId: string): Promise<void> {
  const keep = new Set<ActivityType>(['read_started', 'read_accepted'])
  try {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'activity'), where('bookId', '==', bookId)),
    )
    await Promise.all(
      snap.docs
        .filter((d) => !keep.has((d.data() as ActivityEventDoc).type))
        .map((d) => deleteDoc(d.ref)),
    )
  } catch {
    // Best-effort — leaving the read already succeeded.
  }
}
