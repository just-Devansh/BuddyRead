/**
 * Two little crowns — one per buddy — over the wordmark on sign-in. The
 * conventional crown doodle: a banded base, three jewelled points, outline only
 * (the body is never filled; the jewels are small dots). The pair sits close and
 * tilts very slightly apart, each toppling outward.
 */
export function Crowns({ className = '' }: { className?: string }) {
  const crown = (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* band + three points, one outline */}
      <path d="M-12 7 L12 7 L12 1 L7 -8 L3.5 -1 L0 -11 L-3.5 -1 L-7 -8 L-12 1 Z" />
      {/* line dividing the band from the points */}
      <path d="M-12 1 L12 1" />
      {/* jewels at the points */}
      <g fill="currentColor" stroke="none">
        <circle cx="0" cy="-11" r="1.6" />
        <circle cx="7" cy="-8" r="1.4" />
        <circle cx="-7" cy="-8" r="1.4" />
        {/* studs on the band */}
        <circle cx="0" cy="4" r="1" />
        <circle cx="-6.5" cy="4" r="1" />
        <circle cx="6.5" cy="4" r="1" />
      </g>
    </g>
  )

  return (
    <svg
      viewBox="0 0 152 54"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {/* left crown, toppling left; right crown, toppling right */}
      <g transform="translate(61 32) rotate(-6)">{crown}</g>
      <g transform="translate(91 32) rotate(6)">{crown}</g>
    </svg>
  )
}
