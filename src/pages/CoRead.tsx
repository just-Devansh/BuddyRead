import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Eyebrow } from '../components/Eyebrow'
import { LogSessionSheet } from '../components/LogSessionSheet'
import { SplitProgressCard } from '../components/SplitProgressCard'
import { DEMO_READ } from '../demo/coread'

/**
 * The co-read screen — the heart of the app. A book strip, the split progress
 * card, the latest note, and a button to log tonight's pages. Demo data until
 * M4 wires reads; the light/dark mockup variants are just the theme toggle.
 */
export function CoRead() {
  const [logging, setLogging] = useState(false)
  const { you, buddy, note } = DEMO_READ

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Link
          to="/home"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
        >
          ‹ Shelf
        </Link>
        <Eyebrow>Reading together</Eyebrow>
        <span className="w-10" />
      </div>

      {/* Book strip */}
      <div className="mt-5 flex items-center gap-4">
        <div
          className="flex h-[86px] w-[58px] shrink-0 flex-col items-center justify-center rounded-sm px-2 text-center"
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
          <h1 className="font-display text-2xl leading-tight text-text">
            {DEMO_READ.title}
          </h1>
          <p className="text-text-muted">{DEMO_READ.author}</p>
          <Eyebrow className="mt-1.5 block">
            Day {DEMO_READ.day} · begun {DEMO_READ.begun}
          </Eyebrow>
        </div>
      </div>

      {/* The split card */}
      <div className="mt-5">
        <SplitProgressCard you={you} buddy={buddy} paceLine={DEMO_READ.paceLine} />
      </div>

      {/* Latest note */}
      <div className="mt-5 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <Eyebrow>
            {note.author} · {note.when}
          </Eyebrow>
          <span className="font-mono text-[9px] text-text-faint">p.{note.page}</span>
        </div>
        <p className="mt-2 font-display text-lg italic leading-snug text-text-muted">
          {note.text}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setLogging(true)}
        className="mt-6 w-full rounded-xl bg-accent py-4 font-medium text-accent-contrast shadow-[0_12px_24px_-14px_rgba(138,69,54,0.7)] transition-opacity hover:opacity-90"
      >
        Log tonight's pages
      </button>

      <LogSessionSheet
        open={logging}
        startPage={you.page}
        total={you.total}
        edition={you.edition}
        buddyName={buddy.name}
        onClose={() => setLogging(false)}
      />
    </AppShell>
  )
}
