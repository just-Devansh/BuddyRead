import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Ornament } from '../components/Ornament'
import { Crowns } from '../components/Crowns'
import { Splash } from '../components/Splash'
import { ThemeToggle } from '../theme/ThemeToggle'
import { useAuth } from '../auth/useAuth'

/** Google's four-colour "G", tucked into a white chip on the sign-in button so
 *  the CTA reads as a real Google sign-in without breaking the parchment palette. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="13" height="13" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/**
 * The signed-out landing. Quietly handsome on purpose — it sets the tone before
 * anyone reads a word: a reading compact, established. The CTA is Google sign-in;
 * a signed-in reader who lands here is sent straight to their shelf. Lives inside
 * the DeviceFrame.
 */
export function Welcome() {
  const { user, loading, error, signInWithGoogle } = useAuth()
  const [signingIn, setSigningIn] = useState(false)

  // Until auth resolves, hold the splash — never flash the signin page at a
  // reader who's actually signed in.
  if (loading) return <Splash />
  if (user) return <Navigate to="/home" replace />

  const handleSignIn = async () => {
    setSigningIn(true)
    await signInWithGoogle()
    setSigningIn(false)
  }

  const busy = signingIn || loading

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-end px-5 py-3 ipad:px-8">
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <Crowns className="mb-5 w-60 text-accent/75 ipad:w-72" />
        <h1 className="font-display text-6xl font-semibold leading-none text-text">
          Buddy<span className="text-accent">Read</span>
        </h1>
        <p className="mt-3 font-display text-xl italic text-text-muted">
          Read apart. Together.
        </p>

        <Ornament rules className="my-8" />

        <p className="max-w-xs text-pretty text-base leading-relaxed text-text-muted">
          Read the same book as a friend, and watch each other's bookmarks inch
          along.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={busy}
          className="group mt-10 inline-flex w-full max-w-xs items-center justify-center gap-3 rounded-xl bg-accent px-7 py-3.5 font-medium text-accent-contrast shadow-[0_14px_30px_-16px_rgba(111,61,48,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_18px_34px_-16px_rgba(111,61,48,0.9)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {busy ? (
            'One moment…'
          ) : (
            <>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <GoogleMark />
              </span>
              Continue with Google
            </>
          )}
        </button>

        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">
          New here? Signing in makes your account
        </p>

        {error && (
          <p className="mt-4 max-w-sm text-pretty text-sm text-text-muted">
            That didn't take — {error}. Mind trying again?
          </p>
        )}
      </main>

      <footer className="py-7" />
    </div>
  )
}
