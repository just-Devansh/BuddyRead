/**
 * Two laurel crowns — one per buddy — crowning the wordmark on sign-in. Outline
 * only (never filled) for a hand-drawn, doodled feel, but unmistakably classical:
 * a Roman/Greek victor's wreath. The pair tilts very slightly apart, each
 * toppling outward, so they lean away from one another like a toast.
 */
export function Crowns({ className = '' }: { className?: string }) {
  // A small laurel leaf, pointing along +x; placed around each wreath by transform.
  const leaf = 'M0 0 C 2.5 -2.6 6 -2.4 7.6 0 C 6 1.6 2.5 1.4 0 0 Z'

  const wreath = (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* two branches, meeting at the base, open at the brow */}
      <path d="M0 17 C -8 15 -13.5 7 -13 -6" />
      <path d="M0 17 C 8 15 13.5 7 13 -6" />
      {/* the ribbon that ties them */}
      <path d="M-3.6 19.6 C -1.5 17.4 1.5 17.4 3.6 19.6" />

      {/* leaves — left branch, sprouting outward */}
      <path d={leaf} transform="translate(-3.5 13.5) rotate(200)" />
      <path d={leaf} transform="translate(-9 7.5) rotate(223)" />
      <path d={leaf} transform="translate(-12.5 0.5) rotate(247)" />
      <path d={leaf} transform="translate(-13 -6) rotate(270)" />
      {/* leaves — right branch */}
      <path d={leaf} transform="translate(3.5 13.5) rotate(-20)" />
      <path d={leaf} transform="translate(9 7.5) rotate(-43)" />
      <path d={leaf} transform="translate(12.5 0.5) rotate(-67)" />
      <path d={leaf} transform="translate(13 -6) rotate(-90)" />
    </g>
  )

  return (
    <svg
      viewBox="0 0 200 80"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {/* left crown, toppling left */}
      <g transform="translate(72 44) rotate(-8)">{wreath}</g>
      {/* right crown, toppling right */}
      <g transform="translate(128 44) rotate(8)">{wreath}</g>
    </svg>
  )
}
