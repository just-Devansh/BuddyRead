import { AppShell } from '../components/AppShell'

/**
 * The signed-in home. A stub for M0 — it proves the shell, the tokens and the
 * voice. M4/M5 fill this with active reads and the split progress card.
 */
export function Home() {
  return (
    <AppShell>
      <section>
        <h1 className="font-display text-3xl text-text">Your shelf</h1>
        <p className="mt-1 text-text-muted">Where current reads will live.</p>
      </section>

      <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
        <p className="font-display text-xl text-text">Nothing on the go yet</p>
        <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-text-muted">
          When you start a read — alone or with a buddy — it'll settle in here,
          spine out, waiting for you.
        </p>
        <button
          type="button"
          disabled
          className="mt-6 inline-flex cursor-not-allowed items-center justify-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-muted"
          title="Coming in a later milestone"
        >
          Find a book
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-text-muted">
        M0 skeleton · the rest is on its way.
      </p>
    </AppShell>
  )
}
