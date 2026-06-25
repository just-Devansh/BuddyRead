import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Eyebrow } from '../components/Eyebrow'
import { useConfirm } from '../components/useConfirm'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'
import { logActivity, type ActivityEventDoc, type ActivityItem } from '../lib/activity'
import { moodByKey, type Mood } from '../lib/moods'
import { acceptFriendRequest, removeRelationship } from '../lib/friends'
import { acceptReadRequest, removeRead } from '../lib/reads'

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

const strong = (s: string) => <strong className="font-semibold">{s}</strong>
const em = (s: string) => <em className="font-display italic">{s}</em>

/** Turn one logged event into its line, an optional quoted note, and a mood. */
function describe(it: ActivityItem): { body: ReactNode; quote?: string; mood?: Mood | null } {
  const who = it.actorName ?? 'A reader'
  const book = it.bookTitle ?? 'your book'
  switch (it.type) {
    case 'friend_accepted':
      return { body: <>You and {strong(who)} are reading buddies now.</> }
    case 'friend_declined':
      return { body: <>{strong(who)} declined your buddy request.</> }
    case 'read_accepted':
      return { body: <>{strong(who)} is in — you're reading {em(book)} together.</> }
    case 'read_started':
      return {
        body: it.withName ? (
          <>You began reading {em(book)} with {strong(it.withName)}.</>
        ) : (
          <>You began reading {em(book)}.</>
        ),
      }
    case 'read_declined':
      return { body: <>{strong(who)} passed on reading {em(book)}.</> }
    case 'read_logged':
      return {
        body: <>{strong(who)} reached p.{it.page} in {em(book)}.</>,
        quote: it.note ?? undefined,
        mood: moodByKey(it.mood),
      }
    case 'read_left':
      return { body: <>{strong(who)} stepped away from {em(book)}.</> }
  }
}

/**
 * The in-app inbox. Requests that need a yes/no sit at the top; below them, the
 * activity log (users/{uid}/activity) — a real record of friendships made and
 * declined, reads accepted/declined/left, and every page logged with its note.
 */
export function Activity() {
  const { user } = useAuth()
  const { incoming: friendIn } = useFriends()
  const { incoming: readIn } = useReads()
  const { confirm, dialog } = useConfirm()
  const [busy, setBusy] = useState<string | null>(null)
  const [events, setEvents] = useState<ActivityItem[]>([])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'activity'),
      orderBy('createdAt', 'desc'),
      limit(60),
    )
    return onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ActivityEventDoc) })))
    })
  }, [user])

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id)
    try {
      await fn()
    } finally {
      setBusy(null)
    }
  }

  const requests = friendIn.length + readIn.length
  const nothing = requests === 0 && events.length === 0

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-text">Activity</h1>

      {nothing && (
        <section className="mt-8 rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
          <p className="font-display text-2xl text-text">All quiet</p>
          <p className="mx-auto mt-2 max-w-sm text-pretty leading-relaxed text-text-muted">
            Add a buddy and start a read — requests, replies, pages logged, and
            notes left will all gather here.
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
                    onClick={() =>
                      void act(r.id, async () => {
                        await acceptFriendRequest(r.id)
                        if (user) await logActivity(r.fromUid, user, 'friend_accepted')
                      })
                    }
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
                          message: `${r.fromName ?? 'They'} will be told it didn't take, and you can add each other later with an invite code.`,
                          confirmLabel: 'Decline',
                        })
                      )
                        void act(r.id, async () => {
                          if (user) await logActivity(r.fromUid, user, 'friend_declined')
                          await removeRelationship(r.id)
                        })
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
                    onClick={() =>
                      void act(r.id, async () => {
                        await acceptReadRequest(r.id)
                        if (user) {
                          await logActivity(r.fromUid, user, 'read_accepted', {
                            bookTitle: r.book.title,
                          })
                          // A start entry for my own feed, naming who I'm reading with.
                          await logActivity(user.uid, user, 'read_started', {
                            bookTitle: r.book.title,
                            withName: r.fromName,
                          })
                        }
                      })
                    }
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
                          message: `${r.fromName ?? 'They'} will be told, and can ask again later.`,
                          confirmLabel: 'Decline',
                        })
                      )
                        void act(r.id, async () => {
                          if (user)
                            await logActivity(r.fromUid, user, 'read_declined', {
                              bookTitle: r.book.title,
                            })
                          await removeRead(r.id)
                        })
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

      {/* The log */}
      {events.length > 0 && (
        <section className="mt-8">
          <Eyebrow className="mb-1 block">Lately</Eyebrow>
          <ul>
            {events.map((it) => {
              const { body, quote, mood } = describe(it)
              const isOther = it.actorUid && it.actorUid !== user?.uid
              const avatar = (
                <Avatar src={it.actorPhotoURL} name={it.actorName} size="h-9 w-9" />
              )
              return (
                <li
                  key={it.id}
                  className="flex items-start gap-3 border-t border-border-soft py-3.5"
                >
                  {isOther ? (
                    <Link to={`/u/${it.actorUid}`} className="shrink-0">
                      {avatar}
                    </Link>
                  ) : (
                    avatar
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug text-text">{body}</p>
                    {quote && (
                      <p className="mt-1 font-display italic text-text-muted">“{quote}”</p>
                    )}
                    {mood && (
                      <p className="mt-1 text-sm text-text-muted">
                        <span aria-hidden="true">{mood.emoji}</span>{' '}
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint">
                          {mood.word}
                        </span>
                      </p>
                    )}
                    <p className="mt-1 font-mono text-[9px] tracking-[0.06em] text-text-faint">
                      {ago(it.createdAt?.toMillis() ?? 0)}
                    </p>
                  </div>
                </li>
              )
            })}
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
