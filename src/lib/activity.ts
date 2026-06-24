import type { User } from 'firebase/auth'
import {
  addDoc,
  collection,
  serverTimestamp,
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
  | 'read_declined'
  | 'read_logged'
  | 'read_left'

export interface ActivityEventDoc {
  actorUid: string
  actorName: string | null
  actorPhotoURL: string | null
  type: ActivityType
  bookTitle: string | null
  page: number | null
  note: string | null
  createdAt: Timestamp | null
}

export interface ActivityItem extends ActivityEventDoc {
  id: string
}

type Detail = { bookTitle?: string | null; page?: number | null; note?: string | null }

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
      page: detail.page ?? null,
      note: detail.note ?? null,
      createdAt: serverTimestamp(),
    })
  } catch {
    // Best-effort — the action it records already succeeded.
  }
}
