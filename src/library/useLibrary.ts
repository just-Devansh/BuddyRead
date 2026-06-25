import { useContext } from 'react'
import { LibraryContext } from './library-context'

/** The signed-in reader's live library. Must sit under LibraryProvider. */
export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within a LibraryProvider')
  return ctx
}
