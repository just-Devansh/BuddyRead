import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Eyebrow } from '../components/Eyebrow'
import { useConfirm } from '../components/useConfirm'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'
import { acceptFriendRequest, otherParty, removeRelationship } from '../lib/friends'
import { acceptReadRequest, otherReader, removeRead } from '../lib/reads'

const PILL = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50'

/** A short, friendly relative time. */
function ago(ms: number): string {
  if (!ms) return ''
  const m = Math.floor((Date.now() - ms) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d}d ago`
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

type FeedItem = {
  id: string
  time: number
  name: string | null
  photoURL: string | null
  body: ReactNode
  quote?: string
}

/**
 * The in-app inbox. Requests that need a yes/no sit at the top; below them, a
 * time-sorted feed of what's happened — friendships made, reads begun, pages
 * logged, notes left. Derived live from FriendsProvider + ReadsProvider (no
 * separate log yet, so declined/removed items leave no trace).
 */
export function Activity() {
  const { user } = useAuth()
  const { incoming: friendIn, outgoing: friendOut, friends } = useFriends()
  const { incoming: readIn, outgoing: readOut, active } = useReads()
  const { confirm, dialog } = useConfirm()
  const [busy, setBusy] = useState<string | null>(null)
  const uid = user?.uid ?? ''

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id)
    try {
      await fn()
    } finally {
      setBusy(null)
    }
  }

  const strong = (s: string) => <strong className="font-semibold">{s}</strong>
  const em = (s: string) => <em className="font-display italic">{s}</em>

  // --- The feed, derived from current state -------------------------------
  const feed: FeedItem[] = []

  friends.forEach((r) => {
    const o = otherParty(r, uid)
    feed.push({
      id: `friend-${r.id}`,
      time: r.respondedAt?.toMillis() ?? r.createdAt?.toMillis() ?? 0,
      name: o.displayName,
      photoURL: o.photoURL,
      body: <>You and {strong(o.displayName ?? 'a reader')} are reading buddies.</>,
    })
  })

  active.forEach((r) => {
    const o = otherReader(r, uid)
    const name = o.displayName ?? 'your buddy'
    feed.push({
      id: `read-${r.id}`,
      time: r.respondedAt?.toMillis() ?? r.createdAt?.toMillis() ?? 0,
      name: o.displayName,
      photoURL: o.photoURL,
      body: <>You and {strong(name)} began {em(r.book.title)}.</>,
    })
    const bp = r.progress?.[o.uid]
    if (bp?.updatedAt) {
      feed.push({
        id: `read-${r.id}-bp`,
        time: bp.updatedAt.toMillis(),
        name: o.displayName,
        photoURL: o.photoURL,
        body: <>{strong(name)} reached p.{bp.currentPage} in {em(r.book.title)}.</>,
        quote: bp.note ?? undefined,
      })
    }
    const mp = r.progress?.[uid]
    if (mp?.updatedAt) {
      feed.push({
        id: `read-${r.id}-mp`,
        time: mp.updatedAt.toMillis(),
        name: 'You',
        photoURL: user?.photoURL ?? null,
        body: <>You reached p.{mp.currentPage} in {em(r.book.title)}.</>,
      })
    }
  })

  readOut.forEach((r) => {
    feed.push({
      id: `readout-${r.id}`,
      time: r.createdAt?.toMillis() ?? 0,
      name: r.toName,
      photoURL: r.toPhotoURL,
      body: <>You asked {strong(r.toName ?? 'a reader')} to read {em(r.book.title)}.</>,
    })
  })

  friendOut.forEach((r) => {
    feed.push({
      id: `friendout-${r.id}`,
      time: r.createdAt?.toMillis() ?? 0,
      name: r.toName,
      photoURL: r.toPhotoURL,
      body: <>You asked {strong(r.toName ?? 'a reader')} to be buddies.</>,
    })
  })

  feed.sort((a, b) => b.time - a.time)

  const requests = friendIn.length + readIn.length
  const nothing = requests === 0 && feed.length === 0

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-text">Activity</h1>

      {nothing && (
        <section className="mt-8 rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
          <p className="font-display text-2xl text-text">All quiet</p>
          <p className="mx-auto mt-2 max-w-sm text-pretty leading-relaxed text-text-muted">
            Add a buddy and start a read — requests, pages logged, and notes left
            will all gather here.
          </p>
        </section>
      )}

      {/* Needs your response */}
      {requests > 0 && (
        <section className="mt-6">
          <Eyebrow className="mb-3 block">Needs you</Eyebrow>
          <ul className="space-y-3">
            {friendIn.map((r) => (
              <li key={r.id} className="rounded-2xl border border-accent/40 bg-surface p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={r.fromPhotoURL} name={r.fromName} size="h-10 w-10" />
                  <p className="min-w-0 flex-1 leading-snug text-text">
                    {strong(r.fromName ?? 'A reader')} wants to be reading buddies.
                  </p>
                </div>
                <div className="mt-3 flex gap-2.5">
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, () => acceptFriendRequest(r.id))}
                    className={`${PILL} flex-1 bg-accent text-accent-contrast hover:opacity-90`}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: 'Decline this request?',
                          message: `${r.fromName ?? 'They'} won't be told, and you can add each other later with an invite code.`,
                          confirmLabel: 'Decline',
                        })
                      )
                        void act(r.id, () => removeRelationship(r.id))
                    }}
                    className={`${PILL} flex-1 border border-border bg-surface-alt text-text-muted hover:text-text`}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}

            {readIn.map((r) => (
              <li key={r.id} className="rounded-2xl border border-accent/40 bg-surface p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={r.fromPhotoURL} name={r.fromName} size="h-10 w-10" />
                  <p className="min-w-0 flex-1 leading-snug text-text">
                    {strong(r.fromName ?? 'A reader')} wants to read {em(r.book.title)} with you.
                  </p>
                </div>
                <div className="mt-3 flex gap-2.5">
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, () => acceptReadRequest(r.id))}
                    className={`${PILL} flex-1 bg-accent text-accent-contrast hover:opacity-90`}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: 'Decline this read?',
                          message: `${r.fromName ?? 'They'} won't be notified, and can ask again later.`,
                          confirmLabel: 'Decline',
                        })
                      )
                        void act(r.id, () => removeRead(r.id))
                    }}
                    className={`${PILL} flex-1 border border-border bg-surface-alt text-text-muted hover:text-text`}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The feed */}
      {feed.length > 0 && (
        <section className="mt-8">
          <Eyebrow className="mb-1 block">Lately</Eyebrow>
          <ul>
            {feed.map((it) => (
              <li
                key={it.id}
                className="flex items-start gap-3 border-t border-border-soft py-3.5"
              >
                <Avatar src={it.photoURL} name={it.name} size="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="leading-snug text-text">{it.body}</p>
                  {it.quote && (
                    <p className="mt-1 font-display italic text-text-muted">“{it.quote}”</p>
                  )}
                  <p className="mt-1 font-mono text-[9px] tracking-[0.06em] text-text-faint">
                    {ago(it.time)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {nothing && (
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint">
          <Link to="/home" className="transition-colors hover:text-accent">
            Start a read ›
          </Link>
        </p>
      )}

      {dialog}
    </AppShell>
  )
}
