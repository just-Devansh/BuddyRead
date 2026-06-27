import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { BookCover } from '../components/BookCover'
import { Eyebrow } from '../components/Eyebrow'
import { EditProfileDialog } from '../components/EditProfileDialog'
import { useConfirm } from '../components/useConfirm'
import { ThemeToggle } from '../theme/ThemeToggle'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'
import { otherParty } from '../lib/friends'
import { fractionFor, otherReader } from '../lib/reads'

type Tab = 'read' | 'reading' | 'buddies'

/** A tappable headline number that opens its list below. */
function StatButton({
  value,
  label,
  active,
  onClick,
  divide,
}: {
  value: string
  label: string
  active: boolean
  onClick: () => void
  divide?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-1 text-center transition-colors ${divide ? 'border-r border-border' : ''}`}
    >
      <div
        className={`font-display text-3xl font-semibold ${active ? 'text-accent' : 'text-text'}`}
      >
        {value}
      </div>
      <span
        className={`mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] ${
          active ? 'text-accent' : 'text-text-faint'
        }`}
      >
        {label}
      </span>
    </button>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-5 text-center text-pretty text-sm leading-relaxed text-text-muted">
      {children}
    </p>
  )
}

export function Profile() {
  const { user, userDoc, error, signOut } = useAuth()
  const { friends } = useFriends()
  const { active } = useReads()
  const { confirm, dialog } = useConfirm()
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<Tab | null>(null)
  const [editing, setEditing] = useState(false)

  const uid = user?.uid ?? ''
  const name = userDoc?.displayName ?? user?.displayName ?? 'Reader'
  const handle = userDoc?.username ? `@${userDoc.username}` : user?.email ?? ''

  const toggle = (t: Tab) => setTab((cur) => (cur === t ? null : t))

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

  const signOutConfirmed = async () => {
    if (
      await confirm({
        title: 'Sign out?',
        message: "You'll need to sign in with Google again to get back to your reads.",
        confirmLabel: 'Sign out',
        cancelLabel: 'Stay',
        destructive: false,
      })
    )
      void signOut()
  }

  return (
    <AppShell>
      {/* Theme + sign out, kept quiet at the top */}
      <div className="flex items-center justify-between">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => void signOutConfirmed()}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted transition-colors hover:text-accent"
        >
          Sign out
        </button>
      </div>

      {/* Identity */}
      <section className="flex flex-col items-center text-center">
        <div className="relative">
          <Avatar
            src={user?.photoURL}
            name={name}
            tone={user?.photoURL ? undefined : 'terracotta'}
            size="h-20 w-20"
            className="text-4xl shadow-[0_10px_24px_-12px_rgba(111,61,48,0.7)]"
          />
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit profile"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-sm transition-colors hover:text-accent"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
          </button>
        </div>
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

      {/* Stats — tap to open the list below */}
      <section className="mt-7 flex">
        <StatButton value="0" label="read" active={tab === 'read'} onClick={() => toggle('read')} divide />
        <StatButton
          value={String(active.length)}
          label="reading"
          active={tab === 'reading'}
          onClick={() => toggle('reading')}
          divide
        />
        <StatButton
          value={String(friends.length)}
          label="buddies"
          active={tab === 'buddies'}
          onClick={() => toggle('buddies')}
        />
      </section>

      {tab && (
        <div className="mt-4">
          {tab === 'read' && (
            <EmptyNote>
              No finished reads yet. When you close the back cover on one, it'll
              rest here — with the dates you read it, who with, and your rating.
            </EmptyNote>
          )}

          {tab === 'reading' &&
            (active.length === 0 ? (
              <EmptyNote>Nothing on the go. Start a read from your nightstand.</EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {active.map((r) => {
                  const o = r.solo ? null : otherReader(r, uid)
                  const f = fractionFor(r, uid)
                  return (
                    <li key={r.id}>
                      <Link
                        to={`/read/${r.id}`}
                        className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/40"
                      >
                        <BookCover
                          book={{ title: r.book.title, coverUrl: r.book.coverUrl, isbn13: null, isbn10: null }}
                          author={r.book.authors[0]}
                          className="w-11 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-lg leading-tight text-text">
                            {r.book.title}
                          </p>
                          <Eyebrow className="mt-0.5 block">
                            {o ? `with ${o.displayName ?? 'your buddy'}` : 'Solo'} ·{' '}
                            {f == null ? 'yet to begin' : `${Math.round(f * 100)}%`}
                          </Eyebrow>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ))}

          {tab === 'buddies' &&
            (friends.length === 0 ? (
              <EmptyNote>No buddies yet — add one with their invite code.</EmptyNote>
            ) : (
              <ul className="space-y-2.5">
                {friends.map((r) => {
                  const o = otherParty(r, uid)
                  return (
                    <li key={r.id}>
                      <Link
                        to={`/u/${o.uid}`}
                        className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/40"
                      >
                        <Avatar src={o.photoURL} name={o.displayName} size="h-10 w-10" />
                        <p className="min-w-0 flex-1 truncate font-display text-lg text-text">
                          {o.displayName ?? 'A reader'}
                        </p>
                        <Eyebrow>Reading buddy</Eyebrow>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ))}
        </div>
      )}

      {/* Reading circle — the home for friends, now that it's not a tab */}
      <Link
        to="/friends"
        className="mt-7 flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 transition-colors hover:border-accent/40"
      >
        <div className="min-w-0">
          <h2 className="font-display text-xl text-text">Your reading circle</h2>
          <p className="mt-0.5 text-pretty text-sm text-text-muted">
            Add buddies by invite code, answer requests, manage who you read with.
          </p>
        </div>
        <span className="ml-3 shrink-0 font-mono text-lg text-text-faint" aria-hidden="true">
          ›
        </span>
      </Link>

      <EditProfileDialog
        open={editing}
        uid={uid}
        currentUsername={userDoc?.username ?? ''}
        usernameUpdatedAt={userDoc?.usernameUpdatedAt}
        onClose={() => setEditing(false)}
      />

      {dialog}
    </AppShell>
  )
}

