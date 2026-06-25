import { createContext } from 'react'
import type { LibraryItem } from '../lib/library'

export interface LibraryContextValue {
  /** Every book the signed-in reader has shelved, live. */
  items: LibraryItem[]
  loading: boolean
  error: string | null
}

export const LibraryContext = createContext<LibraryContextValue | null>(null)
