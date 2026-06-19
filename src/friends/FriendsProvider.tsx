import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/useAuth'
import type { FriendRequestDoc, Relationship } from '../lib/friends'
import { FriendsContext } from './friends-context'

/**
 * One live listener over every relationship that involves me
 * (`participants array-contains uid`), partitioned client-side into friends /
 * incoming / outgoing. Filtering by `participants` alone keeps this on a
 * single-field index — no composite index needed — and partitioning in JS
 * avoids three separate listeners. Mounted behind RequireAuth, so `user` exists.
 */
export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'friendRequests'),
      where('participants', 'array-contains', user.uid),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRelationships(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as FriendRequestDoc) })),
        )
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
    const friends = relationships.filter((r) => r.status === 'accepted')
    const incoming = relationships.filter(
      (r) => r.status === 'pending' && r.toUid === uid,
    )
    const outgoing = relationships.filter(
      (r) => r.status === 'pending' && r.fromUid === uid,
    )
    // Newest first, by creation time (sorted here, not in the query).
    const byNewest = (a: Relationship, b: Relationship) =>
      (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
    return {
      friends: friends.sort(byNewest),
      incoming: incoming.sort(byNewest),
      outgoing: outgoing.sort(byNewest),
      loading,
      error,
    }
  }, [relationships, user, loading, error])

  return <FriendsContext value={value}>{children}</FriendsContext>
}
