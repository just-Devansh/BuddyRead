import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { useTheme } from './useTheme'
import { updateUserTheme } from '../lib/users'

/**
 * Bridges the per-device theme (ThemeProvider/localStorage) with the account's
 * stored theme (`users/{uid}.theme`). On sign-in the account choice wins once;
 * after that, local toggles are written back up so the preference follows the
 * reader to their other device. Renders nothing.
 */
export function ThemeSync() {
  const { user, userDoc } = useAuth()
  const { preference, setPreference } = useTheme()
  const hydratedForUid = useRef<string | null>(null)

  // Adopt the account's theme once per signed-in session.
  useEffect(() => {
    if (!user || !userDoc) return
    if (hydratedForUid.current === user.uid) return
    hydratedForUid.current = user.uid
    if (userDoc.theme !== preference) setPreference(userDoc.theme)
  }, [user, userDoc, preference, setPreference])

  // Once adopted, persist subsequent local changes back to the account.
  useEffect(() => {
    if (!user || !userDoc) return
    if (hydratedForUid.current !== user.uid) return
    if (preference !== userDoc.theme) void updateUserTheme(user.uid, preference)
  }, [user, userDoc, preference])

  return null
}
