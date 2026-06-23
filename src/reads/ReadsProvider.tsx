import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/useAuth'
import type { Read, ReadDoc } from '../lib/reads'
import { ReadsContext } from './reads-context'

/**
 * One live listener over every read that involves me
 * (`participants array-contains uid`), partitioned client-side into active /
 * incoming / outgoing — the same single-field-index shape as FriendsProvider.
 * Mounted behind RequireAuth, so `user` exists.
 */
export function ReadsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [reads, setReads] = useState<Read[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'reads'),
      where('participants', 'array-contains', user.uid),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReads(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ReadDoc) })))
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
  }, [user])

  const value = useMemo(() => {
    const uid = user?.uid
    const active = reads.filter((r) => r.status === 'active')
    const incoming = reads.filter(
      (r) => r.status === 'pending' && r.toUid === uid,
    )
    const outgoing = reads.filter(
      (r) => r.status === 'pending' && r.fromUid === uid,
    )
    const byNewest = (a: Read, b: Read) =>
      (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
    return {
      active: active.sort(byNewest),
      incoming: incoming.sort(byNewest),
      outgoing: outgoing.sort(byNewest),
      loading,
      error,
    }
  }, [reads, user, loading, error])

  return <ReadsContext value={value}>{children}</ReadsContext>
}
