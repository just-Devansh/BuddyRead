import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Lamp } from '../components/Lamp'
import { BookCover } from '../components/BookCover'
import { Eyebrow } from '../components/Eyebrow'
import { Ornament } from '../components/Ornament'
import { ProgressBar } from '../components/ProgressBar'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'
import { useLibrary } from '../library/useLibrary'
import { fractionFor, otherReader, type Read } from '../lib/reads'
import { booksOnShelf, type LibraryBook } from '../lib/library'
import { fetchCirclePicks, type CirclePick } from '../lib/circle'
import { pickLine } from '../lib/lines'

/** Time-of-day greeting — always an actual greeting, never a goodbye. */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstName(n: string): string {
  return n.trim().split(' ')[0]
}

/** One reader's mini progress row inside a shelf card. */
function MiniRow({ label, frac, tone }: { label: string; frac: number | null; tone: 'accent' | 'gold' }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 truncate font-mono text-[10px] text-text-faint">{label}</span>
      {frac == null ? (
        <span className="flex-1 font-mono text-[10px] text-text-faint">yet to begin</span>
      ) : (
        <ProgressBar value={frac} tone={tone} className="flex-1" />
      )}
    </div>
  )
}

/** An active read on the shelf — a buddy read (two paces) or a solo read (one). */
function ReadCard({ read, uid }: { read: Read; uid: string }) {
  const solo = read.solo === true
  const buddy = solo ? null : otherReader(read, uid)
  const buddyName = buddy?.displayName ?? 'Your buddy'
  // The mini progress rows are tight (a truncated label) — a last name only ever
  // shows half. First name only, on both phone and iPad.
  const buddyFirst = buddyName.trim().split(' ')[0]
  return (
    <Link
      to={`/read/${read.id}`}
      state={{ from: '/home' }}
      className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
    >
      <BookCover
        book={{
          title: read.book.title,
          coverUrl: read.book.coverUrl,
          isbn13: null,
          isbn10: null,
        }}
        author={read.book.authors[0]}
        className="w-14 shrink-0 self-start"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-xl leading-tight text-text">{read.book.title}</h3>
        <Eyebrow className="mt-1 block">{solo ? 'Reading solo' : `with ${buddyName}`}</Eyebrow>
        <div className="mt-3 space-y-2">
          <MiniRow label="You" frac={fractionFor(read, uid)} tone="accent" />
          {buddy && (
            <MiniRow label={buddyFirst} frac={fractionFor(read, buddy.uid)} tone="gold" />
          )}
        </div>
      </div>
    </Link>
  )
}

/** The credit line on a circle pick — who loved or listed it. */
function creditLine(pick: CirclePick): string {
  const names = pick.owners.map((o) => firstName(o.name))
  const who =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} & ${names[1]}`
        : `${names[0]} & ${names.length - 1} others`
  return pick.loved ? `${who} loved this` : `On ${who}'s list`
}

/**
 * A book pulled from your circle's shelves — leads to the book, pre-aimed at the
 * buddy behind it (`?with=`), so "Read Together" sends straight to them.
 */
function CircleCard({ pick }: { pick: CirclePick }) {
  const lead = pick.owners[0]
  return (
    <Link
      to={`/book/${pick.book.id}?with=${lead.uid}`}
      state={{ from: '/home' }}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
    >
      <BookCover
        book={{ title: pick.book.title, coverUrl: pick.book.coverUrl, isbn13: null, isbn10: null }}
        author={pick.book.authors[0]}
        className="w-12 shrink-0"
        rounded="rounded-md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Avatar src={lead.photoURL} name={lead.name} tone={lead.photoURL ? undefined : 'gold'} size="h-4 w-4" />
          <Eyebrow>{creditLine(pick)}</Eyebrow>
        </div>
        <h3 className="mt-1 truncate font-display text-lg font-medium leading-tight text-text">
          {pick.book.title}
        </h3>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-accent">
          Read it with {firstName(lead.name)} ›
        </p>
      </div>
    </Link>
  )
}

/**
 * The signed-in home — a warm greeting, your active buddy reads, and a genuinely
 * relevant "what next": books your reading circle loves or has lined up (offered
 * to start *together*), falling back to your own to-read shelf, then to a quiet
 * literary line. No fabricated recommendations — only your people and your books.
 */
