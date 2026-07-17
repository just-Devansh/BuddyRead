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
          <svg viewBox="0 0 40 54">
            {/* slim limbs — one arm flung up toward the hole, the rest trailing */}
            <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M24 20 Q30 10 36 2" />
              <path d="M16 20.5 Q10 25 6.5 31" />
              <path d="M22 34 Q26 42 25.5 50.5" />
              <path d="M18 34 Q13.5 42 12 49.5" />
            </g>
            {/* backpack, torso, helmet */}
            <rect x="13.4" y="17.5" width="13.2" height="13" rx="4.2" fill="currentColor" opacity="0.8" />
            <rect x="14.6" y="16.5" width="10.8" height="17.5" rx="5" fill="currentColor" />
            <circle cx="20" cy="10" r="6.2" fill="currentColor" />
            {/* a faint catch of light on the visor */}
            <ellipse cx="18" cy="9.2" rx="2.3" ry="2.9" fill="rgba(212,202,246,0.28)" />
          </svg>
        </span>
      </span>
    </button>
  )
}
