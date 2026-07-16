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
    // Keep the dense field to the upper ~78% so text lower down stays clean.
    const x = r() * 100
    const y = r() * 78
    let size = 0.7 + r() * 2.1
    const hue = r()
    const color = hue > 0.9 ? STAR_COLORS[3] : hue > 0.72 ? STAR_COLORS[1] : hue > 0.6 ? STAR_COLORS[2] : STAR_COLORS[0]
    const bright = r() > 0.86
    if (bright) size += 0.9
    stars.push({
      left: `${x.toFixed(2)}%`,
      top: `${y.toFixed(2)}%`,
      size,
      color,
      glow: bright ? `0 0 ${(size * 2.6).toFixed(1)}px ${(size * 0.8).toFixed(1)}px rgba(196,214,255,.7)` : undefined,
      dur: `${(2.4 + r() * 4.2).toFixed(2)}s`,
      delay: `${(r() * 6).toFixed(2)}s`,
      baseOpacity: 0.35 + r() * 0.55,
    })
  }
  return stars
}

const SPARKLES = [
  { left: '12%', top: '14%', glyph: '✦', size: 26, color: '#fbf6ff', dur: '4.6s', delay: '0.2s' },
  { left: '73%', top: '9%', glyph: '✦', size: 17, color: '#e7d6ff', dur: '5.4s', delay: '1.1s' },
  { left: '31%', top: '7%', glyph: '✧', size: 13, color: '#f6c9e8', dur: '3.8s', delay: '0.6s' },
  { left: '56%', top: '20%', glyph: '✦', size: 19, color: '#cfe0ff', dur: '6s', delay: '2s' },
  { left: '44%', top: '30%', glyph: '✧', size: 12, color: '#fbf6ff', dur: '4.2s', delay: '1.6s' },
]

export function StarryNightSky() {
  // Seeded once per mount; the same seed lays an identical sky every time.
  const stars = useMemo(() => buildStars(1337, 76), [])

  return (
    <div
      aria-hidden="true"
      className="starry-sky pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Drifting cloud-glows — soft violet washes crossing slowly. */}
      <div
        className="sky-cloud sky-band"
        style={{
          left: '-14%',
          top: '18%',
          width: '74%',
          height: '150px',
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(126,98,196,.32), transparent 70%)',
          ['--drift-dur' as string]: '22s',
        }}
      />
      <div
        className="sky-cloud"
        style={{
          right: '-16%',
          top: '42%',
          width: '80%',
          height: '170px',
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(92,112,202,.24), transparent 70%)',
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

      {/* One slow meteor, on a long cycle. */}
      <div
        className="sky-meteor absolute"
        style={{ left: '30px', top: '108px', transform: 'rotate(26deg)', ['--met-delay' as string]: '5s' }}
      >
        <div className="relative h-0.5 w-[150px]">
          <div
            className="absolute right-1 top-0 h-[1.5px] w-[150px] rounded"
            style={{
              background: 'linear-gradient(90deg, rgba(232,220,255,0) 0%, rgba(232,220,255,.12) 38%, rgba(250,244,255,.9) 100%)',
            }}
          />
          <div
            className="absolute right-0 -top-[1.5px] h-[5px] w-[5px] rounded-full"
            style={{ background: '#fdfbff', boxShadow: '0 0 8px 2px rgba(228,208,255,.95), 0 0 18px 5px rgba(178,148,255,.5)' }}
          />
        </div>
      </div>

      {/* Horizon glow, hugging the foot of the sky. */}
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{ background: 'linear-gradient(0deg, rgba(150,110,205,.34), rgba(95,120,205,.1) 52%, transparent)' }}
      />
    </div>
  )
}
