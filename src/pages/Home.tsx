import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Lamp } from '../components/Lamp'
import { BookCover } from '../components/BookCover'
import { Eyebrow } from '../components/Eyebrow'
import { Ornament } from '../components/Ornament'
import { ProgressBar } from '../components/ProgressBar'
import { StarRating } from '../components/StarRating'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { useReads } from '../reads/useReads'
import { useLibrary } from '../library/useLibrary'
import { fractionFor, otherReader, type Read } from '../lib/reads'
import { booksOnShelf, type LibraryBook } from '../lib/library'
import { fetchCircleFeed, type CircleEvent } from '../lib/circle'
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

/**
 * One reader's pace inside the hero read card — a labelled bar with the percentage
 * called out large in the reader's colour (terracotta for you, gold for a buddy),
 * so progress reads at a glance and gives the card its weight.
 */
function HeroRow({ label, frac, tone }: { label: string; frac: number | null; tone: 'accent' | 'gold' }) {
  const pct = frac == null ? null : Math.round(frac * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint">
        {label}
      </span>
      {pct == null ? (
        <span className="flex-1 font-display text-base italic text-text-faint">yet to begin</span>
      ) : (
        <>
          <ProgressBar value={frac ?? 0} tone={tone} className="flex-1" />
          <span
            className={`w-12 shrink-0 text-right font-display text-2xl font-semibold leading-none ${tone === 'gold' ? 'text-gold' : 'text-accent'}`}
          >
            {pct}
            <span className="text-xs text-text-faint">%</span>
          </span>
        </>
      )}
    </div>
  )
}

const SPARKLE_GAP = 14 // px the finger must travel before the next star drops

/**
 * A lingering "shooting-star" trail: as a finger (or cursor) glides across the
 * hero card, little gold stars drop in its wake and twinkle out. Stars are spun
 * up as bare DOM nodes inside a non-interactive overlay so the card never
 * re-renders and taps still pass through; the whole thing sits out under
 * `prefers-reduced-motion`.
 */
function useSparkleTrail() {
  const overlay = useRef<HTMLDivElement>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const reduce = useRef(false)
  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const drop = (x: number, y: number) => {
    const o = overlay.current
    if (!o) return
    const s = document.createElement('span')
    s.className = 'sparkle'
    s.style.left = `${x}px`
    s.style.top = `${y}px`
    s.style.setProperty('--s', `${6 + Math.random() * 7}px`) // size
    s.style.setProperty('--r', `${Math.random() * 90 - 45}deg`) // start rotation
    s.addEventListener('animationend', () => s.remove())
    o.appendChild(s)
  }

  const trail = (e: ReactPointerEvent) => {
    const o = overlay.current
    if (!o || reduce.current) return
    const r = o.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const l = last.current
    if (l && Math.hypot(x - l.x, y - l.y) < SPARKLE_GAP) return
    last.current = { x, y }
    drop(x, y)
  }
  const end = () => {
    last.current = null
  }

  return {
    overlay,
    onPointerDown: trail,
    onPointerMove: trail,
    onPointerUp: end,
    onPointerLeave: end,
    onPointerCancel: end,
  }
}

/**
 * An active read — the home screen's hero. A buddy read (two paces) or a solo read
 * (one), raised on a warm lit panel (`.read-hero`) so it clearly outranks the
 * quieter suggestions beneath it: a lifted cover, a large title, and each reader's
 * pace called out. Glide a finger across it and gold stars trail your touch
 * (see useSparkleTrail).
 */
function ReadCard({ read, uid }: { read: Read; uid: string }) {
  const solo = read.solo === true
  const buddy = solo ? null : otherReader(read, uid)
  const buddyName = buddy?.displayName ?? 'Your buddy'
  // The progress rows are tight (a truncated label) — a last name only ever shows
  // half. First name only, on both phone and iPad.
  const buddyFirst = buddyName.trim().split(' ')[0]
  const { overlay, ...trail } = useSparkleTrail()
  return (
    <Link
      to={`/read/${read.id}`}
      state={{ from: '/home' }}
      {...trail}
      className="read-hero block touch-pan-y rounded-3xl p-5 ipad:p-6"
    >
      <div
        ref={overlay}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-3xl"
      />
      <div className="flex items-start gap-5">
        <BookCover
          book={{
            title: read.book.title,
            coverUrl: read.book.coverUrl,
            isbn13: null,
            isbn10: null,
          }}
          author={read.book.authors[0]}
          className="w-20 shrink-0 self-start shadow-[0_12px_26px_-12px_rgba(50,30,15,0.65)] ipad:w-24"
          rounded="rounded-lg"
        />
        <div className="min-w-0 flex-1 pt-1">
          <Eyebrow className="block text-accent">{solo ? 'Reading solo' : `with ${buddyName}`}</Eyebrow>
          <h3 className="mt-2 text-balance font-display text-2xl leading-[1.1] text-text ipad:text-3xl">
            {read.book.title}
          </h3>
        </div>
      </div>
      <div className="mt-5 space-y-3.5">
        <HeroRow label="You" frac={fractionFor(read, uid)} tone="accent" />
        {buddy && <HeroRow label={buddyFirst} frac={fractionFor(read, buddy.uid)} tone="gold" />}
      </div>
    </Link>
  )
}

