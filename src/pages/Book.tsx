import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { AddToLibrary } from '../components/AddToLibrary'
import { BookCover } from '../components/BookCover'
import { BuddyPicker } from '../components/BuddyPicker'
import { Eyebrow } from '../components/Eyebrow'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'
import { logActivity } from '../lib/activity'
import { otherParty } from '../lib/friends'
import { otherReader, sendReadRequest, startSoloRead, type ReadBook } from '../lib/reads'
import { authorLine, getBook, type Book } from '../lib/books'

/** A friendly "back to ___" label from the route we arrived from (passed as
 *  `state.from` by whoever linked here). Falls back to a plain "Back". */
function backLabel(from?: string): string {
  if (from?.startsWith('/library')) return 'Back to library'
  if (from?.startsWith('/u/')) return 'Back to profile'
  if (from?.startsWith('/search')) return 'Back to search'
  return 'Back'
}

/** One of the two equal-sized ways to start a read — an icon-led tile with a
 *  premium press. Solo and Together are peers (same footprint) but colour-
 *  distinct: Together is filled terracotta, Solo is terracotta-on-surface; each
 *  fills on press. */
function ReadAction({
  onClick,
  busy,
  label,
  icon,
  variant,
}: {
  onClick: () => void
  busy: boolean
  label: string
  icon: React.ReactNode
  variant: 'solid' | 'outline'
}) {
  const solid = variant === 'solid'
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`group flex flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-3.5 outline-none transition-[transform,box-shadow,background-color,color,border-color] duration-300 ease-[cubic-bezier(0.22,0.61,0.18,1)] hover:-translate-y-0.5 active:scale-[0.94] active:duration-150 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
        solid
          ? 'bg-accent text-accent-contrast shadow-[0_10px_24px_-12px_rgba(138,69,54,0.7)] hover:shadow-[0_16px_30px_-12px_rgba(138,69,54,0.92)] hover:brightness-105 active:bg-gold active:shadow-[0_6px_22px_-4px_rgba(168,130,47,0.9)]'
          : 'border border-border bg-surface text-accent hover:border-accent/50 active:border-transparent active:bg-accent active:text-accent-contrast active:shadow-[0_6px_22px_-4px_rgba(138,69,54,0.7)]'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        width="23"
        height="23"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="transition-transform duration-300 ease-[cubic-bezier(0.22,0.61,0.18,1)] group-active:scale-90"
      >
        {icon}
      </svg>
      <span className="font-medium">{busy ? 'One moment…' : label}</span>
    </button>
  )
}

/** A small muted fact, shown only when we actually have it. */
function Meta({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <Eyebrow as="dt">{label}</Eyebrow>
      <dd className="mt-0.5 text-text">{value}</dd>
    </div>
  )
}

/**
 * A single book's page: cover, title, the facts worth knowing, and its blurb.
 * "Read this together" sends a buddy-read request — directly to a friend when
 * arrived here from Friends (`?with=`), otherwise via a buddy picker.
 */
export function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const { user } = useAuth()
  const { friends } = useFriends()
  const { active, outgoing } = useReads()

  const [result, setResult] = useState<{ id: string; book: Book | null } | null>(
    null,
  )
  const [picking, setPicking] = useState(false)
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [soloBusy, setSoloBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    const ctrl = new AbortController()
    getBook(id, ctrl.signal)
      .then((b) => setResult({ id, book: b }))
      .catch(() => {
        if (!ctrl.signal.aborted) setResult({ id, book: null })
      })
    return () => ctrl.abort()
  }, [id])

  const matched = result && result.id === id ? result : null
  const status = !matched ? 'loading' : matched.book ? 'done' : 'error'
  const book = matched?.book ?? null

  const myUid = user?.uid ?? ''
  const buddies = friends.map((r) => otherParty(r, myUid))

  // Friends already reading / invited to this exact book — shown disabled. Solo
  // reads have no buddy, so they never disable anyone.
  const disabled: Record<string, string> = {}
  if (book) {
    for (const r of [...active, ...outgoing]) {
      if (r.book.id === book.id && !r.solo) {
        const o = otherReader(r, myUid)
        disabled[o.uid] = r.status === 'active' ? 'Already reading' : 'Invited'
      }
    }
  }

  const withUid = params.get('with')
  const directBuddy =
    withUid && !disabled[withUid]
      ? buddies.find((b) => b.uid === withUid)
      : undefined

  // An existing solo read of this exact book — so the button continues it rather
  // than starting a duplicate.
  const existingSolo = book
    ? active.find((r) => r.solo && r.book.id === book.id)
    : undefined

  const send = async (buddy: { uid: string; displayName: string | null; photoURL: string | null }) => {
    if (!user || !book) return
    setBusyUid(buddy.uid)
    try {
      const snapshot: ReadBook = {
        id: book.id,
        title: book.title,
        authors: book.authors,
        coverUrl: book.coverUrl,
        pageCount: book.pageCount,
      }
      await sendReadRequest(user, buddy, snapshot)
      setSentTo(buddy.displayName ?? 'your buddy')
      setPicking(false)
    } finally {
      setBusyUid(null)
    }
  }

  const startSolo = async () => {
    if (!user || !book) return
    if (existingSolo) {
      navigate(`/read/${existingSolo.id}`, { state: { from: location.pathname } })
      return
    }
    setSoloBusy(true)
    try {
      const snapshot: ReadBook = {
        id: book.id,
        title: book.title,
        authors: book.authors,
        coverUrl: book.coverUrl,
        pageCount: book.pageCount,
      }
      const newId = await startSoloRead(user, snapshot)
      await logActivity(user.uid, user, 'read_started', {
        bookTitle: book.title,
        bookId: book.id,
      })
      navigate(`/read/${newId}`, { state: { from: location.pathname } })
    } finally {
      setSoloBusy(false)
    }
  }

  // Read together: send straight to a friend arrived-with (?with=), open the
  // buddy picker, or — with no buddies yet — go add one first.
  const together = () => {
    if (directBuddy) void send(directBuddy)
    else if (buddies.length === 0) navigate('/friends')
    else setPicking(true)
  }

  return (
    <AppShell>
      {/* Go *back* through history (to wherever you came from), not a forward
          push to /search — pushing was what created the back-button loop. Fall
          back to a sensible route only on a cold deep-link with no app history. */}
      <button
        type="button"
        onClick={() => {
          const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
          if (idx > 0) navigate(-1)
          else navigate(from ?? '/library')
        }}
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
      >
        ‹ {backLabel(from)}
      </button>

      {status === 'loading' && (
        <p className="mt-10 text-center text-sm text-text-muted">
          Fetching the book…
        </p>
      )}

      {status === 'error' && (
        <p className="mt-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          Couldn't open that one. It may have wandered off the shelf — try
          searching again.
        </p>
      )}

      {book && (
        <article className="mt-5">
          <div className="flex items-start gap-5">
            <BookCover
              book={book}
              author={book.authors[0]}
              className="w-28 shrink-0 self-start ipad:w-36"
            />
            <div className="min-w-0 flex-1">
              <h1
                className={`text-pretty font-display leading-tight text-text ${
                  book.title.length > 30 ? 'text-2xl ipad:text-3xl' : 'text-3xl ipad:text-4xl'
                }`}
              >
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="mt-1 text-pretty text-text-muted">
                  {book.subtitle}
                </p>
              )}
              <p className="mt-2 text-text">{authorLine(book.authors)}</p>
            </div>
          </div>

          {/* The two ways to read — peers, never a hierarchy. */}
          {sentTo ? (
            <div className="mt-6 rounded-xl border border-accent/40 bg-surface p-4 text-center">
              <p className="text-text">
                Request sent to <strong className="font-semibold">{sentTo}</strong>.
              </p>
              <p className="mt-1 text-sm text-text-muted">
                It's waiting in their Activity. You'll see it on your shelf once
                they accept.
              </p>
              <Link
                to="/home"
                className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.1em] text-accent"
              >
                Back to shelf ›
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <ReadAction
                variant="outline"
                onClick={() => void startSolo()}
                busy={soloBusy}
                label={existingSolo ? 'Continue Solo' : 'Read Solo'}
                icon={
                  <>
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </>
                }
              />
              <ReadAction
                variant="solid"
                onClick={together}
                busy={busyUid !== null}
                label="Read Together"
                icon={
                  <>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </>
                }
              />
            </div>
          )}

          {user && (
            <AddToLibrary
              uid={user.uid}
              book={{
                id: book.id,
                title: book.title,
                authors: book.authors,
                coverUrl: book.coverUrl,
                pageCount: book.pageCount,
              }}
            />
          )}

          <dl className="mt-7 grid grid-cols-2 gap-4">
            <Meta
              label="Pages"
              value={book.pageCount ? String(book.pageCount) : null}
            />
            <Meta
              label="Published"
              value={book.year ? String(book.year) : book.publishedDate}
            />
            <Meta label="Publisher" value={book.publisher} />
            <Meta label="Subjects" value={book.categories[0] ?? null} />
          </dl>

          {book.description && (
            <section className="mt-7">
              <Eyebrow className="block">About</Eyebrow>
              <p className="mt-2 max-w-md whitespace-pre-line text-pretty leading-relaxed text-text-muted">
                {book.description}
              </p>
            </section>
          )}

          <BuddyPicker
            open={picking}
            title={book.title}
            friends={buddies}
            disabled={disabled}
            busyUid={busyUid}
            onPick={(b) => void send(b)}
            onClose={() => setPicking(false)}
          />
        </article>
      )}
    </AppShell>
  )
}
