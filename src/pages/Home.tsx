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

/** Time-of-day greeting — warm, and a little knowing past midnight. */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
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

/** An active buddy read on the shelf. */
function ReadCard({ read, uid }: { read: Read; uid: string }) {
  const buddy = otherReader(read, uid)
  const buddyName = buddy.displayName ?? 'Your buddy'
  return (
    <Link
      to={`/read/${read.id}`}
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
        <Eyebrow className="mt-1 block">with {buddyName}</Eyebrow>
        <div className="mt-3 space-y-2">
          <MiniRow label="You" frac={fractionFor(read, uid)} tone="accent" />
          <MiniRow label={buddyName} frac={fractionFor(read, buddy.uid)} tone="gold" />
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
  const { active } = useReads()
  const uid = user?.uid ?? ''

  const firstName = (userDoc?.displayName ?? user?.displayName ?? 'reader')
    .trim()
    .split(' ')[0]

  return (
    <AppShell>
      {/* Greeting */}
      <section>
        <p className="font-display text-xl italic text-text-muted">
          {greeting()}, {firstName}.
        </p>
        <h1 className="mt-1 font-display text-4xl text-text">Your shelf</h1>
      </section>

      {active.length > 0 ? (
        <section className="mt-6">
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
          className="mt-6 flex items-center gap-4 rounded-2xl border border-dashed border-border bg-surface/50 p-5 transition-colors hover:border-accent/40"
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
              Find a book and ask a buddy to read it with you.
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
    </AppShell>
  )
}
