import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext, type Palette, type ThemePreference } from './theme-context'

const STORAGE_KEY = 'buddyread:theme'
const PALETTE_KEY = 'buddyread:palette'

function readStoredPreference(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system'
    ? stored
    : 'system'
}

function readStoredPalette(): Palette {
  if (typeof localStorage === 'undefined') return 'warm'
  return localStorage.getItem(PALETTE_KEY) === 'lavender' ? 'lavender' : 'warm'
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

  // Paint it.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.style.colorScheme = resolved
  }, [resolved])

  // Paint the palette — a single class on <html> swaps every accent/lamp token.
  useEffect(() => {
    document.documentElement.classList.toggle('palette-lavender', palette === 'lavender')
  }, [palette])

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

  const value = useMemo(
    () => ({ preference, resolved, setPreference, palette, setPalette }),
    [preference, resolved, setPreference, palette, setPalette],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
