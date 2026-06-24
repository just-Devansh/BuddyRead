/**
 * An old-world engraved grapevine flourish — a symmetric horizontal ornament to
 * crown the wordmark on the sign-in screen. One muted stroke (currentColor),
 * hairline, in the spirit of the rest: ornament over decoration. The right half
 * is drawn once and mirrored about the centre so the two sides match exactly.
 */
export function VineFlourish({ className = '' }: { className?: string }) {
  const half = (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* the vine, scrolling out to a tendril */}
      <path d="M150 22 C 178 11 205 14 224 24 C 238 31 253 30 266 21" />
      <path d="M266 21 C 274 16 283 19 280 26 C 278 30 272 29 273 25" />
      {/* two leaves */}
      <path d="M191 17 C 186 8 201 6 203 15 C 203 20 193 21 191 17 Z" fill="currentColor" stroke="none" />
      <path d="M229 26 C 227 17 242 18 240 27 C 239 31 231 31 229 26 Z" fill="currentColor" stroke="none" />
      {/* a berry resting on the vine */}
      <circle cx="211" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
    </g>
  )

  return (
    <svg
      viewBox="0 0 300 38"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {half}
      <g transform="translate(300,0) scale(-1,1)">{half}</g>
      {/* centre: a small cluster of grapes on a short stem */}
      <g fill="currentColor">
        <path
          d="M150 22 L150 15"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <circle cx="150" cy="9" r="2.1" />
        <circle cx="144.7" cy="12.4" r="1.8" />
        <circle cx="155.3" cy="12.4" r="1.8" />
        <circle cx="150" cy="15.4" r="1.6" />
      </g>
    </svg>
  )
}
