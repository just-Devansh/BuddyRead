import { useMemo } from 'react'
import { useMoonlight } from '../lib/moonlight'

/**
 * The Starry Night backdrop — a painterly deep-blue sky rendered behind the
 * content on the main screens whenever the Starry palette is chosen (mounted by
 * DeviceFrame). Pure DOM + CSS: the container paints the sky gradient, a seeded
 * RNG scatters the stars once (so they hold still across re-renders), and the
 * animations (twinkle, drift, sparkle, meteor) live in index.css so
 * prefers-reduced-motion can still them into a calm fixed starfield.
 *
 * A real hill-station sky is mostly *still* points of light with a handful that
 * twinkle — so most stars here are static, a minority twinkle, and a few bright
 * ones glow. The dense faint field is tied to the moon: when the moon is lit its
 * light washes the small stars out (fewer stars); tap it dark and the sky fills
 * in (see `--sky-dim` / `.is-moonlit`).
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
  baseOpacity: number
}

const STAR_COLORS = ['#f6f8ff', '#cdddff', '#a8c4ff', '#dcecff', '#f3e2ff']

function buildStars(seed: number, count: number): Star[] {
  const r = mulberry32(seed)
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    // ~45% cluster along a soft diagonal milky-way band for depth; the rest
    // scatter across the upper ~92% so text lower down stays legible.
    let x: number
    let y: number
    if (r() < 0.45) {
      const t = r()
      x = 2 + t * 96 + (r() - 0.5) * 22
      y = 2 + t * 60 + (r() - 0.5) * 22
    } else {
      x = r() * 100
      y = r() * 92
    }
    x = Math.max(0, Math.min(100, x))
    y = Math.max(0, Math.min(92, y))

    // Mostly still points; a minority twinkle; a few bright glowing ones.
    const roll = r()
    const tier: Tier = roll < 0.14 ? 'twinkle' : roll < 0.28 ? 'bright' : 'faint'

    let size = tier === 'faint' ? 0.5 + r() * 1.1 : 1 + r() * 1.9
    const hue = r()
    const color =
      hue > 0.9 ? STAR_COLORS[4] : hue > 0.7 ? STAR_COLORS[2] : hue > 0.5 ? STAR_COLORS[1] : hue > 0.34 ? STAR_COLORS[3] : STAR_COLORS[0]
    const glowy = tier === 'bright' && r() > 0.4
    if (glowy) size += 0.8

    stars.push({
      left: `${x.toFixed(2)}%`,
      top: `${y.toFixed(2)}%`,
      size,
      color,
      glow: glowy ? `0 0 ${(size * 2.8).toFixed(1)}px ${(size * 0.9).toFixed(1)}px rgba(180,206,255,.8)` : undefined,
      tier,
      dur: `${(2.2 + r() * 4.6).toFixed(2)}s`,
      delay: `${(r() * 6).toFixed(2)}s`,
      baseOpacity: tier === 'faint' ? 0.3 + r() * 0.55 : 0.55 + r() * 0.45,
    })
  }
  return stars
}

/** Shooting stars, thrown in every direction — the container is rotated to the
 *  travel angle and the streak animates along its own axis, so `angle` alone
 *  aims it up, down, sideways, or diagonally. Staggered on long, slow cycles. */
const METEORS = [
  { left: '10%', top: '58px', angle: 28, width: 150, dur: '19s', delay: '2s' },
  { left: '72%', top: '44px', angle: 123, width: 120, dur: '24s', delay: '9s' },
  { left: '46%', top: '30px', angle: 205, width: 132, dur: '27s', delay: '15s' },
  { left: '86%', top: '230px', angle: 250, width: 110, dur: '22s', delay: '21s' },
  { left: '20%', top: '300px', angle: 340, width: 128, dur: '25s', delay: '31s' },
  { left: '58%', top: '150px', angle: 78, width: 116, dur: '21s', delay: '38s' },
]

