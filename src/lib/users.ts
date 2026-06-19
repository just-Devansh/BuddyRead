import type { User } from 'firebase/auth'
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { generateInviteCode } from './inviteCode'
import type { ThemePreference } from '../theme/theme-context'

/** Shape of a `users/{uid}` document. */
export interface UserDoc {
  displayName: string | null
  email: string | null
  photoURL: string | null
  username: string // lowercase; default for now, real search is v1
  inviteCode: string // short, unique, human-typeable
  theme: ThemePreference
  createdAt: Timestamp | null
}

/** Strip a display name down to a safe default username. */
function defaultUsername(user: User): string {
  const base = (user.displayName ?? user.email ?? 'reader')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20)
  return base || 'reader'
}

/**
 * Reserve a unique invite code via an `inviteCodes/{code}` lookup doc. The
 * transaction guarantees no two users land on the same code, and the doc gives
 * M2's "add by invite code" a rule-friendly lookup (code -> uid) without
 * opening the whole users collection to listing.
 */
async function claimInviteCode(uid: string): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateInviteCode()
    const ref = doc(db, 'inviteCodes', code)
    const claimed = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      if (snap.exists()) return false
      tx.set(ref, { uid, createdAt: serverTimestamp() })
      return true
    })
    if (claimed) return code
  }
  throw new Error('Could not allocate a unique invite code; please retry.')
}

/**
 * Create the user's doc on first sign-in (idempotent). Snapshots the Google
 * profile, assigns a unique invite code, and defaults theme to 'system'.
 */
export async function ensureUserDoc(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return

  const inviteCode = await claimInviteCode(user.uid)
  // Note: createdAt is written as a server timestamp (a FieldValue), which is
  // why this isn't typed directly as UserDoc — it resolves to a Timestamp on read.
  await setDoc(ref, {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    username: defaultUsername(user),
    inviteCode,
    theme: 'system' as const,
    createdAt: serverTimestamp(),
  })
}

/** Persist a theme choice to the account so it can follow the reader. */
export async function updateUserTheme(
  uid: string,
  theme: ThemePreference,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { theme })
}
