import { useContext } from 'react'
import { ReadsContext } from './reads-context'

export function useReads() {
  const ctx = useContext(ReadsContext)
  if (!ctx) throw new Error('useReads must be used within a ReadsProvider')
  return ctx
}
