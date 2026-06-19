import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { ThemeToggle } from '../theme/ThemeToggle'
import { useAuth } from '../auth/useAuth'

export function Profile() {
  const { user, userDoc, error, signOut } = useAuth()
  const [copied, setCopied] = useState(false)

  const copyInvite = async () => {
    if (!userDoc?.inviteCode) return
    try {
      await navigator.clipboard.writeText(userDoc.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked — the code is on screen to copy by hand.
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-text">Profile</h1>

      {/* Identity */}
      <section className="mt-6 flex items-center gap-4">
        <Avatar
          src={user?.photoURL}
          name={userDoc?.displayName ?? user?.displayName}
          size="h-16 w-16"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-xl text-text">
            {userDoc?.displayName ?? user?.displayName ?? 'Reader'}
          </p>
          <p className="truncate text-sm text-text-muted">
            {user?.email ?? ''}
          </p>
        </div>
      </section>

      {error && (
        <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          Something went sideways loading your profile: {error}
        </p>
      )}

      {/* Invite code */}
      <section className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-text">Your invite code</h2>
        <p className="mt-1 text-sm text-text-muted">
          Share this with a friend so they can read alongside you.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="rounded-xl border border-border bg-surface-alt px-4 py-2.5 font-display text-2xl tracking-[0.2em] text-text">
            {userDoc?.inviteCode ?? '••••••'}
          </span>
          <button
            type="button"
            onClick={copyInvite}
            disabled={!userDoc?.inviteCode}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-alt disabled:opacity-50"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </section>

      {/* Appearance */}
      <section className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface p-5">
        <div>
          <h2 className="font-display text-lg text-text">Appearance</h2>
          <p className="mt-1 text-sm text-text-muted">
            Follows you to your other device.
          </p>
        </div>
        <ThemeToggle />
      </section>

      {/* Sign out */}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-text"
        >
          Sign out
        </button>
      </div>
    </AppShell>
  )
}
