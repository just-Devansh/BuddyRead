import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Eyebrow } from '../components/Eyebrow'
import { ProgressBar } from '../components/ProgressBar'
import { ThemeToggle } from '../theme/ThemeToggle'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { DEMO_READ, fraction } from '../demo/coread'

/** One headline number with its quiet mono caption. */
function Stat({ value, label, divide }: { value: string; label: string; divide?: boolean }) {
  return (
    <div className={`flex-1 text-center ${divide ? 'border-r border-border' : ''}`}>
      <div className="font-display text-3xl font-semibold text-text">{value}</div>
      <Eyebrow className="mt-1 block">{label}</Eyebrow>
    </div>
  )
}

/** A named shelf with its count. */
function Shelf({ count, label, to }: { count: number; label: string; to?: string }) {
  const inner = (
    <>
      <div className="font-display text-2xl font-semibold text-text">{count}</div>
      <div className="mt-0.5 text-sm text-text-muted">{label}</div>
    </>
  )
  const cls =
    'flex-1 rounded-xl border border-border bg-surface p-4 transition-colors'
  return to ? (
    <Link to={to} className={`${cls} hover:border-accent/40`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export function Profile() {
  const { user, userDoc, error, signOut } = useAuth()
  const { friends } = useFriends()
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
        <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-text-muted">
          {handle} · Gurgaon
        </p>

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

      {/* Stats */}
      <section className="mt-7 flex">
        <Stat value="42" label="read" divide />
        <Stat value="1" label="reading" divide />
        <Stat value={String(friends.length)} label="buddies" />
      </section>

      {/* Reading now */}
      <section className="mt-7">
        <Eyebrow className="mb-3 block">Reading now</Eyebrow>
        <Link
          to="/read"
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 transition-colors hover:border-accent/40"
        >
          <div
            className="flex h-[62px] w-[42px] shrink-0 items-center justify-center rounded-sm px-1 text-center"
            style={{ background: 'linear-gradient(160deg,#46503a,#353d2c)' }}
          >
            <span className="font-display text-[8px] font-medium leading-tight text-[#d8c79a]">
              {DEMO_READ.title}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-tight text-text">
              {DEMO_READ.title}
            </p>
            <p className="text-sm text-text-muted">
              with {DEMO_READ.buddy.name} · {Math.round(fraction(DEMO_READ.you) * 100)}%
            </p>
            <ProgressBar value={fraction(DEMO_READ.you)} className="mt-2" />
          </div>
          <Avatar
            name={DEMO_READ.buddy.name}
            tone={DEMO_READ.buddy.tone}
            size="h-9 w-9"
          />
        </Link>
      </section>

      {/* Shelves */}
      <section className="mt-7">
        <Eyebrow className="mb-3 block">Shelves</Eyebrow>
        <div className="flex gap-3">
          <Shelf count={18} label="To Be Read" />
          <Shelf count={9} label="Beloved" />
          <Shelf count={42} label="Finished" to="/finished" />
        </div>
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
