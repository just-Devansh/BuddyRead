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
          <div className="flex gap-5">
            <BookCover
              book={book}
              author={book.authors[0]}
              className="w-28 shrink-0 ipad:w-36"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-pretty font-display text-3xl leading-tight text-text ipad:text-4xl">
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

          {/* The send action — the soul of the app */}
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
          ) : buddies.length === 0 ? (
            <Link
              to="/friends"
              className="mt-6 flex w-full items-center justify-center rounded-xl border border-border bg-surface px-5 py-3.5 font-medium text-text-muted transition-colors hover:text-text ipad:w-auto ipad:px-10"
            >
              Add a buddy to read together
            </Link>
          ) : directBuddy ? (
            <button
              type="button"
              disabled={busyUid !== null}
              onClick={() => void send(directBuddy)}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-accent px-5 py-3.5 font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-60 ipad:w-auto ipad:px-10"
            >
              {busyUid ? 'Sending…' : `Read this with ${directBuddy.displayName ?? 'them'}`}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-accent px-5 py-3.5 font-medium text-accent-contrast transition-opacity hover:opacity-90 ipad:w-auto ipad:px-10"
            >
              Read this together
            </button>
          )}

          {/* Read solo — always available, even with no buddies. Continues an
              existing solo read of this book rather than starting a duplicate. */}
          {!sentTo && (
            <button
              type="button"
              disabled={soloBusy}
              onClick={() => void startSolo()}
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-border bg-surface px-5 py-3 font-medium text-text-muted transition-colors hover:text-text disabled:opacity-60 ipad:w-auto ipad:px-10"
            >
              {existingSolo
                ? 'Continue your solo read'
                : soloBusy
                  ? 'Starting…'
                  : 'Read solo'}
            </button>
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
