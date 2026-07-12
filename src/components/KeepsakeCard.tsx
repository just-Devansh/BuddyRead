import { forwardRef, useEffect, useId, useState } from 'react'
import { Avatar, type AvatarTone } from './Avatar'
import { resolveHiResCover } from '../lib/books'
import { formatRating } from '../lib/rating'
import type { FinishEntry, ProgressEntry, ReadBook } from '../lib/reads'

/**
 * The keepsake — the artifact a finished read leaves behind. Designed to be
 * screenshotted *and* exported to PNG, so it carries an explicit light/dark
 * palette of its own rather than leaning on the app's themed tokens (which
 * follow whatever theme is painted). That determinism is what lets you download
 * it in either mode regardless of how the app is currently set.
 *
 * Ported from the claude.ai/design "BuddyRead Keepsake" reference: a framed
 * parchment/espresso plate — double-rule border, corner ornaments, a lit cover
 * on a page-block, SVG star verdicts, and a brandmark. The design is authored at
 * 1200px, which is exactly this card's export size (400px × the 3× pixelRatio in
 * KeepsakeShareModal), so every measurement here is that design at ⅓ scale.
 */

/** The keepsake's natural width in px. Fixed, so PNG export is deterministic;
 *  {@link FitToWidth} scales it down to fit smaller screens. The design's 1842px
 *  height lands at 614px — used as a minimum so short cards keep the plate's
 *  proportions while a review can still push it taller. */
export const KEEPSAKE_WIDTH = 400
const KEEPSAKE_MIN_HEIGHT = 614

type Mode = 'light' | 'dark'

interface Palette {
  /** The plate's radial ground. */
  bg: string
  text: string
  author: string
  eyebrowText: string
  eyebrowLine: string
  eyebrowArrow: string
  flourishLine: string
  flourishDiamond: string
  datesText: string
  datesDiamond: string
  frameOuter: string
  frameInner: string
  corner: string
  /** The warm central bloom laid over the ground. */
  vignette: string
  /** Inset edge-darkening, scaled from the design's blur/spread. */
  vignetteInset: string
  grainOpacity: number
  grainBlend: string
  coverGlow: string
  coverSpine: string
  coverGloss: string
  coverInset: string
  coverShadow: string
  coverFallbackBg: string
  coverFallbackBorder: string
  pageBlock: string
  floorShadow: string
  /** Ring base tucked between avatar and accent halo (the plate colour). */
  avatarBase: string
  youAccent: string
  buddyAccent: string
  starTrack: string
  ratingText: string
  ampersand: string
  brandLogo: string
  brandWord: string
  brandTagline: string
  reviewText: string
}

