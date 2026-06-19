import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../theme/ThemeToggle'
import { useAuth } from '../auth/useAuth'

/**
 * The signed-out landing. Quietly handsome on purpose — it sets the tone before
 * anyone reads a word. The CTA is Google sign-in; a signed-in reader who lands
 * here is sent straight to their shelf. Lives inside the DeviceFrame.
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
      <header className="flex items-center justify-between px-5 py-3 ipad:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="mb-5 text-sm uppercase tracking-[0.2em] text-text-muted">
          A reading ritual for two
        </p>
        <h1 className="font-display text-4xl leading-tight text-text ipad:text-5xl">
          Read the same book,
          <br />
          <span className="text-accent">across the distance.</span>
        </h1>
        <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-text-muted">
          No streaks, no leaderboards, no one racing ahead. Just you, a friend,
          and a book — and a quiet card that keeps you company.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={busy}
          className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 font-medium text-accent-contrast transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
        >
          {busy ? 'One moment…' : 'Continue with Google'}
        </button>

        {error && (
          <p className="mt-4 max-w-sm text-pretty text-sm text-text-muted">
            That didn't take — {error}. Mind trying again?
          </p>
        )}
      </main>

      <footer className="px-5 py-6 text-center text-xs text-text-muted">
        Made for two readers, one in Gurgaon and one in Hyderabad.
      </footer>
    </div>
  )
}
