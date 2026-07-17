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
          ring, a lone astronaut being pulled in, then the event horizon (painted
          last so it swallows the astronaut). */}
      <span className="bh" aria-hidden="true">
        <span className="bh-glow" />
        <span className="bh-disk" />
        <span className="bh-swirl" />
        <span className="bh-ring" />
        <span className="bh-astronaut">
          <svg viewBox="0 0 24 34" fill="currentColor">
            {/* backpack */}
            <rect x="6.4" y="12.5" width="11.2" height="10.5" rx="3.4" opacity="0.85" />
            {/* limbs */}
            <rect x="2.6" y="13" width="4" height="10" rx="2" />
            <rect x="17.4" y="13" width="4" height="10" rx="2" />
            <rect x="7.7" y="22" width="3.8" height="10.5" rx="1.9" />
            <rect x="12.5" y="22" width="3.8" height="10.5" rx="1.9" />
            {/* torso */}
            <rect x="6.6" y="12" width="10.8" height="13" rx="4.4" />
            {/* helmet */}
            <circle cx="12" cy="7" r="5.6" />
            {/* visor sheen */}
            <ellipse cx="10.4" cy="6.2" rx="2.1" ry="2.7" fill="#0a0512" opacity="0.35" />
          </svg>
        </span>
        <span className="bh-hole" />
      </span>
    </button>
  )
}
