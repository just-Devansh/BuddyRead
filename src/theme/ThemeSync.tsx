import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { useTheme } from './useTheme'
import { updateUserPalette, updateUserTheme } from '../lib/users'

/**
 * Bridges the per-device theme + palette (ThemeProvider/localStorage) with the
 * account's stored choices (`users/{uid}.theme`, `.palette`). On sign-in the
 * account wins once; after that, local toggles are written back up so the
 * preference follows the reader to their other device. Renders nothing.
 */
export function ThemeSync() {
  const { user, userDoc } = useAuth()
  const { preference, setPreference, palette, setPalette } = useTheme()
  const hydratedForUid = useRef<string | null>(null)

  // Adopt the account's theme + palette once per signed-in session.
  useEffect(() => {
    if (!user || !userDoc) return
    if (hydratedForUid.current === user.uid) return
    hydratedForUid.current = user.uid
    if (userDoc.theme !== preference) setPreference(userDoc.theme)
    const accountPalette = userDoc.palette ?? 'warm'
    if (accountPalette !== palette) setPalette(accountPalette)
  }, [user, userDoc, preference, setPreference, palette, setPalette])

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

  return null
}
