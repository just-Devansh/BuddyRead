import { useMemo } from 'react'

/**
 * The Starry Night backdrop — a painterly violet sky rendered behind the content
 * on the main screens whenever the Starry palette is chosen (mounted by
 * DeviceFrame). Pure DOM + CSS: the container paints the sky gradient, a seeded
 * RNG scatters the stars once (so they hold still across re-renders), and the
 * animations (twinkle, drift, sparkle, meteor) live in index.css so
 * prefers-reduced-motion can still them into a calm fixed starfield.
 *
 * The whole layer is `pointer-events:none` and clipped to the app column, so it
 * never intercepts a tap and never bleeds past the iPad frame. It does NOT hold
 * the moon — the moon is the tappable nook ornament (see components/Moon), on
 * Home only, just as the lamp was.
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

interface Star {
  left: string
  top: string
  size: number
  color: string
  glow: string | undefined
  dur: string
  delay: string
  baseOpacity: number
}

const STAR_COLORS = ['#f5f2ff', '#cdbcf7', '#a9c2ff', '#f6c9e8']

function buildStars(seed: number, count: number): Star[] {
  const r = mulberry32(seed)
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    // Half the field clusters along a soft diagonal "milky-way" band for depth;
    // the rest scatters across the upper ~90% so text lower down stays clean.
    let x: number
    let y: number
    if (r() < 0.5) {
      const t = r()
      x = 4 + t * 92 + (r() - 0.5) * 20
      y = 2 + t * 58 + (r() - 0.5) * 20
    } else {
      x = r() * 100
      y = r() * 90
    }
    x = Math.max(0, Math.min(100, x))
    y = Math.max(0, Math.min(92, y))
    let size = 0.6 + r() * 2.1
    const hue = r()
    const color = hue > 0.9 ? STAR_COLORS[3] : hue > 0.72 ? STAR_COLORS[1] : hue > 0.58 ? STAR_COLORS[2] : STAR_COLORS[0]
    const bright = r() > 0.8
    if (bright) size += 1
    stars.push({
      left: `${x.toFixed(2)}%`,
      top: `${y.toFixed(2)}%`,
      size,
      color,
      glow: bright ? `0 0 ${(size * 2.8).toFixed(1)}px ${(size * 0.9).toFixed(1)}px rgba(190,212,255,.75)` : undefined,
      dur: `${(2.2 + r() * 4.4).toFixed(2)}s`,
      delay: `${(r() * 6).toFixed(2)}s`,
      baseOpacity: 0.32 + r() * 0.6,
    })
  }
  return stars
}

/** Slow shooting stars crossing near the top — staggered so one is usually
 *  streaking somewhere across the hero without them ever bunching up. */
const METEORS = [
  { left: '20px', top: '70px', rotate: 26, width: 150, dur: '17s', delay: '3s' },
  { left: '150px', top: '46px', rotate: 22, width: 118, dur: '23s', delay: '11s' },
  { left: '60px', top: '150px', rotate: 30, width: 134, dur: '20s', delay: '19s' },
]

const SPARKLES = [
  { left: '12%', top: '14%', glyph: '✦', size: 26, color: '#fbf6ff', dur: '4.6s', delay: '0.2s' },
  { left: '73%', top: '9%', glyph: '✦', size: 17, color: '#e7d6ff', dur: '5.4s', delay: '1.1s' },
  { left: '31%', top: '7%', glyph: '✧', size: 13, color: '#f6c9e8', dur: '3.8s', delay: '0.6s' },
  { left: '56%', top: '20%', glyph: '✦', size: 19, color: '#cfe0ff', dur: '6s', delay: '2s' },
  { left: '44%', top: '30%', glyph: '✧', size: 12, color: '#fbf6ff', dur: '4.2s', delay: '1.6s' },
  { left: '84%', top: '40%', glyph: '✧', size: 14, color: '#cfe0ff', dur: '5.1s', delay: '2.4s' },
  { left: '22%', top: '44%', glyph: '✦', size: 15, color: '#e7d6ff', dur: '4.8s', delay: '0.9s' },
  { left: '66%', top: '52%', glyph: '✧', size: 11, color: '#f6c9e8', dur: '3.9s', delay: '3.1s' },
]

export function StarryNightSky() {
  // Seeded once per mount; the same seed lays an identical sky every time.
  const stars = useMemo(() => buildStars(1337, 200), [])

  return (
    <div
      aria-hidden="true"
      className="starry-sky pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Faint milky-way band — a soft diagonal wash the clustered stars sit in. */}
      <div
        className="sky-band absolute"
        style={{
          left: '-24%',
          top: '-8%',
          width: '150%',
          height: '260px',
          transform: 'rotate(-22deg)',
          background:
            'radial-gradient(ellipse 58% 46% at 50% 45%, rgba(120,160,235,.16), rgba(80,120,200,.07) 48%, transparent 74%)',
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
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(70,104,190,.26), transparent 70%)',
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
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(86,74,180,.2), transparent 70%)',
          ['--drift-dur' as string]: '28s',
          animationDirection: 'alternate-reverse',
        }}
      />

      {/* Stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="sky-star sky-twinkle"
          style={{
            left: s.left,
            top: s.top,
            width: `${s.size.toFixed(2)}px`,
            height: `${s.size.toFixed(2)}px`,
            color: s.color,
            boxShadow: s.glow,
            opacity: s.baseOpacity,
            ['--tw-dur' as string]: s.dur,
            ['--tw-delay' as string]: s.delay,
          }}
        />
      ))}

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
            textShadow: '0 0 10px rgba(214,190,255,.85), 0 0 22px rgba(180,150,255,.5)',
            ['--sp-dur' as string]: sp.dur,
            ['--sp-delay' as string]: sp.delay,
          }}
        >
          {sp.glyph}
        </span>
      ))}

      {/* A few slow shooting stars, staggered across long cycles. */}
      {METEORS.map((m, i) => (
        <div
          key={`met-${i}`}
          className="sky-meteor absolute"
          style={{ left: m.left, top: m.top, transform: `rotate(${m.rotate}deg)`, ['--met-delay' as string]: m.delay, animationDuration: m.dur }}
        >
          <div className="relative h-0.5" style={{ width: `${m.width}px` }}>
            <div
              className="absolute right-1 top-0 h-[1.5px] rounded"
              style={{
                width: `${m.width}px`,
                background: 'linear-gradient(90deg, rgba(214,226,255,0) 0%, rgba(214,226,255,.12) 38%, rgba(246,250,255,.9) 100%)',
              }}
            />
            <div
              className="absolute right-0 -top-[1.5px] h-[5px] w-[5px] rounded-full"
              style={{ background: '#fdfeff', boxShadow: '0 0 8px 2px rgba(206,224,255,.95), 0 0 18px 5px rgba(150,180,255,.5)' }}
            />
          </div>
        </div>
      ))}

      {/* Horizon glow, hugging the foot of the sky. */}
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{ background: 'linear-gradient(0deg, rgba(60,90,180,.28), rgba(40,60,140,.1) 52%, transparent)' }}
      />
    </div>
  )
}
