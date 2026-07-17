import { useMemo } from 'react'
import { useMoonlight } from '../lib/moonlight'

/**
 * The Starry Night backdrop — a deep night sky rendered behind the content on the
 * main screens whenever the Starry palette is chosen (mounted by DeviceFrame).
 * Pure DOM + CSS: the container paints the base sky, a seeded RNG scatters a big
 * star field once (so they hold still across re-renders), and the animations
 * (twinkle, drift, sparkle, meteor) live in index.css so prefers-reduced-motion
 * can still them into a calm fixed starfield.
 *
 * Most stars are still points; a minority twinkle; a few glow bright. The bulk —
 * the faint field — lives in one `.sky-faint-layer` whose opacity is dimmed as a
 * single group by the moon: dark moon → the sky blazes with stars over a
 * near-pitch-black ground; lit moon → a blue "moonlight" wash lifts up and the
 * faint field all but vanishes, leaving the brightest few.
 *
 * The whole layer is `pointer-events:none` and clipped to the app column, so it
 * never intercepts a tap and never bleeds past the iPad frame. It does NOT hold
 * the moon — the moon is the tappable nook ornament (see components/Moon).
 */

// A tiny deterministic PRNG (mulberry32) so a given seed always lays the same sky.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Tier = 'twinkle' | 'bright' | 'faint'

interface Star {
  left: string
  top: string
  size: number
  color: string
  glow: string | undefined
  tier: Tier
  dur: string
  delay: string
  opacity: number
}

// Cool whites and blues, threaded with a little lilac so the field relates to
// the moon's glow and the violet surfaces rather than reading as flatly blue.
const STAR_COLORS = ['#f7f8ff', '#cdddff', '#a9c2ff', '#e7dcff', '#f6e8f6']

function buildStars(seed: number, count: number): Star[] {
  const r = mulberry32(seed)
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    // A dense, even field across the whole frame — plus a cluster gathered up
    // toward the MOON (upper-right), so the busiest part of the sky sits by the
    // moon rather than over the hero text on the left.
    let x: number
    let y: number
    if (r() < 0.3) {
      const t = r()
      x = 46 + t * 54 + (r() - 0.5) * 22 // 46→100 — the right/moon side
      y = 2 + t * 30 + (r() - 0.5) * 18 // 2→32 — the upper band
    } else {
      x = r() * 100
      y = r() * 100
    }
    x = Math.max(0, Math.min(100, x))
    y = Math.max(0, Math.min(100, y))

    // Mostly still points; ~9% twinkle; ~11% bright (some glowing).
    const roll = r()
    const tier: Tier = roll < 0.09 ? 'twinkle' : roll < 0.2 ? 'bright' : 'faint'

    let size = tier === 'faint' ? 0.5 + r() * 1.2 : 1 + r() * 1.9
    const hue = r()
    const color =
      hue > 0.9 ? STAR_COLORS[4] : hue > 0.7 ? STAR_COLORS[2] : hue > 0.5 ? STAR_COLORS[1] : hue > 0.34 ? STAR_COLORS[3] : STAR_COLORS[0]
    const glowy = tier === 'bright' && r() > 0.45
    if (glowy) size += 0.9

    stars.push({
      left: `${x.toFixed(2)}%`,
      top: `${y.toFixed(2)}%`,
      size,
      color,
      glow: glowy ? `0 0 ${(size * 2.8).toFixed(1)}px ${(size * 0.9).toFixed(1)}px rgba(180,206,255,.8)` : undefined,
      tier,
      dur: `${(2.2 + r() * 4.6).toFixed(2)}s`,
      delay: `${(r() * 6).toFixed(2)}s`,
      opacity: tier === 'faint' ? 0.45 + r() * 0.5 : 0.6 + r() * 0.4,
    })
  }
  return stars
}

function starEl(s: Star, key: number) {
  const base: React.CSSProperties = {
    left: s.left,
    top: s.top,
    width: `${s.size.toFixed(2)}px`,
    height: `${s.size.toFixed(2)}px`,
    color: s.color,
    boxShadow: s.glow,
    opacity: s.opacity,
  }
  if (s.tier === 'twinkle') {
    return (
      <span
        key={key}
        className="sky-star sky-twinkle"
        style={{ ...base, ['--tw-dur' as string]: s.dur, ['--tw-delay' as string]: s.delay }}
      />
    )
  }
  return <span key={key} className="sky-star" style={base} />
}

/** Shooting stars, thrown in every direction — the OUTER wrapper only holds the
 *  travel angle; the INNER element runs the translate animation, so the keyframe
 *  can't clobber the rotation (which is what pinned them all L→R before). */
const METEORS = [
  { left: '8%', top: '80px', angle: 18, width: 150, dur: '46s', delay: '5s' }, // ~horizontal, L→R
  { left: '80%', top: '60px', angle: 145, width: 132, dur: '52s', delay: '22s' }, // down-left diagonal
  { left: '14%', top: '330px', angle: 315, width: 140, dur: '50s', delay: '38s' }, // bottom-left → top-right
  { left: '58%', top: '300px', angle: 262, width: 118, dur: '56s', delay: '54s' }, // ~vertical, upward
]