const PALETTE: Record<Mode, Palette> = {
  light: {
    bg: 'radial-gradient(118% 86% at 50% 33%, #f6efdf 0%, #ede3cb 52%, #ddd0b2 100%)',
    text: '#2b231b',
    author: '#6f5f49',
    eyebrowText: '#7c6c56',
    eyebrowLine: '#9c8657',
    eyebrowArrow: '#9c8657',
    flourishLine: '#b6a47e',
    flourishDiamond: '#a8843c',
    datesText: '#7c6c56',
    datesDiamond: '#a8843c',
    frameOuter: '#c9b893',
    frameInner: 'rgba(176,138,62,.34)',
    corner: '#a8843c',
    vignette:
      'radial-gradient(64% 47% at 50% 29%, rgba(255,248,228,.95) 0%, rgba(251,240,212,.55) 26%, rgba(244,233,208,.18) 48%, rgba(237,227,203,0) 70%)',
    vignetteInset: 'inset 0 0 77px 19px rgba(120,86,38,.13)',
    grainOpacity: 0.05,
    grainBlend: 'multiply',
    coverGlow:
      'radial-gradient(circle, rgba(255,249,232,.92) 0%, rgba(247,239,221,0) 60%)',
    coverSpine: 'linear-gradient(90deg, rgba(0,0,0,.34), transparent)',
    coverGloss:
      'linear-gradient(116deg, rgba(255,255,255,.4) 0%, rgba(255,255,255,.08) 15%, transparent 36%)',
    coverInset: 'rgba(176,138,62,.45)',
    coverShadow:
      '0 0 28px -1px rgba(255,240,200,.7), 0 13px 20px -8px rgba(44,30,12,.55), 0 3px 7px -3px rgba(44,30,12,.4)',
    coverFallbackBg: '#f1e7d2',
    coverFallbackBorder: 'rgba(176,138,62,.3)',
    pageBlock: 'repeating-linear-gradient(180deg,#efe4ca 0 1px,#cdbf9f 1px 3px)',
    floorShadow:
      'radial-gradient(ellipse at center, rgba(44,28,10,.32), transparent 70%)',
    avatarBase: '#f4ecda',
    youAccent: '#b5573f',
    buddyAccent: '#b89233',
    starTrack: '#decfb1',
    ratingText: '#8a7a60',
    ampersand: '#bfa979',
    brandLogo: '#a8843c',
    brandWord: '#8a6a26',
    brandTagline: '#9b8a6f',
    reviewText: '#8a7a60',
  },
  dark: {
    bg: 'radial-gradient(118% 86% at 50% 32%, #2c2319 0%, #1c150e 55%, #100b07 100%)',
    text: '#f3e9d2',
    author: '#cdbf9f',
    eyebrowText: '#9c8b73',
    eyebrowLine: '#8a7549',
    eyebrowArrow: '#c7a24e',
    flourishLine: '#6f5d3a',
    flourishDiamond: '#c7a24e',
    datesText: '#9c8b73',
    datesDiamond: '#c7a24e',
    frameOuter: '#4a3d29',
    frameInner: 'rgba(199,162,78,.28)',
    corner: '#c7a24e',
    vignette:
      'radial-gradient(64% 47% at 50% 29%, rgba(196,138,64,.52) 0%, rgba(148,98,46,.3) 26%, rgba(82,54,26,.12) 48%, rgba(20,14,9,0) 70%)',
    vignetteInset: 'inset 0 0 80px 21px rgba(0,0,0,.62)',
    grainOpacity: 0.07,
    grainBlend: 'screen',
    coverGlow:
      'radial-gradient(circle, rgba(150,108,52,.45) 0%, rgba(28,21,14,0) 60%)',
    coverSpine: 'linear-gradient(90deg, rgba(0,0,0,.42), transparent)',
    coverGloss:
      'linear-gradient(116deg, rgba(255,255,255,.32) 0%, rgba(255,255,255,.06) 15%, transparent 36%)',
    coverInset: 'rgba(199,162,78,.5)',
    coverShadow:
      '0 0 32px -1px rgba(210,152,76,.42), 0 13px 22px -7px rgba(0,0,0,.8), 0 4px 8px -3px rgba(0,0,0,.6)',
    coverFallbackBg: '#221b12',
    coverFallbackBorder: 'rgba(199,162,78,.3)',
    pageBlock: 'repeating-linear-gradient(180deg,#d8c9a6 0 1px,#9a8a64 1px 3px)',
    floorShadow:
      'radial-gradient(ellipse at center, rgba(0,0,0,.55), transparent 70%)',
    avatarBase: '#1c150e',
    youAccent: '#c98666',
    buddyAccent: '#d8b25e',
    starTrack: '#463a28',
    ratingText: '#9c8b73',
    ampersand: '#a98a52',
    brandLogo: '#c7a24e',
    brandWord: '#d8b25e',
    brandTagline: '#7d6e54',
    reviewText: '#9c8b73',
  },
}

export interface KeepsakeSide {
  name: string
  src?: string | null
  finish: FinishEntry
  progress?: ProgressEntry
}

/** A single 5-pointed star, repeated five times across a 120×24 viewBox. */
const STAR = 'M12 2.6L14.85 8.95L21.7 9.7L16.6 14.35L18 21.1L12 17.6L6 21.1L7.4 14.35L2.3 9.7L9.15 8.95Z'
const STAR_OFFSETS = [0, 24, 48, 72, 96]

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.86' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** The design's star row: a muted track with an accent fill clipped from the
 *  left to `value/5` of the width — any quarter renders cleanly, no glyphs. */
function Stars({
  value,
  fill,
  track,
  width,
}: {
  value: number
  fill: string
  track: string
  width: number
}) {
  const id = useId().replace(/:/g, '')
  const clip = (Math.max(0, Math.min(5, value)) / 5) * 120
  return (
    <svg width={width} height={(width * 24) / 120} viewBox="0 0 120 24" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={clip} height="24" />
        </clipPath>
      </defs>
      <g fill={track}>
        {STAR_OFFSETS.map((x) => (
          <path key={x} transform={`translate(${x} 0)`} d={STAR} />
        ))}
      </g>
      <g fill={fill} clipPath={`url(#${id})`}>
        {STAR_OFFSETS.map((x) => (
          <path key={x} transform={`translate(${x} 0)`} d={STAR} />
        ))}
      </g>
    </svg>
  )
}

