import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Splash } from '../components/Splash'

/**
 * Route guard for signed-in screens. Waits for auth to resolve (avoids a
 * flash of the welcome screen on reload), then sends signed-out readers to the
 * landing page.
 */
export function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) return <Splash />
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}
