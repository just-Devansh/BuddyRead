import { createContext } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

/**
 * The colour palette, orthogonal to light/dark. 'warm' is the original
 * terracotta-and-gold on parchment/espresso; 'lavender' swaps the accent and the
 * lamplight to a warm plum/lilac. Each palette still has a light and a dark face.
 */
export type Palette = 'warm' | 'lavender'

export interface ThemeContextValue {
  /** The user's stored preference. */
  preference: ThemePreference
  /** What's actually painted right now, after resolving 'system'. */
  resolved: 'light' | 'dark'
  setPreference: (next: ThemePreference) => void
  /** The chosen colour palette (warm | lavender). */
  palette: Palette
  setPalette: (next: Palette) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
