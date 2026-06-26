import { forwardRef } from 'react'
import { Avatar, type AvatarTone } from './Avatar'
import { StarRating } from './StarRating'
import { formatRating } from '../lib/rating'
import type { FinishEntry, ProgressEntry, ReadBook } from '../lib/reads'

/**
 * The keepsake — the artifact a finished buddy read leaves behind. Designed to be
 * screenshotted *and* exported to PNG, so it carries an explicit light/dark
 * palette of its own rather than leaning on the app's themed tokens (which follow
 * whatever theme is painted). That determinism is what lets you download it in
 * either mode regardless of how the app is currently set.
 */

/** The keepsake's natural width in px. Fixed, so PNG export is deterministic;
 *  {@link FitToWidth} scales it down to fit smaller screens. */
export const KEEPSAKE_WIDTH = 400

type Mode = 'light' | 'dark'

interface Palette {
  bg: string
  panel: string
  panelAlt: string
  text: string
  muted: string
  faint: string
  border: string
  borderSoft: string
  accent: string
  gold: string
}

const PALETTE: Record<Mode, Palette> = {
  light: {
    bg: '#eae0cc',
    panel: '#f4ecdb',
    panelAlt: '#fbf5e9',
    text: '#2b231b',
    muted: '#7a6a56',
    faint: '#9b8a6f',
    border: '#d4c7ac',
    borderSoft: '#ddd0b6',
    accent: '#8a4536',
    gold: '#a8822f',
  },
  dark: {
    bg: '#1c1813',
    panel: '#262019',
    panelAlt: '#15110b',
    text: '#ebe0cb',
    muted: '#9c8b73',
    faint: '#7d6e54',
    border: '#3c3326',
    borderSoft: '#332b21',
    accent: '#c07458',
    gold: '#c7a24e',
  },
}

export interface KeepsakeSide {
  name: string
  src?: string | null
  finish: FinishEntry
  progress?: ProgressEntry
}

const monthDay = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** One reader's verdict, centred. Their accent echoes the split card: you in
 *  terracotta, your buddy in gold. */
function Verdict({
  side,
  color,
  tone,
  p,
}: {
  side: KeepsakeSide
  color: string
  tone: AvatarTone
  p: Palette
}) {
  const f = side.finish
  const first = side.name.trim().split(' ')[0]
  return (
    <div className="flex flex-col items-center px-2 text-center">
      <div className="flex items-center gap-2">
        <Avatar
          src={side.src}
          name={side.name}
          tone={side.src ? undefined : tone}
          size="h-8 w-8"
        />
        <span className="font-display text-[19px] font-semibold" style={{ color: p.text }}>
          {first}
        </span>
        {f.favorite && (
          <span aria-hidden="true" style={{ color }}>
            ♥
          </span>
        )}
      </div>

      {f.dnf ? (
        <p className="mt-2 font-display text-[15px] italic" style={{ color: p.faint }}>
          Set it down
          {side.progress ? `, at p.${side.progress.currentPage}` : ''}
        </p>
      ) : f.rating != null ? (
        <div className="mt-2.5 flex flex-col items-center gap-1">
          <StarRating value={f.rating} size="text-[19px]" fillColor={color} trackColor={p.borderSoft} />
          <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: p.muted }}>
            {formatRating(f.rating)} / 5
          </span>
        </div>
      ) : (
        <p className="mt-2 font-display text-[15px] italic" style={{ color: p.faint }}>
          Finished
        </p>
      )}

      {f.review && (
        <p
          className="mt-2.5 font-display text-[16px] italic leading-snug"
          style={{ color: p.muted }}
        >
          “{f.review}”
        </p>
      )}
    </div>
  )
}

export const KeepsakeCard = forwardRef<
  HTMLDivElement,
  {
    book: ReadBook
    you: KeepsakeSide
    buddy: KeepsakeSide
    startedAt: number | null
    mode: Mode
  }
>(function KeepsakeCard({ book, you, buddy, startedAt, mode }, ref) {
  const p = PALETTE[mode]
  const finishedAt = Math.max(
    you.finish.finishedAt?.toMillis() ?? 0,
    buddy.finish.finishedAt?.toMillis() ?? 0,
  )
  const nights =
    startedAt && finishedAt
      ? Math.max(1, Math.round((finishedAt - startedAt) / 86_400_000))
      : null

  return (
    <div
      ref={ref}
      className="relative w-[400px] overflow-hidden rounded-[26px] font-body"
      style={{
        background: `radial-gradient(125% 90% at 50% -10%, ${p.panel} 0%, ${p.bg} 78%)`,
        color: p.text,
        boxShadow: `inset 0 0 0 1px ${p.border}, inset 0 0 0 7px ${p.bg}, inset 0 0 0 8px ${p.borderSoft}`,
      }}
    >
      <div className="relative px-9 pb-8 pt-9">
        {/* Header */}
        <p
          className="text-center font-mono text-[9.5px] uppercase tracking-[0.32em]"
          style={{ color: p.faint }}
        >
          A read, finished together
        </p>
        <div
          className="mx-auto mt-3 h-px w-12"
          style={{ background: p.border }}
          aria-hidden="true"
        />

        {/* Book */}
        <div className="mt-7 flex justify-center">
          <div
            className="relative h-[186px] w-[124px] rounded-[5px]"
            style={{ boxShadow: `0 20px 30px -16px rgba(0,0,0,0.55)` }}
          >
            {/* Typographic fallback, behind the cover */}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-[5px] p-3 text-center"
              style={{ background: p.panelAlt, border: `1px solid ${p.border}` }}
            >
              <span className="font-display text-[15px] font-semibold leading-tight" style={{ color: p.muted }}>
                {book.title}
              </span>
            </div>
            {book.coverUrl && (
              <img
                src={book.coverUrl}
                alt={book.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full rounded-[5px] object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
            {/* Thin page-block edge for thickness */}
            <span
              className="absolute -right-[3px] top-[3%] bottom-[3%] w-[3px] rounded-r-[2px]"
              style={{
                background:
                  'repeating-linear-gradient(180deg,#efe4cf 0 1.2px,#cdbd9e 1.2px 2.4px)',
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Title + author */}
        <h2
          className="mt-6 text-center font-display text-[27px] font-semibold leading-tight"
          style={{ color: p.text }}
        >
          {book.title}
        </h2>
        {book.authors.length > 0 && (
          <p className="mt-1 text-center font-display text-[16px] italic" style={{ color: p.muted }}>
            {book.authors.join(', ')}
          </p>
        )}

        {/* Dates */}
        {nights && finishedAt && (
          <p
            className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: p.faint }}
          >
            {startedAt ? `${monthDay(startedAt)} – ` : ''}
            {monthDay(finishedAt)} · {nights} {nights === 1 ? 'night' : 'nights'} together
          </p>
        )}

        {/* Ornament */}
        <p className="mt-6 text-center text-[22px] leading-none" style={{ color: p.muted }} aria-hidden="true">
          ❧
        </p>

        {/* Verdicts */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Verdict side={you} color={p.accent} tone="terracotta" p={p} />
          <Verdict side={buddy} color={p.gold} tone="gold" p={p} />
        </div>

        {/* Footer wordmark */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="h-px w-6" style={{ background: p.borderSoft }} aria-hidden="true" />
          <span
            className="font-mono text-[9px] uppercase tracking-[0.3em]"
            style={{ color: p.faint }}
          >
            BuddyRead
          </span>
          <span className="h-px w-6" style={{ background: p.borderSoft }} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
})
