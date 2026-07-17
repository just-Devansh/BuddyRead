import { createContext } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

/**
 * The colour palette, orthogonal to light/dark. 'warm' is the original
 * terracotta-and-gold on parchment/espresso; 'lavender' swaps the accent and the
 * lamplight to a warm plum/lilac (each still has a light and a dark face).
 * 'starry' is the always-night USP theme — a violet starry sky on the main
 * screens with a moon in place of the nook lamp; it forces the dark face on
 * regardless of the light/dark preference.
 */
export type Palette = 'warm' | 'lavender' | 'starry'

/**
 * The font for *value* numbers (ratings, reading pace, counts) — orthogonal to
 * theme and palette. 'spectral' (a screen-reading serif) is the default; the
 * others reuse fonts the app already loads. Date/meta micro-labels stay mono.
 */
export type Numerals = 'spectral' | 'garamond' | 'cormorant'

export interface ThemeContextValue {
  /** The user's stored preference. */
  preference: ThemePreference
  /** What's actually painted right now, after resolving 'system'. */
  resolved: 'light' | 'dark'
  setPreference: (next: ThemePreference) => void
  /** The chosen colour palette (warm | lavender). */
  palette: Palette
  setPalette: (next: Palette) => void
  /** The chosen numeral font (spectral | garamond | cormorant | mono). */
  numerals: Numerals
  setNumerals: (next: Numerals) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
