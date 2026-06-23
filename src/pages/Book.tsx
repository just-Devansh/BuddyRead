import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BookCover } from '../components/BookCover'
import { BuddyPicker } from '../components/BuddyPicker'
import { Eyebrow } from '../components/Eyebrow'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'
import { otherParty } from '../lib/friends'
import { otherReader, sendReadRequest, type ReadBook } from '../lib/reads'
import { authorLine, getBook, type Book } from '../lib/books'

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
  const { user } = useAuth()
  const { friends } = useFriends()
  const { active, outgoing } = useReads()

  const [result, setResult] = useState<{ id: string; book: Book | null } | null>(
    null,
  )
  const [picking, setPicking] = useState(false)
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

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

  // Friends already reading / invited to this exact book — shown disabled.
  const disabled: Record<string, string> = {}
  if (book) {
    for (const r of [...active, ...outgoing]) {
      if (r.book.id === book.id) {
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

  return (
    <AppShell>
      <Link
        to="/search"
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
      >
        ‹ Back to search
      </Link>

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
