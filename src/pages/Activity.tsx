import { AppShell } from '../components/AppShell'

/**
 * The in-app inbox — what your buddies have been up to. Empty until M4 wires up
 * reads and the activity it generates (logged pages, notes, finished books).
 */
export function Activity() {
  return (
    <AppShell>
      <h1 className="font-display text-3xl text-text">Activity</h1>

      <section className="mt-8 rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
        <p className="font-display text-2xl text-text">All quiet</p>
        <p className="mx-auto mt-2 max-w-sm text-pretty leading-relaxed text-text-muted">
          When you and a buddy are reading together, the pages you each log and
          the lines you mark will gather here.
        </p>
      </section>
    </AppShell>
  )
}
