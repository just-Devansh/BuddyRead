import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Usernames. Uniqueness is enforced the same way invite codes are: a claim doc
 * at `usernames/{name}` holding the owner's uid. Changing is a transaction —
 * check the cooldown, ensure the new name is free, claim it, release the old —
 * so two readers can't land on the same handle. Editable once every 30 days.
 */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000

export class UsernameError extends Error {}

/** Lowercase, strip anything but a–z, 0–9, underscore. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
}

/** A human reason the handle is invalid, or null if it's fine. */
export function usernameError(name: string): string | null {
  if (name.length < 3) return 'At least 3 characters.'
  if (name.length > 20) return 'At most 20 characters.'
  if (!USERNAME_RE.test(name)) return 'Letters, numbers and underscores only.'
  return null
}

/** ms until the handle may change again (0 = free to change now). */
export function cooldownRemaining(last: Timestamp | null | undefined): number {
  if (!last) return 0
  return Math.max(0, COOLDOWN_MS - (Date.now() - last.toMillis()))
}

export const daysFromMs = (ms: number) => Math.ceil(ms / (24 * 60 * 60 * 1000))

/** Is this handle free (or already mine)? For the live availability hint. */
export async function isUsernameFree(name: string, myUid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', name))
  return !snap.exists() || (snap.data() as { uid: string }).uid === myUid
}

/**
 * Claim `next` for `uid`, releasing the old handle. Throws UsernameError with a
 * friendly message on invalid input, an active cooldown, or a taken handle.
 */
export async function changeUsername(uid: string, raw: string): Promise<string> {
  const next = normalizeUsername(raw)
  const reason = usernameError(next)
  if (reason) throw new UsernameError(reason)

  await runTransaction(db, async (tx) => {
    const userRef = doc(db, 'users', uid)
    const newRef = doc(db, 'usernames', next)

    // All reads first.
    const userSnap = await tx.get(userRef)
    if (!userSnap.exists()) throw new UsernameError('Your profile is still loading — try again.')
    const data = userSnap.data() as { username?: string; usernameUpdatedAt?: Timestamp | null }

    if (data.username === next) throw new UsernameError("That's already your username.")

    const remaining = cooldownRemaining(data.usernameUpdatedAt)
    if (remaining > 0) {
      const d = daysFromMs(remaining)
      throw new UsernameError(`You can change your username again in ${d} day${d > 1 ? 's' : ''}.`)
    }

    const newSnap = await tx.get(newRef)
    if (newSnap.exists() && (newSnap.data() as { uid: string }).uid !== uid) {
      throw new UsernameError('That username is taken.')
    }

    const old = data.username
    const oldSnap = old ? await tx.get(doc(db, 'usernames', old)) : null

    // Then writes.
    if (old && oldSnap?.exists() && (oldSnap.data() as { uid: string }).uid === uid) {
      tx.delete(doc(db, 'usernames', old))
    }
    tx.set(newRef, { uid })
    tx.update(userRef, { username: next, usernameUpdatedAt: serverTimestamp() })
  })

  return next
}
