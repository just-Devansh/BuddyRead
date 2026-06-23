import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Eyebrow } from '../components/Eyebrow'
import { StarRating } from '../components/StarRating'
import {
  REQUEST,
  TODAY,
  YESTERDAY,
  type ActivityItem,
  type Part,
} from '../demo/activity'

/** Render a run of emphasised text from demo parts. */
function Line({ parts }: { parts: Part[] }) {
  return (
    <span className="text-text">
      {parts.map((p, i) =>
        p.strong ? (
          <strong key={i} className="font-semibold">
            {p.t}
          </strong>
        ) : p.em ? (
          <em key={i} className="font-display italic">
            {p.t}
          </em>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </span>
  )
}

function Feed({ item }: { item: ActivityItem }) {
  return (
    <li className="flex items-start gap-3 border-t border-border-soft py-3">
      <Avatar name={item.initial} tone={item.tone} size="h-9 w-9" />
      <div className="min-w-0 flex-1">
        <p className="leading-snug">
          <Line parts={item.parts} />
          {item.stars != null && (
            <span className="ml-1.5 inline-flex translate-y-0.5">
              <StarRating value={item.stars} showValue={false} />
            </span>
          )}
        </p>
        {item.quote && (
          <p className="mt-1 font-display italic text-text-muted">{item.quote}</p>
        )}
        <p className="mt-1 font-mono text-[9px] tracking-[0.06em] text-text-faint">
          {item.meta}
        </p>
      </div>
    </li>
  )
}

/**
 * The in-app inbox — a reading request to act on, then the quiet feed of what
 * your buddies have been up to. Presentational until M4 wires real reads.
 */
export function Activity() {
  return (
    <AppShell>
      <h1 className="font-display text-3xl text-text">Activity</h1>

      {/* Pending reading request */}
      <section className="mt-4 rounded-2xl border border-accent/40 bg-surface p-4">
        <Eyebrow className="mb-2 block text-accent">⟡ Reading request</Eyebrow>
        <p className="leading-snug text-text">
          <strong className="font-semibold">{REQUEST.who}</strong> wants to read{' '}
          <em className="font-display italic">{REQUEST.book}</em> with you.
        </p>
        <div className="mt-3 flex gap-2.5">
          <button
            type="button"
            className="flex-1 rounded-lg bg-accent py-2.5 text-sm text-accent-contrast transition-opacity hover:opacity-90"
          >
            Accept
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg border border-border bg-surface-alt py-2.5 text-sm text-text-muted transition-colors hover:text-text"
          >
            Later
          </button>
        </div>
      </section>

      <Eyebrow className="mb-1 mt-7 block">Today</Eyebrow>
      <ul>
        {TODAY.map((item) => (
          <Feed key={item.id} item={item} />
        ))}
      </ul>

      <Eyebrow className="mb-1 mt-5 block">Yesterday</Eyebrow>
      <ul>
        {YESTERDAY.map((item) => (
          <Feed key={item.id} item={item} />
        ))}
      </ul>
    </AppShell>
  )
}
