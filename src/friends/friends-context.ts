import { createContext } from 'react'
import type { Relationship } from '../lib/friends'

export interface FriendsContextValue {
  /** Accepted relationships — your reading circle. */
  friends: Relationship[]
  /** Pending requests sent to me, awaiting my response. */
  incoming: Relationship[]
  /** Pending requests I've sent, awaiting theirs. */
  outgoing: Relationship[]
  loading: boolean
  error: string | null
}

export const FriendsContext = createContext<FriendsContextValue | null>(null)