export function Home() {
  const { user, userDoc } = useAuth()
  const { active, loading } = useReads()
  const { friends } = useFriends()
  const { items: myLibrary, loading: libLoading } = useLibrary()
  const uid = user?.uid ?? ''

  // null = the circle hasn't been read yet (don't decide the layout until it is).
  // With no friends there's nothing to fetch, so that case is derived, not set.
  const [fetched, setFetched] = useState<CirclePick[] | null>(null)
  const [line] = useState(pickLine)

  // The nook lamp — its lit state persists, so the ambience you chose stays.
  const [lit, setLit] = useState(() => {
    try {
      return localStorage.getItem('buddyread:lamp') === 'on'
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('buddyread:lamp', lit ? 'on' : 'off')
    } catch {
      // Storage blocked (private mode) — the lamp simply won't be remembered.
    }
  }, [lit])

  useEffect(() => {
    if (!uid || friends.length === 0) return
    let cancelled = false
    const exclude = new Set(active.map((r) => r.book.id))
    fetchCirclePicks(friends, uid, exclude)
      .then((p) => !cancelled && setFetched(p))
      .catch(() => !cancelled && setFetched([]))
    return () => {
      cancelled = true
    }
  }, [friends, active, uid])

  const picks: CirclePick[] | null = friends.length === 0 ? [] : fetched

  const firstNameOfUser = firstName(userDoc?.displayName ?? user?.displayName ?? 'reader')

  const myTbr: LibraryBook[] = booksOnShelf(myLibrary, 'tbr').map((i) => i.book)
  const nextReady = picks !== null && !libLoading

  return (
    <AppShell>
     <div className="nook relative isolate">
      {/* Ambient lamplight — a warm pool that settles over the cards when the
          nook lamp is lit. Isolated to .nook so the screen-blend never bleeds. */}
      <div aria-hidden="true" className={`lamp-wash ${lit ? 'is-lit' : ''}`} />

      {/* Greeting (kept above the wash so the words stay crisp) */}
      <section className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 pt-1">
          <p className="font-display text-xl italic text-text-muted">
            {greeting()}, {firstNameOfUser}.
          </p>
          <h1 className="mt-1 font-display text-4xl text-text">Your nook</h1>
        </div>
        {/* The add-a-book button sits to the left of the corner lamp. */}
        <div className="flex shrink-0 items-start gap-2">
          <Link
            to="/search"
            state={{ from: '/home' }}
            aria-label="Add a book"
            title="Add a book"
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-accent shadow-[0_8px_20px_-12px_rgba(111,61,48,0.6)] transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:bg-surface-alt active:translate-y-0"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
          <Lamp lit={lit} onToggle={() => setLit((v) => !v)} className="-mt-4 w-12 ipad:w-14" />
        </div>
      </section>

      {/* Hold the dynamic sections until reads load, so the first paint never
          shows the empty layout and then snaps to your reads (the entry flicker). */}
      {!loading && (
        <>
          {active.length > 0 ? (
            <section className="mt-4">
              <Eyebrow className="mb-3 block">Reading now</Eyebrow>
              <ul className="space-y-3">
                {active.map((r) => (
                  <li key={r.id}>
                    <ReadCard read={r} uid={uid} />
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <Link
              to="/search"
              state={{ from: '/home' }}
              className="mt-4 flex items-center gap-4 rounded-2xl border border-dashed border-border bg-surface/50 p-5 transition-colors hover:border-accent/40"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-2xl text-accent"
                aria-hidden="true"
              >
                +
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl text-text">
                  Nothing on the go yet
                </span>
                <span className="block text-pretty text-sm leading-relaxed text-text-muted">
                  Find a book — read it with a buddy, or on your own.
                </span>
              </span>
              <span className="font-mono text-lg text-text-faint" aria-hidden="true">
                ›
              </span>
            </Link>
          )}

          {/* What next — your circle's shelves, then your own, then a line.
              Held until resolved so it never flashes one tier then another. */}
          {nextReady &&
            (picks.length > 0 ? (
              <section className="mt-9">
                <Eyebrow className="mb-3 block">From your circle</Eyebrow>
                <ul className="space-y-3">
                  {picks.map((p) => (
                    <li key={p.book.id}>
                      <CircleCard pick={p} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : myTbr.length > 0 ? (
              <section className="mt-9">
                <div className="flex items-baseline justify-between">
                  <Eyebrow>On your list</Eyebrow>
                  <Link
                    to="/library"
                    className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-accent"
                  >
                    Your shelves ›
                  </Link>
                </div>
                <ul className="no-scrollbar mt-3 flex snap-x snap-proximity scroll-smooth gap-4 overflow-x-auto pt-2 pb-4">
                  {myTbr.map((b) => (
                    <li key={b.id} className="w-20 shrink-0 snap-start">
                      <Link to={`/book/${b.id}`} state={{ from: '/home' }} className="block">
                        <BookCover
                          book={{ title: b.title, coverUrl: b.coverUrl, isbn13: null, isbn10: null }}
                          author={b.authors[0]}
                          className="w-20 transition-transform hover:-translate-y-0.5"
                          rounded="rounded-md"
                        />
                        <p className="mt-2 line-clamp-2 font-display text-sm font-medium leading-tight text-text">
                          {b.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className="mt-12 text-center">
                <Ornament />
                <p className="mx-auto mt-4 max-w-xs text-pretty font-display text-xl italic leading-snug text-text-muted">
                  “{line.line}”
                </p>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
                  {line.source}
                </p>
              </section>
            ))}
        </>
      )}
     </div>
    </AppShell>
  )
}
