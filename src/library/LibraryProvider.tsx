import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/useAuth'
import type { LibraryDoc, LibraryItem } from '../lib/library'
import { LibraryContext } from './library-context'

/**
 * One live listener over the signed-in reader's own library
 * (`users/{uid}/library`). Mounted behind RequireAuth, so `user` exists. A
 * buddy's library is fetched on demand (see `fetchLibrary`), not subscribed.
 */
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'library'),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LibraryDoc) })))
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
  }, [user])

  const value = useMemo(() => ({ items, loading, error }), [items, loading, error])

  return <LibraryContext value={value}>{children}</LibraryContext>
}