const SPARKLES = [
  { left: '12%', top: '14%', glyph: '✦', size: 24, color: '#eef4ff', dur: '4.6s', delay: '0.2s' },
  { left: '73%', top: '9%', glyph: '✦', size: 16, color: '#cfe0ff', dur: '5.4s', delay: '1.1s' },
  { left: '31%', top: '7%', glyph: '✧', size: 13, color: '#e6f0ff', dur: '3.8s', delay: '0.6s' },
  { left: '56%', top: '20%', glyph: '✦', size: 18, color: '#cfe0ff', dur: '6s', delay: '2s' },
  { left: '44%', top: '30%', glyph: '✧', size: 12, color: '#f2f7ff', dur: '4.2s', delay: '1.6s' },
  { left: '84%', top: '40%', glyph: '✧', size: 14, color: '#cfe0ff', dur: '5.1s', delay: '2.4s' },
  { left: '22%', top: '44%', glyph: '✦', size: 15, color: '#dbe8ff', dur: '4.8s', delay: '0.9s' },
]

export function StarryNightSky() {
  const lit = useMoonlight()
  // Seeded once per mount; the same seed lays an identical sky every time.
  const stars = useMemo(() => buildStars(1337, 340), [])

  return (
    <div
      aria-hidden="true"
      className={`starry-sky pointer-events-none absolute inset-0 z-0 overflow-hidden ${lit ? 'is-moonlit' : ''}`}
    >
      {/* Faint milky-way band — a soft diagonal wash the clustered stars sit in. */}
      <div
        className="sky-band absolute"
        style={{
          left: '-24%',
          top: '-8%',
          width: '150%',
          height: '300px',
          transform: 'rotate(-22deg)',
          background:
            'radial-gradient(ellipse 56% 46% at 52% 46%, rgba(120,170,240,.2), rgba(76,124,206,.09) 48%, transparent 74%)',
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
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(58,110,196,.26), transparent 70%)',
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
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(70,96,200,.18), transparent 70%)',
          ['--drift-dur' as string]: '28s',
          animationDirection: 'alternate-reverse',
        }}
      />

      {/* Stars — mostly still, some twinkling, a few glowing bright. */}
      {stars.map((s, i) => {
        const base: React.CSSProperties = {
          left: s.left,
          top: s.top,
          width: `${s.size.toFixed(2)}px`,
          height: `${s.size.toFixed(2)}px`,
          color: s.color,
          boxShadow: s.glow,
        }
        if (s.tier === 'twinkle') {
          return (
            <span
              key={i}
              className="sky-star sky-twinkle"
              style={{ ...base, opacity: s.baseOpacity, ['--tw-dur' as string]: s.dur, ['--tw-delay' as string]: s.delay }}
            />
          )
        }
        if (s.tier === 'bright') {
          return <span key={i} className="sky-star" style={{ ...base, opacity: s.baseOpacity }} />
        }
        // faint static — its opacity rides --sky-dim (moon-coupled)
        return <span key={i} className="sky-star sky-faint" style={{ ...base, ['--base-op' as string]: s.baseOpacity }} />
      })}

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
            textShadow: '0 0 10px rgba(190,214,255,.85), 0 0 22px rgba(150,180,255,.5)',
            ['--sp-dur' as string]: sp.dur,
            ['--sp-delay' as string]: sp.delay,
          }}
        >
          {sp.glyph}
        </span>
      ))}

      {/* Shooting stars, aimed every which way. */}
      {METEORS.map((m, i) => (
        <div
          key={`met-${i}`}
          className="sky-meteor absolute"
          style={{ left: m.left, top: m.top, transform: `rotate(${m.angle}deg)`, ['--met-delay' as string]: m.delay, animationDuration: m.dur }}
        >
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
      ))}

      {/* Horizon glow, hugging the foot of the sky. */}
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{ background: 'linear-gradient(0deg, rgba(46,86,176,.28), rgba(34,60,140,.1) 52%, transparent)' }}
      />
    </div>
  )
}