/** One filigree corner, rotated into place by the caller's transform. */
function Corner({ color, style }: { color: string; style: React.CSSProperties }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', zIndex: 2, pointerEvents: 'none', ...style }}>
      <svg width="19" height="19" viewBox="0 0 58 58" fill="none">
        <path d="M3 33 L3 9 Q3 3 9 3 L33 3" stroke={color} strokeWidth="1.3" />
        <path d="M13 30 L13 16 Q13 13 16 13 L30 13" stroke={color} strokeWidth=".8" opacity=".5" />
        <circle cx="9" cy="9" r="2.4" fill={color} />
        <path d="M3 33 L3 42 M33 3 L42 3" stroke={color} strokeWidth="1.3" />
      </svg>
    </div>
  )
}

/** One reader's verdict — avatar + name, a star rating (or a "set it down" /
 *  "finished" line), and any review, echoing the split card's colours. */
function Reader({
  side,
  accent,
  tone,
  p,
  big = false,
}: {
  side: KeepsakeSide
  accent: string
  tone: AvatarTone
  p: Palette
  big?: boolean
}) {
  const f = side.finish
  const first = side.name.trim().split(' ')[0]
  const av = big ? 'h-[28px] w-[28px]' : 'h-[27px] w-[27px]'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          className="rounded-full"
          style={{
            boxShadow: `0 0 0 0.7px ${p.avatarBase}, 0 0 0 1.2px ${accent}, 0 3px 7px -3px rgba(0,0,0,.5)`,
          }}
        >
          <Avatar src={side.src} name={side.name} tone={side.src ? undefined : tone} size={av} />
        </span>
        <span
          className="font-display font-semibold"
          style={{ fontSize: big ? '17px' : '15px', color: p.text }}
        >
          {first}
        </span>
        {f.favorite && (
          <span aria-hidden="true" style={{ color: accent, fontSize: big ? '13px' : '11px' }}>
            ♥
          </span>
        )}
      </div>

      {f.dnf ? (
        <p className="mt-2 font-display italic" style={{ fontSize: '11px', color: p.reviewText }}>
          Set it down{side.progress ? `, at p.${side.progress.currentPage}` : ''}
        </p>
      ) : f.rating != null ? (
        <>
          <div style={{ marginTop: '7px' }}>
            <Stars value={f.rating} fill={accent} track={p.starTrack} width={big ? 77 : 70} />
          </div>
          <div
            className="font-mono"
            style={{ fontSize: big ? '6.7px' : '6.3px', letterSpacing: '0.06em', color: p.ratingText, marginTop: '4px' }}
          >
            {formatRating(f.rating)} / 5
          </div>
        </>
      ) : (
        <p className="mt-2 font-display italic" style={{ fontSize: '11px', color: p.reviewText }}>
          Finished
        </p>
      )}

      {f.review && (
        <p
          className="mt-2 font-display italic leading-snug"
          style={{ fontSize: '11px', color: p.reviewText, textAlign: 'center', maxWidth: '11rem' }}
        >
          “{f.review}”
        </p>
      )}
    </div>
  )
}

const monthDay = (ms: number) =>
  new Date(ms)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase()

export const KeepsakeCard = forwardRef<
  HTMLDivElement,
  {
    book: ReadBook
    you: KeepsakeSide
    /** The buddy's side — omit (or null) for a solo read's single-side keepsake. */
    buddy?: KeepsakeSide | null
    startedAt: number | null
    mode: Mode
  }
