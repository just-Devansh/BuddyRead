import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Eyebrow } from '../components/Eyebrow'
import { ThemeToggle } from '../theme/ThemeToggle'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'

/** One headline number with its quiet mono caption. */
function Stat({ value, label, divide }: { value: string; label: string; divide?: boolean }) {
  return (
    <div className={`flex-1 text-center ${divide ? 'border-r border-border' : ''}`}>
      <div className="font-display text-3xl font-semibold text-text">{value}</div>
      <Eyebrow className="mt-1 block">{label}</Eyebrow>
    </div>
  )
}

export function Profile() {
  const { user, userDoc, error, signOut } = useAuth()
  const { friends } = useFriends()
  const { active } = useReads()
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

  const name = userDoc?.displayName ?? user?.displayName ?? 'Reader'
  const handle = userDoc?.username ? `@${userDoc.username}` : user?.email ?? ''

  return (
    <AppShell>
      {/* Identity */}
      <section className="flex flex-col items-center text-center">
        <Avatar
          src={user?.photoURL}
          name={name}
          tone={user?.photoURL ? undefined : 'terracotta'}
          size="h-20 w-20"
          className="text-4xl shadow-[0_10px_24px_-12px_rgba(111,61,48,0.7)]"
        />
        <h1 className="mt-4 font-display text-3xl text-text">{name}</h1>
        {handle && (
          <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-text-muted">
            {handle}
          </p>
        )}

        <button
          type="button"
          onClick={copyInvite}
          disabled={!userDoc?.inviteCode}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-dashed border-border bg-surface-alt px-4 py-2 transition-colors hover:border-accent/50 disabled:opacity-50"
        >
          <span className="font-mono text-sm tracking-[0.16em] text-accent">
            {userDoc?.inviteCode ?? '••••••'}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-faint">
            {copied ? '✓ copied' : '⧉ copy'}
          </span>
        </button>
      </section>

      {error && (
        <p className="mt-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          Something went sideways loading your profile: {error}
        </p>
      )}

      {/* Stats — reading & buddies are live; finished reads aren't tracked yet. */}
      <section className="mt-7 flex">
        <Stat value="0" label="read" divide />
        <Stat value={String(active.length)} label="reading" divide />
        <Stat value={String(friends.length)} label="buddies" />
      </section>

      {/* Appearance */}
      <section className="mt-7 flex items-center justify-between rounded-2xl border border-border bg-surface p-5">
        <div>
          <h2 className="font-display text-xl text-text">Appearance</h2>
          <p className="mt-0.5 text-sm text-text-muted">
            Follows you to your other device.
          </p>
        </div>
        <ThemeToggle />
      </section>

      {/* Sign out */}
      <div className="mt-7">
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