// Kept to the right/moon side and lower down — never over the top-left greeting.
// Lilac-white — they cluster by the moon, so they glow the moon's colour.
const SPARKLES = [
  { left: '72%', top: '9%', glyph: '✦', size: 18, color: '#efe6ff', dur: '5.4s', delay: '1.1s' },
  { left: '88%', top: '28%', glyph: '✦', size: 15, color: '#f5efff', dur: '4.6s', delay: '0.2s' },
  { left: '63%', top: '19%', glyph: '✧', size: 12, color: '#e8dcff', dur: '3.8s', delay: '0.6s' },
  { left: '92%', top: '48%', glyph: '✧', size: 13, color: '#e6dcff', dur: '5.1s', delay: '2.4s' },
  { left: '55%', top: '40%', glyph: '✦', size: 14, color: '#ded0ff', dur: '4.8s', delay: '0.9s' },
  { left: '80%', top: '58%', glyph: '✧', size: 12, color: '#f2ecff', dur: '4.2s', delay: '1.6s' },
]

export function StarryNightSky() {
  const lit = useMoonlight()
  // Seeded once per mount; the same seed lays an identical sky every time. A big
  // count so the dark-moon field reads as an immense hill-station sky.
  const stars = useMemo(() => buildStars(1337, 1080), [])
  const faint = useMemo(() => stars.filter((s) => s.tier === 'faint'), [stars])
  const others = useMemo(() => stars.filter((s) => s.tier !== 'faint'), [stars])

  return (
    <div
      aria-hidden="true"
      className={`starry-sky pointer-events-none absolute inset-0 z-0 overflow-hidden ${lit ? 'is-moonlit' : ''}`}
    >
      {/* Moonlit blue wash — only lifts up when the moon is glowing. */}
      <div className="sky-lift" />

      {/* Faint milky-way band — a soft diagonal wash the clustered stars sit in. */}
      <div
        className="sky-band absolute"
        style={{
          left: '-24%',
          top: '-8%',
          width: '150%',
          height: '320px',
          transform: 'rotate(-22deg)',
          background:
            'radial-gradient(ellipse 56% 46% at 52% 46%, rgba(138,152,240,.16), rgba(104,110,214,.07) 48%, transparent 74%)',
          filter: 'blur(16px)',
        }}
      />

      {/* Drifting cloud-glows — soft blue washes crossing slowly. */}
      <div
        className="sky-cloud"
        style={{
          left: '-14%',
          top: '20%',
          width: '74%',
          height: '150px',
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(80,100,208,.2), transparent 70%)',
          ['--drift-dur' as string]: '22s',
        }}
      />
      <div
        className="sky-cloud"
        style={{
          right: '-16%',
          top: '44%',
          width: '80%',
          height: '170px',
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(128,94,210,.16), transparent 70%)',
          ['--drift-dur' as string]: '28s',
          animationDirection: 'alternate-reverse',
        }}
      />

      {/* The faint field — the bulk of the sky, dimmed as one group by the moon. */}
      <div className="sky-faint-layer">{faint.map((s, i) => starEl(s, i))}</div>

      {/* Bright + twinkling stars — always present, whatever the moon's doing. */}
      {others.map((s, i) => starEl(s, i))}

      {/* Hero legibility: a soft pool of the deep night over the TOP-LEFT, where
          the greeting sits, fading out toward the moon and down the page — so the
          words pop over the field without touching the rest of the sky. Sized in
          vh so it only ever covers the hero, and painted above the stars so it
          quiets them there. */}
      <div
        className="absolute left-0 top-0 w-full"
        style={{
          height: '52vh',
          background:
            'radial-gradient(88% 96% at 18% 30%, rgba(2,4,14,0.72) 0%, rgba(2,4,14,0.4) 42%, transparent 72%)',
        }}
      />

      {/* Cross-shaped sparkles — the anime flourish. */}
      {SPARKLES.map((sp, i) => (
        <span
          key={`sp-${i}`}
          className="sky-sparkle"
          style={{
            left: sp.left,
            top: sp.top,
            fontSize: `${sp.size}px`,
            color: sp.color,
            textShadow: '0 0 10px rgba(210,190,255,.85), 0 0 22px rgba(174,148,246,.5)',
            ['--sp-dur' as string]: sp.dur,
            ['--sp-delay' as string]: sp.delay,
          }}
        >
          {sp.glyph}
        </span>
      ))}

      {/* Shooting stars, aimed every which way. */}
      {METEORS.map((m, i) => (
        <div key={`met-${i}`} className="absolute" style={{ left: m.left, top: m.top, transform: `rotate(${m.angle}deg)` }}>
          <div className="sky-meteor" style={{ ['--met-delay' as string]: m.delay, animationDuration: m.dur }}>
            <div className="relative h-0.5" style={{ width: `${m.width}px` }}>
              <div
                className="absolute right-1 top-0 h-[1.5px] rounded"
                style={{
                  width: `${m.width}px`,
                  background: 'linear-gradient(90deg, rgba(206,224,255,0) 0%, rgba(206,224,255,.12) 38%, rgba(244,249,255,.9) 100%)',
                }}
              />
              <div
                className="absolute right-0 -top-[1.5px] h-[5px] w-[5px] rounded-full"
                style={{ background: '#fdfeff', boxShadow: '0 0 8px 2px rgba(200,222,255,.95), 0 0 18px 5px rgba(140,176,255,.5)' }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Horizon glow, hugging the foot of the sky — a violet-blue lift so it
          reads as the same light the moon casts, not a separate blue. */}
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{ background: 'linear-gradient(0deg, rgba(64,52,128,.22), rgba(44,40,102,.08) 52%, transparent)' }}
      />

      {/* A whisper of an edge-frame — the sky darkens at the left/right margins so
          the content column feels held, echoing the DeviceFrame's hairline edges.
          Painted last, over the field, so only the sky (not the cards) is framed. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(2,4,12,0.42) 0%, transparent 10%, transparent 90%, rgba(2,4,12,0.42) 100%)',
        }}
      />
    </div>
  )
}
