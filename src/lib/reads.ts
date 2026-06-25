import type { User } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * A buddy read — two friends reading the same book. Unlike `friendRequests`
 * (one per pair), a pair can have many reads, so these use an auto id. The doc
 * is the single source of truth: a `pending` request the recipient accepts into
 * an `active` read. Declining, cancelling, or leaving all just delete the doc.
 *
 * Identity and the book are denormalized/snapshotted at creation, so the co-read
 * screen and shelf never need to read the other reader's profile or re-fetch the
 * book. Each reader owns their own entry in `progress` (their edition, length,
 * and where they are) — sends are minimal, so each fills theirs once active.
 */

/** A book, snapshotted into the read at creation. */
export interface ReadBook {
  id: string
  title: string
  authors: string[]
  coverUrl: string | null
  pageCount: number | null
}

/** One reader's side of a read: their edition, length, and progress. */
export interface ProgressEntry {
  edition: string
  totalPages: number
  currentPage: number
  note: string | null
  /** A curated end-of-session mood key (see lib/moods.ts), or null. */
  mood: string | null
  updatedAt: Timestamp | null
  noteAt: Timestamp | null
}

/**
 * One reader's verdict on closing a read. Stored under `finish[uid]`, mirroring
 * `progress` — owner-writable only. It's the *ceremony*: a rating, the line it
 * left you, and whether you loved it. Sealed from your buddy (in the UI) until
 * they close the book too, so a verdict is never a spoiler.
 */
export interface FinishEntry {
  /** 0–5 in quarter steps, or null if they chose not to rate (or set it down). */
  rating: number | null
  /** The line it left you / a short closing review. */
  review: string | null
  /** Loved it — files the book to Favorites as well as Read. */
  favorite: boolean
  /** They set it down rather than finished it; no rating, no shame. */
  dnf: boolean
  finishedAt: Timestamp | null
}

export interface ReadDoc {
  participants: string[] // [fromUid, toUid] — queried with array-contains
  fromUid: string
  toUid: string
  fromName: string | null
  fromPhotoURL: string | null
  toName: string | null
  toPhotoURL: string | null
  book: ReadBook
  status: 'pending' | 'active'
  progress: Record<string, ProgressEntry>
  /** Per-reader closing verdicts. Absent until someone closes the book. A read
   *  is "finished" when both participants have an entry — derived, not a status. */
  finish?: Record<string, FinishEntry>
  createdAt: Timestamp | null
  respondedAt: Timestamp | null
}

export interface Read extends ReadDoc {
  id: string
}

/** The other reader's denormalized identity, relative to me. */
export interface ReadBuddy {
  uid: string
  displayName: string | null
  photoURL: string | null
}

/** Send a buddy-read request: snapshot the book, address it to a friend. */
export async function sendReadRequest(
  me: User,
  buddy: ReadBuddy,
  book: ReadBook,
): Promise<void> {
  await addDoc(collection(db, 'reads'), {
    participants: [me.uid, buddy.uid],
    fromUid: me.uid,
    toUid: buddy.uid,
    fromName: me.displayName,
    fromPhotoURL: me.photoURL,
    toName: buddy.displayName,
    toPhotoURL: buddy.photoURL,
    book,
    status: 'pending',
    progress: {},
    createdAt: serverTimestamp(),
    respondedAt: null,
  })
}

/** Recipient accepts — the request becomes an active read. */
export async function acceptReadRequest(id: string): Promise<void> {
  await updateDoc(doc(db, 'reads', id), {
    status: 'active',
    respondedAt: serverTimestamp(),
  })
}

/** Decline, cancel, or leave — all the same single delete. */
export async function removeRead(id: string): Promise<void> {
  await deleteDoc(doc(db, 'reads', id))
}

/** Set up my side of an active read: my edition, its length, where I'm starting. */
export async function setupMyProgress(
  id: string,
  uid: string,
  edition: string,
  totalPages: number,
  startPage = 0,
): Promise<void> {
  await updateDoc(doc(db, 'reads', id), {
    [`progress.${uid}`]: {
      edition,
      totalPages,
      currentPage: startPage,
      note: null,
      mood: null,
      updatedAt: serverTimestamp(),
      noteAt: null,
    },
  })
}

/** Log tonight's pages: move my bookmark, optionally leave a line and a mood. */
export async function logMyProgress(
  id: string,
  uid: string,
  currentPage: number,
  note?: string | null,
  mood?: string | null,
): Promise<void> {
  const trimmed = note?.trim() || null
  await updateDoc(doc(db, 'reads', id), {
    [`progress.${uid}.currentPage`]: currentPage,
    [`progress.${uid}.updatedAt`]: serverTimestamp(),
    [`progress.${uid}.mood`]: mood ?? null,
    ...(trimmed
      ? { [`progress.${uid}.note`]: trimmed, [`progress.${uid}.noteAt`]: serverTimestamp() }
      : {}),
  })
}

/** What a reader sets when they close the book. */
export interface Verdict {
  rating: number | null
  review: string | null
  favorite: boolean
  dnf: boolean
}

/**
 * Close the book on my side: write my verdict under `finish[uid]`. A true
 * finish also completes my bookmark (so the split card reads 100%); setting a
 * book down leaves the bookmark where it lay. Both touch only my own keys, so
 * the same own-key-only rule that guards `progress` covers this.
 */
export async function finishRead(
  id: string,
  uid: string,
  verdict: Verdict,
  completeTo?: number | null,
): Promise<void> {
  const review = verdict.review?.trim() || null
  await updateDoc(doc(db, 'reads', id), {
    [`finish.${uid}`]: {
      rating: verdict.dnf ? null : verdict.rating,
      review,
      favorite: verdict.dnf ? false : verdict.favorite,
      dnf: verdict.dnf,
      finishedAt: serverTimestamp(),
    },
    ...(!verdict.dnf && completeTo
      ? {
          [`progress.${uid}.currentPage`]: completeTo,
          [`progress.${uid}.updatedAt`]: serverTimestamp(),
        }
      : {}),
  })
}

/** Reopen a read I'd closed — only meaningful while my verdict is still sealed
 *  (the buddy hasn't finished). Clears my `finish` entry. */
export async function reopenRead(id: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'reads', id), {
    [`finish.${uid}`]: deleteField(),
  })
}

/** My closing verdict, if I've closed the book. */
export function finishFor(read: Read, uid: string): FinishEntry | null {
  return read.finish?.[uid] ?? null
}

/** Both readers have closed the book — the read is finished, a shared keepsake. */
export function bothFinished(read: Read): boolean {
  const f = read.finish
  return !!f && !!f[read.fromUid] && !!f[read.toUid]
}

/** The other reader, relative to me. */
export function otherReader(read: Read, myUid: string): ReadBuddy {
  const isFrom = read.fromUid === myUid
  return {
    uid: isFrom ? read.toUid : read.fromUid,
    displayName: isFrom ? read.toName : read.fromName,
    photoURL: isFrom ? read.toPhotoURL : read.fromPhotoURL,
  }
}

/** Fraction read (0–1) for one reader, or null if they haven't set up yet. */
export function fractionFor(read: Read, uid: string): number | null {
  const p = read.progress?.[uid]
  if (!p || !p.totalPages) return null
  return Math.max(0, Math.min(1, p.currentPage / p.totalPages))
}