/** How a circle event reads — what the buddy did with the book. */
function verbFor(e: CircleEvent): string {
  if (e.type === 'reviewed') return e.rating != null ? 'rated this' : 'wrote about this'
  if (e.shelf === 'favorite') return 'loved this'
  if (e.shelf === 'read') return 'finished this'
  return 'added this'
}

/**
 * One line of circle activity — a buddy shelved, finished, or reviewed a book.
 * It's a quiet way to keep in touch with what your people are reading, *not* a
 * call to action: tapping opens the book, nothing more. No "read together" CTA
 * lives here — that belongs on the book and a friend's profile, not stamped on
 * every passing update.
 */
function CircleEventCard({ event }: { event: CircleEvent }) {
  const { actor, book } = event
  return (
    <Link
      to={`/book/${book.id}`}
      state={{ from: '/home' }}
      className="group flex items-start gap-3.5 rounded-xl border border-border-soft bg-surface/40 px-3.5 py-3 transition-colors hover:border-accent/30 hover:bg-surface/70"
    >
      <BookCover
        book={{ title: book.title, coverUrl: book.coverUrl, isbn13: null, isbn10: null }}
        author={book.authors[0]}
        className="w-11 shrink-0"
        rounded="rounded-md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Avatar
            src={actor.photoURL}
            name={actor.name}
            tone={actor.photoURL ? undefined : 'gold'}
            size="h-4 w-4"
          />
          <Eyebrow className="truncate">
            {firstName(actor.name)} {verbFor(event)}
          </Eyebrow>
        </div>
        <h3 className="mt-1 truncate font-display text-base font-medium leading-tight text-text-muted transition-colors group-hover:text-text">
          {book.title}
        </h3>
        {event.type === 'reviewed' && event.rating != null && (
          <div className="mt-1">
            <StarRating
              value={event.rating}
              size="text-[13px]"
              fillColor="var(--gold)"
              trackColor="var(--border)"
            />
          </div>
        )}
        {event.type === 'reviewed' && event.review && (
          <p className="mt-1 line-clamp-2 text-pretty font-display text-sm italic leading-snug text-text-muted">
            “{event.review}”
          </p>
        )}
      </div>
    </Link>
  )
}

/**
 * The signed-in home — a warm greeting, your active buddy reads, and a window
 * onto your circle: what your buddies have lately shelved, finished, or reviewed
 * (a feed to keep in touch, never a call to action). When the circle's quiet it
 * falls back to your own to-read shelf, then to a literary line.
 */
export function Home() {
  const { user, userDoc } = useAuth()
  const { active, loading } = useReads()
  const { friends } = useFriends()
  const { items: myLibrary, loading: libLoading } = useLibrary()
  const uid = user?.uid ?? ''

  // null = the circle hasn't been read yet (don't decide the layout until it is).
  // With no friends there's nothing to fetch, so that case is derived, not set.
  const [fetched, setFetched] = useState<CircleEvent[] | null>(null)
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
    fetchCircleFeed(friends, uid)
      .then((f) => !cancelled && setFetched(f))
      .catch(() => !cancelled && setFetched([]))
    return () => {
      cancelled = true
    }
  }, [friends, uid])

  const feed: CircleEvent[] | null = friends.length === 0 ? [] : fetched

  const firstNameOfUser = firstName(userDoc?.displayName ?? user?.displayName ?? 'reader')

  const myTbr: LibraryBook[] = booksOnShelf(myLibrary, 'tbr').map((i) => i.book)
  const nextReady = feed !== null && !libLoading

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
            <section className="mt-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                <Eyebrow className="text-accent">Reading now</Eyebrow>
              </div>
              <ul className="space-y-4">
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

          {/* The circle's recent activity, then your own to-read shelf, then a
              line. Held until resolved so it never flashes one tier then another. */}
          {nextReady &&
            (feed.length > 0 ? (
              <section className="mt-10">
                <Eyebrow className="mb-3 block">From your circle</Eyebrow>
                <ul className="space-y-2.5">
                  {feed.map((e) => (
                    <li key={e.id}>
                      <CircleEventCard event={e} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : myTbr.length > 0 ? (
              <section className="mt-10">
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