>(function KeepsakeCard({ book, you, buddy, startedAt, mode }, ref) {
  const p = PALETTE[mode]
  // The cover is shown large and exported at 3×, so pull a higher-res scan than
  // the stored ~128px thumbnail — but only if it resolves to a real cover (a
  // no-preview edition answers hi-res with a placeholder, so we keep the
  // thumbnail). Starts on the thumbnail, upgrades once resolved; the share
  // modal hands down an already-inlined data: URL, which passes straight through.
  const [cover, setCover] = useState(book.coverUrl)
  useEffect(() => {
    let live = true
    void resolveHiResCover(book.coverUrl, book.isbn).then((u) => live && setCover(u))
    return () => {
      live = false
    }
  }, [book.coverUrl, book.isbn])

  const finishedAt = Math.max(
    you.finish.finishedAt?.toMillis() ?? 0,
    buddy?.finish.finishedAt?.toMillis() ?? 0,
  )
  const dateLine = finishedAt
    ? `${startedAt ? `${monthDay(startedAt)} – ` : ''}${monthDay(finishedAt)}, ${new Date(finishedAt).getFullYear()}`
    : null

  const coverRadius = '1px 2px 2px 1px'

  return (
    <div
      ref={ref}
      className="relative w-[400px] overflow-hidden font-body"
      style={{ minHeight: KEEPSAKE_MIN_HEIGHT, borderRadius: '11px', background: p.bg, color: p.text }}
    >
      {/* central bloom + edge-darkening + optional grain — all export-safe */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ zIndex: 0, background: p.vignette }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ zIndex: 1, boxShadow: p.vignetteInset }} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 1, opacity: p.grainOpacity, mixBlendMode: p.grainBlend as React.CSSProperties['mixBlendMode'], backgroundImage: GRAIN }}
      />

      {/* double-rule frame */}
      <div aria-hidden="true" className="pointer-events-none absolute" style={{ zIndex: 1, inset: '9px', border: `1px solid ${p.frameOuter}`, borderRadius: '7px' }} />
      <div aria-hidden="true" className="pointer-events-none absolute" style={{ zIndex: 1, inset: '12px', border: `1px solid ${p.frameInner}`, borderRadius: '5px' }} />

      {/* corner ornaments */}
      <Corner color={p.corner} style={{ left: '7px', top: '7px' }} />
      <Corner color={p.corner} style={{ right: '7px', top: '7px', transform: 'scaleX(-1)' }} />
      <Corner color={p.corner} style={{ left: '7px', bottom: '7px', transform: 'scaleY(-1)' }} />
      <Corner color={p.corner} style={{ right: '7px', bottom: '7px', transform: 'scale(-1,-1)' }} />

      {/* CONTENT */}
      <div
        className="relative flex flex-col items-center"
        style={{ zIndex: 3, minHeight: KEEPSAKE_MIN_HEIGHT, padding: '35px 39px 29px' }}
      >
        {/* eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <svg width="26" height="3.5" viewBox="0 0 78 10" style={{ transform: 'scaleX(-1)' }} aria-hidden="true">
            <line x1="0" y1="5" x2="58" y2="5" stroke={p.eyebrowLine} strokeWidth="1" />
            <path d="M66 1 L70 5 L66 9 L62 5 Z" fill={p.eyebrowArrow} />
          </svg>
          <span className="font-mono uppercase" style={{ fontSize: '6.3px', letterSpacing: '0.34em', color: p.eyebrowText }}>
            {buddy ? 'A Read, Finished Together' : 'A Read, Finished'}
          </span>
          <svg width="26" height="3.5" viewBox="0 0 78 10" aria-hidden="true">
            <line x1="0" y1="5" x2="58" y2="5" stroke={p.eyebrowLine} strokeWidth="1" />
            <path d="M66 1 L70 5 L66 9 L62 5 Z" fill={p.eyebrowArrow} />
          </svg>
        </div>

        {/* book */}
        <div style={{ position: 'relative', width: '127px', height: '187px', marginTop: '20px' }}>
          <div
            aria-hidden="true"
            style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-52%)', width: '253px', height: '253px', background: p.coverGlow, pointerEvents: 'none' }}
          />
          <div
            aria-hidden="true"
            style={{ position: 'absolute', right: '-3px', top: '3px', bottom: '3px', width: '5px', borderRadius: '0 1px 1px 0', background: p.pageBlock, boxShadow: '1px 1px 2px rgba(40,28,12,.3)' }}
          />
          {/* typographic fallback, behind the cover */}
          <div
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', textAlign: 'center', borderRadius: coverRadius, background: p.coverFallbackBg, border: `1px solid ${p.coverFallbackBorder}` }}
          >
            <span className="font-display font-semibold leading-tight" style={{ fontSize: '11px', color: p.author }}>
              {book.title}
            </span>
          </div>
          {cover && (
            <img
              src={cover}
              alt={book.title}
              referrerPolicy="no-referrer"
              style={{ position: 'relative', width: '127px', height: '187px', objectFit: 'cover', borderRadius: coverRadius, boxShadow: p.coverShadow, display: 'block' }}
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '10px', borderRadius: '1px 0 0 1px', background: p.coverSpine, pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: coverRadius, background: p.coverGloss, pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: coverRadius, boxShadow: `inset 0 0 0 1px ${p.coverInset}`, pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: '-13px', transform: 'translateX(-50%)', width: '100px', height: '15px', background: p.floorShadow, pointerEvents: 'none' }} />
        </div>

        {/* title + author */}
        <div className="font-display font-semibold" style={{ fontSize: '28px', lineHeight: 1.02, textAlign: 'center', color: p.text, marginTop: '23px' }}>
          {book.title}
        </div>
        {book.authors.length > 0 && (
          <div className="font-body italic" style={{ fontSize: '13px', color: p.author, marginTop: '2px' }}>
            {book.authors.join(', ')}
          </div>
        )}

        {/* flourish */}
        <svg width="89" height="5" viewBox="0 0 268 14" style={{ marginTop: '10px' }} aria-hidden="true">
          <line x1="0" y1="7" x2="106" y2="7" stroke={p.flourishLine} strokeWidth="1" />
          <circle cx="114" cy="7" r="1.7" fill={p.flourishDiamond} />
          <path d="M134 1 L142 7 L134 13 L126 7 Z" fill="none" stroke={p.flourishDiamond} strokeWidth="1.2" />
          <circle cx="154" cy="7" r="1.7" fill={p.flourishDiamond} />
          <line x1="162" y1="7" x2="268" y2="7" stroke={p.flourishLine} strokeWidth="1" />
        </svg>

        {/* dates */}
        {dateLine && (
          <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', fontSize: '7.3px', letterSpacing: '0.18em', color: p.datesText }}>
            <svg width="2.5" height="2.5" viewBox="0 0 7 7" aria-hidden="true"><path d="M3.5 0 L7 3.5 L3.5 7 L0 3.5 Z" fill={p.datesDiamond} /></svg>
            {dateLine}
            <svg width="2.5" height="2.5" viewBox="0 0 7 7" aria-hidden="true"><path d="M3.5 0 L7 3.5 L3.5 7 L0 3.5 Z" fill={p.datesDiamond} /></svg>
          </div>
        )}

        <div style={{ flex: 1, minHeight: '18px' }} />

        {/* readers */}
        {buddy ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '10px', width: '100%' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Reader side={you} accent={p.youAccent} tone="terracotta" p={p} />
            </div>
            <div className="font-display italic" style={{ fontSize: '27px', lineHeight: 1, color: p.ampersand, marginTop: '5px' }}>
              &amp;
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Reader side={buddy} accent={p.buddyAccent} tone="gold" p={p} />
            </div>
          </div>
        ) : (
          <Reader side={you} accent={p.youAccent} tone="terracotta" p={p} big />
        )}

        <div style={{ flex: 1, minHeight: '18px' }} />

        {/* brandmark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg width="21" height="21" viewBox="0 0 72 72" fill="none" aria-hidden="true">
            <circle cx="36" cy="36" r="34" stroke={p.brandLogo} strokeWidth="1" strokeDasharray="1.2 4.4" opacity=".7" />
            <circle cx="29.5" cy="36" r="14.5" stroke={p.brandLogo} strokeWidth="1.4" />
            <circle cx="42.5" cy="36" r="14.5" stroke={p.brandLogo} strokeWidth="1.4" />
          </svg>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '7px' }}>
            <svg width="32" height="3.3" viewBox="0 0 96 10" style={{ transform: 'scaleX(-1)' }} aria-hidden="true">
              <line x1="14" y1="5" x2="96" y2="5" stroke={p.flourishLine} strokeWidth="1" />
              <path d="M0 1 L4 5 L0 9 Z" fill={p.brandLogo} transform="translate(4 0)" />
              <path d="M8 1 L12 5 L8 9 L4 5 Z" fill={p.brandLogo} />
            </svg>
            <span className="font-display font-semibold" style={{ fontSize: '11px', letterSpacing: '0.44em', textIndent: '0.44em', color: p.brandWord }}>
              BUDDYREAD
            </span>
            <svg width="32" height="3.3" viewBox="0 0 96 10" aria-hidden="true">
              <line x1="0" y1="5" x2="82" y2="5" stroke={p.flourishLine} strokeWidth="1" />
              <path d="M88 1 L92 5 L88 9 L84 5 Z" fill={p.brandLogo} />
            </svg>
          </div>
          <div className="font-mono" style={{ fontSize: '4.3px', letterSpacing: '0.36em', textIndent: '0.36em', color: p.brandTagline, marginTop: '5px' }}>
            READ APART · TOGETHER
          </div>
        </div>
      </div>
    </div>
  )
})
