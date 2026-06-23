import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BookCover } from '../components/BookCover'
import { Eyebrow } from '../components/Eyebrow'
import { useAuth } from '../auth/useAuth'
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

/**
 * The signed-in home — a quiet hub while the shelf is empty (reads are M4). A
 * warm greeting, the shelf's honest "nothing yet", a curated row to begin a read
 * with, and a nudge to bring a buddy in. M4 fills the shelf with active reads.
 */
export function Home() {
  const { user, userDoc } = useAuth()
  const [copied, setCopied] = useState(false)

  const firstName = (userDoc?.displayName ?? user?.displayName ?? 'reader')
    .trim()
    .split(' ')[0]

  const copyInvite = async () => {
    if (!userDoc?.inviteCode) return
    try {
      await navigator.clipboard.writeText(userDoc.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked — the code is on screen to copy by hand.
    }
  }

  return (
    <AppShell>
      {/* Greeting */}
      <section>
        <p className="font-display text-xl italic text-text-muted">
          {greeting()}, {firstName}.
        </p>
        <h1 className="mt-1 font-display text-4xl text-text">Your shelf</h1>
      </section>

      {/* Shelf status — honest empty until M4 */}
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
            Start a read — alone or with a buddy — and it'll settle in here.
          </span>
        </span>
        <span
          className="font-mono text-lg text-text-faint"
          aria-hidden="true"
        >
          ›
        </span>
      </Link>

      {/* Curated picks */}
      <section className="mt-9">
        <div className="flex items-baseline justify-between">
          <Eyebrow>A few to begin with</Eyebrow>
          <Link
            to="/search"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-accent"
          >
            Search all ›
          </Link>
        </div>
        <ul className="-mx-5 mt-3 flex gap-4 overflow-x-auto px-5 pb-2 ipad:-mx-8 ipad:px-8">
          {STARTERS.map((s) => (
            <li key={s.title} className="w-28 shrink-0">
              <Link
                to={`/search?q=${encodeURIComponent(`${s.title} ${s.author}`)}`}
                className="group block"
              >
                <BookCover
                  book={{
                    title: s.title,
                    coverUrl: starterCover(s.coverId),
                    isbn13: null,
                    isbn10: null,
                  }}
                  author={s.author}
                  tone={s.tone}
                  className="w-full transition-transform group-hover:-translate-y-0.5"
                />
                <p className="mt-2 line-clamp-2 font-display text-sm font-medium leading-tight text-text">
                  {s.title}
                </p>
                <p className="truncate text-xs text-text-muted">{s.author}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Bring a buddy in */}
      <section className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <Eyebrow className="block">Read with someone</Eyebrow>
        <p className="mt-2 text-pretty leading-relaxed text-text-muted">
          BuddyRead is better with a buddy. Share your code, or add theirs.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copyInvite}
            disabled={!userDoc?.inviteCode}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-border bg-surface-alt px-4 py-2 transition-colors hover:border-accent/50 disabled:opacity-50"
          >
            <span className="font-mono text-sm tracking-[0.16em] text-accent">
              {userDoc?.inviteCode ?? '••••••'}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-faint">
              {copied ? '✓ copied' : '⧉ copy'}
            </span>
          </button>
          <Link
            to="/friends"
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
          >
            Find a friend
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
