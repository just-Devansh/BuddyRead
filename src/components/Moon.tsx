/**
 * The nook's moon — and its dark twin. Lit, it's the moon: a smooth cream-to-lilac
 * disc with craters and a soft halo, casting the lilac moon-wash over the cards.
 * Tapped dark, the moon collapses into an Interstellar-style black hole — an amber
 * accretion disk and a lensed photon ring around a pure-black event horizon — and
 * the sky fills with stars (the moon no longer washing them out). Tap the black
 * hole and the moon returns.
 *
 * Same contract as the old lamp: `lit` + `onToggle`. Both bodies live in the one
 * button and crossfade via the `moon--lit` class, so prefers-reduced-motion can
 * flatten the motion while keeping either state legible. Sizing comes from
 * `className` (a width; it's a circle).
 */
export function Moon({
  lit,
  onToggle,
  className = '',
}: {
  lit: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={lit}
      aria-label={lit ? 'Collapse the moon into a black hole' : 'Bring the moon back'}
      title={lit ? 'Collapse into a black hole' : 'Bring the moon back'}
      className={`moon ${lit ? 'moon--lit' : ''} block aspect-square shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${className}`}
    >
      {/* Moon (lit) */}
      <span className="moon-halo" aria-hidden="true" />
      <span className="moon-disc" aria-hidden="true" />
      {/* Black hole (unlit) — glow, accretion disk (+ orbiting swirl), lensed
          ring, the event horizon, then a lone astronaut floating in FRONT of it,
          reaching toward the hole (painted last so it sits over the black disc). */}
      <span className="bh" aria-hidden="true">
        <span className="bh-glow" />
        <span className="bh-disk" />
        <span className="bh-swirl" />
        <span className="bh-ring" />
        <span className="bh-hole" />
        <span className="bh-astronaut">
          <svg viewBox="0 0 40 52">
            {/* limbs — reaching arm up toward the hole, other arm + legs trailing */}
            <g stroke="currentColor" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M25 22 Q31 14 34.5 6" />
              <path d="M15.5 22 Q10.5 27 8 33" />
              <path d="M22 33 Q25.5 40 25 47.5" />
              <path d="M18 33 Q14 40 12.5 46" />
            </g>
            {/* backpack, torso, helmet */}
            <rect x="12.3" y="17.5" width="15.4" height="15" rx="5.4" fill="currentColor" opacity="0.82" />
            <rect x="13.6" y="16.5" width="12.8" height="17.5" rx="6" fill="currentColor" />
            <circle cx="20" cy="10.5" r="7.1" fill="currentColor" />
            {/* visor */}
            <ellipse cx="17.9" cy="9.6" rx="2.7" ry="3.3" fill="#0a0512" opacity="0.42" />
          </svg>
        </span>
      </span>
    </button>
  )
}
