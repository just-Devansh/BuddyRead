import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Splash } from '../components/Splash'
import { FriendsProvider } from '../friends/FriendsProvider'
import { ReadsProvider } from '../reads/ReadsProvider'
import { LibraryProvider } from '../library/LibraryProvider'

/**
 * Route guard for signed-in screens. Waits for auth to resolve (avoids a
 * flash of the welcome screen on reload), then sends signed-out readers to the
 * landing page. Signed-in screens share one FriendsProvider + ReadsProvider.
 */
export function RequireAuth() {
  const { user, loading } = useAuth()

  // Hold the splash at least 3s so its quote is actually readable, even when
  // auth resolves in a blink.
  const [quoteTime, setQuoteTime] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setQuoteTime(true), 3000)
    return () => clearTimeout(t)
  }, [])

  if (loading || !quoteTime) return <Splash />
  if (!user) return <Navigate to="/" replace />
  return (
    <FriendsProvider>
      <ReadsProvider>
        <LibraryProvider>
          <Outlet />
        </LibraryProvider>
      </ReadsProvider>
    </FriendsProvider>
  )
}
