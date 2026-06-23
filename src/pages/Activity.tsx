import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Eyebrow } from '../components/Eyebrow'
import { useConfirm } from '../components/useConfirm'
import { useReads } from '../reads/useReads'
import { acceptReadRequest, removeRead } from '../lib/reads'

const PILL = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50'

/**
 * The in-app inbox. Today it carries buddy-read requests — someone asking to
 * read a book with you, to accept or decline — plus the ones you're waiting on.
 * Logged-pages and notes join the feed as the co-read loop fills out.
 */
export function Activity() {
  const { incoming, outgoing } = useReads()
  const { confirm, dialog } = useConfirm()
  const [busy, setBusy] = useState<string | null>(null)

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id)
    try {
      await fn()
    } finally {
      setBusy(null)
    }
  }

  const nothing = incoming.length === 0 && outgoing.length === 0

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-text">Activity</h1>

      {nothing && (
        <section className="mt-8 rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
          <p className="font-display text-2xl text-text">All quiet</p>
          <p className="mx-auto mt-2 max-w-sm text-pretty leading-relaxed text-text-muted">
            When a buddy asks to read a book with you, it'll arrive here to accept
            or decline.
          </p>
        </section>
      )}

      {/* Incoming read requests */}
      {incoming.length > 0 && (
        <section className="mt-6">
          <Eyebrow className="mb-3 block">Wanting to read with you</Eyebrow>
          <ul className="space-y-3">
            {incoming.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-accent/40 bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={r.fromPhotoURL} name={r.fromName} size="h-10 w-10" />
                  <p className="min-w-0 flex-1 leading-snug text-text">
                    <strong className="font-semibold">{r.fromName ?? 'A reader'}</strong>{' '}
                    wants to read{' '}
                    <em className="font-display italic">{r.book.title}</em> with you.
                  </p>
                </div>
                <div className="mt-3 flex gap-2.5">
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, () => acceptReadRequest(r.id))}
                    className={`${PILL} flex-1 bg-accent text-accent-contrast hover:opacity-90`}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: 'Decline this read?',
                          message: `${r.fromName ?? 'They'} won't be notified, and can ask again later.`,
                          confirmLabel: 'Decline',
                        })
                      )
                        void act(r.id, () => removeRead(r.id))
                    }}
                    className={`${PILL} flex-1 border border-border bg-surface-alt text-text-muted hover:text-text`}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Outgoing — waiting on them */}
      {outgoing.length > 0 && (
        <section className="mt-8">
          <Eyebrow className="mb-3 block">Waiting on a reply</Eyebrow>
          <ul>
            {outgoing.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 border-t border-border-soft py-3.5"
              >
                <Avatar src={r.toPhotoURL} name={r.toName} size="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-text">
                    <em className="font-display italic">{r.book.title}</em>
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint">
                    Asked {r.toName ?? 'them'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={async () => {
                    if (
                      await confirm({
                        title: 'Withdraw this invitation?',
                        message: `We'll cancel your request to read “${r.book.title}” with ${r.toName ?? 'them'}. You can send it again anytime.`,
                        confirmLabel: 'Withdraw',
                      })
                    )
                      void act(r.id, () => removeRead(r.id))
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text disabled:opacity-50"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {nothing && (
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint">
          <Link to="/home" className="transition-colors hover:text-accent">
            Start a read ›
          </Link>
        </p>
      )}

      {dialog}
    </AppShell>
  )
}
