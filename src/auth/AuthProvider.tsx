import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'
import { ensureUserDoc, type UserDoc } from '../lib/users'
import { AuthContext } from './auth-context'

/**
 * Owns auth state. On sign-in it makes sure the `users/{uid}` doc exists, then
 * subscribes to it live (so theme / invite code stay current). The user-doc
 * listener is torn down and rebuilt as the signed-in user changes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const docUnsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const stopDocListener = () => {
      docUnsubRef.current?.()
      docUnsubRef.current = null
    }

    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      stopDocListener()
      setUser(nextUser)

      if (!nextUser) {
        setUserDoc(null)
        setLoading(false)
        return
      }

      try {
        await ensureUserDoc(nextUser)
        docUnsubRef.current = onSnapshot(
          doc(db, 'users', nextUser.uid),
          (snap) => {
            setUserDoc(snap.exists() ? (snap.data() as UserDoc) : null)
            setLoading(false)
          },
          (err) => {
            setError(err.message)
            setLoading(false)
          },
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
        setLoading(false)
      }
    })

    return () => {
      unsubAuth()
      stopDocListener()
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      // A closed popup isn't an error worth shouting about.
      const code = (err as { code?: string }).code
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        return
      }
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    }
  }, [])

  const signOut = useCallback(async () => {
    await fbSignOut(auth)
  }, [])

  const value = useMemo(
    () => ({ user, userDoc, loading, error, signInWithGoogle, signOut }),
    [user, userDoc, loading, error, signInWithGoogle, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
