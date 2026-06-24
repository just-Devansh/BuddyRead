/**
 * Two laurel crowns — one per buddy — crowning the wordmark on sign-in. Outline
 * only (never filled), but full and refined rather than sketchy: a Roman/Greek
 * victor's wreath, each a smooth sweep of tapering leaves. The leaves are placed
 * around a circle by a loop (so they're even, not jittered) and the left half is
 * a mirror of the right. The pair tilts very slightly apart, toppling outward.
 */

const R = 17 // wreath radius the leaves grow from
const N = 9 // leaves per side

/** A slender, tapering leaf pointing along +x, base at the origin. */
function leafPath(len: number): string {
  const w = +(len * 0.32).toFixed(2)
  const c1 = +(len * 0.32).toFixed(2)
  const c2 = +(len * 0.82).toFixed(2)
  const tip = +len.toFixed(2)
  return `M0 0 C ${c1} ${-w} ${c2} ${-w} ${tip} 0 C ${c2} ${w} ${c1} ${w} 0 0 Z`
}

// Right-side leaves, swept from the base (bottom) up toward the brow (top).
const rightLeaves = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1) // 0 at base → 1 at brow
  const posAng = (84 - t * 162) * (Math.PI / 180) // place around the circle
  return {
    x: +(R * Math.cos(posAng)).toFixed(2),
    y: +(R * Math.sin(posAng)).toFixed(2),
    len: +(7.6 - t * 2.6).toFixed(2), // leaves taper toward the tip
    rot: +(-(45 + t * 62)).toFixed(1), // fan up-and-out, converging at the brow
  }
})

export function Crowns({ className = '' }: { className?: string }) {
  const leaves = rightLeaves.map((l, i) => (
    <path
      key={i}
      d={leafPath(l.len)}
      transform={`translate(${l.x} ${l.y}) rotate(${l.rot})`}
    />
  ))

  const wreath = (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={1.15}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* the two branches that carry the leaves */}
      <path d="M0 18 C 10 17.2 16.6 9.5 16.6 -2 C 16.6 -10 11 -15.2 5 -16.4" />
      <path d="M0 18 C -10 17.2 -16.6 9.5 -16.6 -2 C -16.6 -10 -11 -15.2 -5 -16.4" />
      {/* the ribbon that ties them at the base */}
      <path d="M-4.2 20.4 C -1.8 17.8 1.8 17.8 4.2 20.4" />
      {/* leaves: right, then mirrored for the left */}
      <g>{leaves}</g>
      <g transform="scale(-1,1)">{leaves}</g>
    </g>
  )

  return (
    <svg
      viewBox="0 0 220 72"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {/* left crown, toppling left; right crown, toppling right */}
      <g transform="translate(72 42) rotate(-7)">{wreath}</g>
      <g transform="translate(148 42) rotate(7)">{wreath}</g>
    </svg>
  )
}
