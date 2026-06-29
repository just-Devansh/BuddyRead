import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { useTheme } from './useTheme'
import { updateUserNumerals, updateUserPalette, updateUserTheme } from '../lib/users'
import type { Numerals } from './theme-context'

const NUMERAL_OPTIONS: Numerals[] = ['spectral', 'garamond', 'cormorant']
/** Coerce a stored value to a valid choice — heals a retired one (e.g. 'mono'). */
const toNumerals = (v: Numerals | undefined): Numerals =>
  v && NUMERAL_OPTIONS.includes(v) ? v : 'spectral'

/**
 * Bridges the per-device theme + palette + numerals (ThemeProvider/localStorage)
 * with the account's stored choices (`users/{uid}.theme`, `.palette`,
 * `.numerals`). On sign-in the account wins once; after that, local toggles are
 * written back up so the preference follows the reader to their other device.
 * Renders nothing.
 */
export function ThemeSync() {
  const { user, userDoc } = useAuth()
  const { preference, setPreference, palette, setPalette, numerals, setNumerals } =
    useTheme()
  const hydratedForUid = useRef<string | null>(null)

  // Adopt the account's theme + palette + numerals once per signed-in session.
  useEffect(() => {
    if (!user || !userDoc) return
    if (hydratedForUid.current === user.uid) return
    hydratedForUid.current = user.uid
    if (userDoc.theme !== preference) setPreference(userDoc.theme)
    const accountPalette = userDoc.palette ?? 'warm'
    if (accountPalette !== palette) setPalette(accountPalette)
    const accountNumerals = toNumerals(userDoc.numerals)
    if (accountNumerals !== numerals) setNumerals(accountNumerals)
  }, [
    user,
    userDoc,
    preference,
    setPreference,
    palette,
    setPalette,
    numerals,
    setNumerals,
  ])

  // Once adopted, persist subsequent local changes back to the account.
  useEffect(() => {
    if (!user || !userDoc) return
    if (hydratedForUid.current !== user.uid) return
    if (preference !== userDoc.theme) void updateUserTheme(user.uid, preference)
  }, [user, userDoc, preference])

  useEffect(() => {
    if (!user || !userDoc) return
    if (hydratedForUid.current !== user.uid) return
    if (palette !== (userDoc.palette ?? 'warm')) void updateUserPalette(user.uid, palette)
  }, [user, userDoc, palette])

  useEffect(() => {
    if (!user || !userDoc) return
    if (hydratedForUid.current !== user.uid) return
    if (numerals !== toNumerals(userDoc.numerals))
      void updateUserNumerals(user.uid, numerals)
  }, [user, userDoc, numerals])

  return null
}
