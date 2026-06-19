import { createContext } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  /** The user's stored preference. */
  preference: ThemePreference
  /** What's actually painted right now, after resolving 'system'. */
  resolved: 'light' | 'dark'
  setPreference: (next: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
