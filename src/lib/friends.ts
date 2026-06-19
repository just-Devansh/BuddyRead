import type { User } from 'firebase/auth'
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * A relationship between two readers, stored at a deterministic id so a pair
 * can only ever have one doc (no duplicate or reverse requests). It is the
 * single source of truth: the friends list, incoming and outgoing requests are
 * all derived from these. There is no `declined` state — declining, cancelling
 * and unfriending all just delete the doc, so re-requesting is a clean create.
 */
export interface FriendRequestDoc {
  participants: string[] // [fromUid, toUid] — queried with array-contains
  fromUid: string
  toUid: string
  fromName: string | null
  fromPhotoURL: string | null
  toName: string | null
  toPhotoURL: string | null
  status: 'pending' | 'accepted'
  createdAt: Timestamp | null
  respondedAt: Timestamp | null
}

export interface Relationship extends FriendRequestDoc {
  id: string
}

/** The minimal public identity behind an invite code. */
export interface InviteTarget {
  uid: string
  displayName: string | null
  photoURL: string | null
}

/** Deterministic doc id for a pair — uids sorted so direction doesn't matter. */
export function pairId(a: string, b: string): string {
  return a < b ? `${a}__${b}` : `${b}__${a}`
}

/** Tidy a typed-in code: trim, uppercase, strip spaces. */
export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

/** Resolve an invite code to its owner, or null if no such code. */
export async function resolveInviteCode(
  raw: string,
): Promise<InviteTarget | null> {
  const code = normalizeInviteCode(raw)
  if (!code) return null
  const snap = await getDoc(doc(db, 'inviteCodes', code))
  if (!snap.exists()) return null
  const data = snap.data() as InviteTarget
  return { uid: data.uid, displayName: data.displayName, photoURL: data.photoURL }
}

/** Send (or re-send) a friend request to the reader behind a resolved code. */
export async function sendFriendRequest(
  me: User,
  target: InviteTarget,
): Promise<void> {
  const id = pairId(me.uid, target.uid)
  await setDoc(doc(db, 'friendRequests', id), {
    participants: [me.uid, target.uid],
    fromUid: me.uid,
    toUid: target.uid,
    fromName: me.displayName,
    fromPhotoURL: me.photoURL,
    toName: target.displayName,
    toPhotoURL: target.photoURL,
    status: 'pending',
    createdAt: serverTimestamp(),
    respondedAt: null,
  })
}

/** Recipient accepts — flips the one doc to accepted. */
export async function acceptFriendRequest(id: string): Promise<void> {
  await updateDoc(doc(db, 'friendRequests', id), {
    status: 'accepted',
    respondedAt: serverTimestamp(),
  })
}

/** Decline, cancel, or unfriend — all the same single delete. */
export async function removeRelationship(id: string): Promise<void> {
  await deleteDoc(doc(db, 'friendRequests', id))
}

/** From a relationship, the *other* reader's identity (relative to me). */
export function otherParty(rel: Relationship, myUid: string) {
  const isFrom = rel.fromUid === myUid
  return {
    uid: isFrom ? rel.toUid : rel.fromUid,
    displayName: isFrom ? rel.toName : rel.fromName,
    photoURL: isFrom ? rel.toPhotoURL : rel.fromPhotoURL,
  }
}
