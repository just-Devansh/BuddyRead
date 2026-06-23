import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Eyebrow } from '../components/Eyebrow'
import { ProgressBar } from '../components/ProgressBar'
import { DEMO_READ, fraction } from '../demo/coread'

/**
 * The signed-in home. The reads model is M4, so the active read here is demo
 * data — a window onto the co-read screen. The "Find a book" CTA opens the
 * catalog. When M4 lands, this lists real reads.
 */
export function Home() {
  const { you, buddy } = DEMO_READ

  return (
    <AppShell>
      <section>
        <Eyebrow>Reading together</Eyebrow>
        <h1 className="mt-1 font-display text-4xl text-text">Your shelf</h1>
      </section>

      {/* Reading now — demo (M4) */}
      <section className="mt-7">
        <Eyebrow className="mb-3 block">Reading now</Eyebrow>
        <Link
          to="/read"
          className="flex gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
        >
          <div
            className="flex h-[88px] w-[60px] shrink-0 flex-col items-center justify-center rounded-sm px-2 text-center"
            style={{
              background: 'linear-gradient(160deg,#46503a,#353d2c)',
              boxShadow: 'inset 0 0 0 1px rgba(198,162,78,0.25)',
            }}
          >
            <span className="font-display text-[11px] font-medium leading-tight text-[#d8c79a]">
              {DEMO_READ.title}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl leading-tight text-text">
              {DEMO_READ.title}
            </h2>
            <p className="text-sm text-text-muted">{DEMO_READ.author}</p>
            <Eyebrow className="mt-2 block">
              Day {DEMO_READ.day} · with {buddy.name}
            </Eyebrow>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-10 font-mono text-[10px] text-text-faint">
                  You
                </span>
                <ProgressBar value={fraction(you)} className="flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-10 font-mono text-[10px] text-text-faint">
                  {buddy.name}
                </span>
                <ProgressBar value={fraction(buddy)} tone="gold" className="flex-1" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Start something new */}
      <section className="mt-8 rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
        <p className="font-display text-2xl text-text">Begin another</p>
        <p className="mx-auto mt-2 max-w-sm text-pretty leading-relaxed text-text-muted">
          Find a book and start a read — alone or with a buddy. It'll settle in
          here, spine out, waiting for you.
        </p>
        <Link
          to="/search"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          Find a book
        </Link>
      </section>
    </AppShell>
  )
}
