import { createContext } from 'react'
import type { Read } from '../lib/reads'

export interface ReadsContextValue {
  /** Accepted, ongoing buddy reads — what's on your shelf. */
  active: Read[]
  /** Read requests sent to me, awaiting my response. */
  incoming: Read[]
  /** Read requests I've sent, awaiting theirs. */
  outgoing: Read[]
  loading: boolean
  error: string | null
}

export const ReadsContext = createContext<ReadsContextValue | null>(null)
