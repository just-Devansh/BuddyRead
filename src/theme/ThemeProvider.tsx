import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ThemeContext,
  type Numerals,
  type Palette,
  type ThemePreference,
} from './theme-context'

const STORAGE_KEY = 'buddyread:theme'
const PALETTE_KEY = 'buddyread:palette'
const NUMERALS_KEY = 'buddyread:numerals'
const NUMERAL_OPTIONS: Numerals[] = ['spectral', 'garamond', 'cormorant']
const PALETTE_OPTIONS: Palette[] = ['warm', 'lavender', 'starry']

function readStoredPreference(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system'
    ? stored
    : 'system'
}

function readStoredPalette(): Palette {
  if (typeof localStorage === 'undefined') return 'warm'
  const stored = localStorage.getItem(PALETTE_KEY)
  return PALETTE_OPTIONS.includes(stored as Palette) ? (stored as Palette) : 'warm'
}

function readStoredNumerals(): Numerals {
  if (typeof localStorage === 'undefined') return 'spectral'
  const stored = localStorage.getItem(NUMERALS_KEY)
  return NUMERAL_OPTIONS.includes(stored as Numerals)
    ? (stored as Numerals)
    : 'spectral'
}

function systemPrefersDark(): boolean {
  return (
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-color-scheme: dark)').matches
  )
}

/**
 * Owns the theme preference and keeps the `.dark` class on <html> in sync.
 * For v0 this persists to localStorage; once a user doc exists (M1) we mirror
 * `users/{uid}.theme` into here so the choice follows the reader across devices.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readStoredPreference)
  const [palette, setPaletteState] = useState<Palette>(readStoredPalette)
  const [numerals, setNumeralsState] = useState<Numerals>(readStoredNumerals)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  // Track the OS setting so 'system' stays honest without a reload.
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: 'light' | 'dark' =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  // Starry Night is inherently nocturnal — it forces the dark face on so every
  // `.dark` component tweak engages, whatever the reader's light/dark preference
  // (that preference is preserved and re-applies the moment they leave starry).
  const painted: 'light' | 'dark' = palette === 'starry' ? 'dark' : resolved

  // Paint it.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', painted === 'dark')
    root.style.colorScheme = painted
  }, [painted])

  // Paint the palette — a single class on <html> swaps every accent/lamp token.
  // Only one palette class is ever present (warm is the tokenless default).
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('palette-lavender', palette === 'lavender')
    root.classList.toggle('palette-starry', palette === 'starry')
  }, [palette])

  // Paint the numeral font — one `.num-*` class on <html> picks the family +
  // figure style every `.numeral` span consumes.
  useEffect(() => {
    const root = document.documentElement
    NUMERAL_OPTIONS.forEach((n) => root.classList.toggle(`num-${n}`, n === numerals))
  }, [numerals])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode / storage disabled — preference just won't persist.
    }
  }, [])

  const setPalette = useCallback((next: Palette) => {
    setPaletteState(next)
    try {
      localStorage.setItem(PALETTE_KEY, next)
    } catch {
      // Private mode / storage disabled — palette just won't persist.
    }
  }, [])

  const setNumerals = useCallback((next: Numerals) => {
    setNumeralsState(next)
    try {
      localStorage.setItem(NUMERALS_KEY, next)
    } catch {
      // Private mode / storage disabled — choice just won't persist.
    }
  }, [])

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference,
      palette,
      setPalette,
      numerals,
      setNumerals,
    }),
    [
      preference,
      resolved,
      setPreference,
      palette,
      setPalette,
      numerals,
      setNumerals,
    ],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
