import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BookCover } from '../components/BookCover'
import { StarterBook } from '../components/StarterBook'
import { Eyebrow } from '../components/Eyebrow'
import { ProgressBar } from '../components/ProgressBar'
import { useAuth } from '../auth/useAuth'
import { useReads } from '../reads/useReads'
import { fractionFor, otherReader, type Read } from '../lib/reads'
import { STARTERS, starterCover } from '../lib/starters'

/** Time-of-day greeting — always an actual greeting, never a goodbye. */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
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
      className="flex gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
    >
      <BookCover
        book={{
          title: read.book.title,
          coverUrl: read.book.coverUrl,
          isbn13: null,
          isbn10: null,
        }}
        author={read.book.authors[0]}
        className="w-14 shrink-0"
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

/**
 * The signed-in home — a warm greeting, your active buddy reads, and a curated
 * row to begin another. Active reads are live via ReadsProvider; the curated
 * picks are an editorial starter set.
 */
export function Home() {
  const { user, userDoc } = useAuth()
  const { active, loading } = useReads()
  const uid = user?.uid ?? ''

  const firstName = (userDoc?.displayName ?? user?.displayName ?? 'reader')
    .trim()
    .split(' ')[0]

  return (
    <AppShell>
      {/* Greeting */}
      <section className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-xl italic text-text-muted">
            {greeting()}, {firstName}.
          </p>
          <h1 className="mt-1 font-display text-4xl text-text">Your nook</h1>
        </div>
        <Link
          to="/search"
          state={{ from: '/home' }}
          aria-label="Add a book"
          title="Add a book"
          className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-accent shadow-[0_8px_20px_-12px_rgba(111,61,48,0.6)] transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:bg-surface-alt active:translate-y-0"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
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

      {/* Curated picks */}
      <section className="mt-9">
        <div className="flex items-baseline justify-between">
          <Eyebrow>{active.length > 0 ? 'Begin another' : 'A few to begin with'}</Eyebrow>
          <Link
            to="/search"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-accent"
          >
            Search all ›
          </Link>
        </div>
        <ul className="no-scrollbar mt-3 flex snap-x snap-proximity scroll-smooth gap-4 overflow-x-auto pt-3 pb-5 pr-6">
          {STARTERS.map((s, i) => (
            <li
              key={s.title}
              className="unfurl-book w-28 shrink-0 snap-start"
              style={{ animationDelay: `${i * 85}ms` }}
            >
              <StarterBook
                title={s.title}
                author={s.author}
                coverUrl={starterCover(s.coverId)}
                tone={s.tone}
                to={`/search?q=${encodeURIComponent(`${s.title} ${s.author}`)}`}
              />
              <p className="mt-2 line-clamp-2 font-display text-sm font-medium leading-tight text-text">
                {s.title}
              </p>
              <p className="truncate text-xs text-text-muted">{s.author}</p>
            </li>
          ))}
        </ul>
      </section>
        </>
      )}
    </AppShell>
  )
}
