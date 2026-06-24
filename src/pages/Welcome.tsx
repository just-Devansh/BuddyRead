import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Ornament } from '../components/Ornament'
import { Crowns } from '../components/Crowns'
import { ThemeToggle } from '../theme/ThemeToggle'
import { useAuth } from '../auth/useAuth'

/**
 * The signed-out landing. Quietly handsome on purpose — it sets the tone before
 * anyone reads a word: a reading compact, established. The CTA is Google sign-in;
 * a signed-in reader who lands here is sent straight to their shelf. Lives inside
 * the DeviceFrame.
 */
export function Welcome() {
  const { user, loading, error, signInWithGoogle } = useAuth()
  const [signingIn, setSigningIn] = useState(false)

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
          className="mt-10 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-accent px-7 py-3.5 font-medium text-accent-contrast transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
        >
          {busy ? 'One moment…' : 'Continue with Google'}
        </button>

        <p className="mt-5 text-sm text-text-muted">
          New here? Signing in makes your account.
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
