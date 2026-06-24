/**
 * Two hand-drawn crowns — one per buddy — over the wordmark on sign-in. Modelled
 * on a doodled crown: five balled points, a jewelled band (two rules with a row
 * of studs between), and a few sparkle ticks. Outline only — nothing is filled
 * but the little jewel/stud dots. The pair sits close and tilts gently apart.
 */
export function Crowns({ className = '' }: { className?: string }) {
  const crown = (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* five spiky points, dipping to deep valleys between */}
      <path d="M-22 2 L-20 -14 L-15 -1 L-10 -18 L-5 -1 L0 -20 L5 -1 L10 -18 L15 -1 L20 -14 L22 2" />
      {/* the band: outer rule, inner rule, and a row of studs */}
      <path d="M-22 2 L22 2 L20.5 12 L-20.5 12 Z" />
      <path d="M-19.5 8.8 L19.5 8.8" />
      <path d="M-17.5 5.2 L17.5 5.2" strokeDasharray="0.4 3.1" />
      {/* a ball atop each point */}
      <circle cx="-20" cy="-14" r="2" />
      <circle cx="-10" cy="-18" r="2" />
      <circle cx="0" cy="-20" r="2.2" />
      <circle cx="10" cy="-18" r="2" />
      <circle cx="20" cy="-14" r="2" />
      {/* sparkle ticks */}
      <g strokeWidth={1.2} opacity={0.85}>
        <path d="M0 -25 L0 -28.5" />
        <path d="M-12 -22.5 L-14.5 -25.5" />
        <path d="M12 -22.5 L14.5 -25.5" />
      </g>
    </g>
  )

  return (
    <svg
      viewBox="0 0 200 64"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <g transform="translate(72 40) rotate(-7)">{crown}</g>
      <g transform="translate(128 40) rotate(7)">{crown}</g>
    </svg>
  )
}
