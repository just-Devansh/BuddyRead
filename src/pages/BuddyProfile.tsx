import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { BookCover } from '../components/BookCover'
import { Bookshelf } from '../components/Bookshelf'
import { Eyebrow } from '../components/Eyebrow'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'
import { otherParty } from '../lib/friends'
import { fractionFor, otherReader } from '../lib/reads'
import { booksOnShelf, fetchLibrary, type LibraryItem } from '../lib/library'

/** Month + year a relationship settled, for a quiet "buddies since" line. */
function since(ms: number | undefined): string | null {
  if (!ms) return null
  return new Date(ms).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

/**
 * A buddy's profile — a small, honest social page. We can only ever show what we
 * share (their denormalized identity, and the reads we're in together), so that's
 * exactly what this is: who they are, and what you're reading side by side. Their
 * wider shelf stays private, by the same rules that keep yours private.
 */
export function BuddyProfile() {
  const { uid: them } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { friends } = useFriends()
  const { active } = useReads()

  const me = user?.uid ?? ''
  const rel = friends.find((r) => otherParty(r, me).uid === them)
  const shared = active.filter((r) => otherReader(r, me).uid === them)

  // Their library — a one-shot read (friends can read it; see firestore.rules).
  const [lib, setLib] = useState<LibraryItem[]>([])
  const [libLoading, setLibLoading] = useState(true)

  useEffect(() => {
    if (!them) return
    // Loading starts true; this view remounts per profile (AppShell keys on the
    // path), so there's no stale-loading state to reset synchronously here.
    let on = true
    fetchLibrary(them)
      .then((items) => on && setLib(items))
      .catch(() => on && setLib([]))
      .finally(() => on && setLibLoading(false))
    return () => {
      on = false
    }
  }, [them])

  // Identity from whichever denormalized source we have — relationship first.
  const ident = rel
    ? otherParty(rel, me)
    : shared[0]
      ? otherReader(shared[0], me)
      : null

  if (!them || !ident) {
    return (
      <AppShell>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
        >
          ‹ Back
        </button>
        <p className="mt-10 text-center text-sm text-text-muted">
          You don't share a shelf with this reader.
        </p>
      </AppShell>
    )
  }

  const name = ident.displayName ?? 'A reader'
  const firstName = name.split(' ')[0]
  const sinceLabel = since(rel?.respondedAt?.toMillis() ?? rel?.createdAt?.toMillis())
  const readCount = booksOnShelf(lib, 'read').length

  return (
    <AppShell>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
      >
        ‹ Back
      </button>

      {/* Identity */}
      <section className="mt-4 flex flex-col items-center text-center">
        <Avatar
          src={ident.photoURL}
          name={name}
          tone={ident.photoURL ? undefined : 'gold'}
          size="h-20 w-20"
          className="text-4xl shadow-[0_10px_24px_-12px_rgba(111,61,48,0.7)]"
        />
        <h1 className="mt-4 font-display text-3xl text-text">{name}</h1>
        <Eyebrow className="mt-1 block">
          {rel ? 'Reading buddy' : 'Reading together'}
        </Eyebrow>
        {sinceLabel && (
          <p className="mt-1 text-sm text-text-muted">Buddies since {sinceLabel}</p>
        )}
        {!libLoading && lib.length > 0 && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
            {readCount} read · {booksOnShelf(lib, 'tbr').length} to read ·{' '}
            {booksOnShelf(lib, 'favorite').length} favorites
          </p>
        )}
      </section>

      {/* Their shelves */}
      <section className="mt-8">
        <Eyebrow className="mb-3 block">{firstName}'s shelves</Eyebrow>
        {libLoading ? (
          <p className="py-10 text-center text-sm text-text-muted">
            Opening their bookcase…
          </p>
        ) : lib.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-5 text-center text-pretty text-sm leading-relaxed text-text-muted">
            No books shelved yet.
          </p>
        ) : (
          <Bookshelf items={lib} />
        )}
      </section>

      {/* Reading together */}
      <section className="mt-8">
        <Eyebrow className="mb-3 block">Reading together</Eyebrow>
        {shared.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-5 text-center text-pretty text-sm leading-relaxed text-text-muted">
            Nothing on the go together yet.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {shared.map((r) => {
              const f = fractionFor(r, me)
              const tf = fractionFor(r, them)
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
                        you {f == null ? '—' : `${Math.round(f * 100)}%`} · them{' '}
                        {tf == null ? '—' : `${Math.round(tf * 100)}%`}
                      </Eyebrow>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Start another together */}
      {rel && (
        <Link
          to={`/search?with=${them}&name=${encodeURIComponent(name)}`}
          className="mt-6 flex w-full items-center justify-center rounded-xl border border-accent/40 bg-surface py-3.5 font-medium text-accent transition-colors hover:bg-surface-alt"
        >
          Read something together
        </Link>
      )}
    </AppShell>
  )
}
