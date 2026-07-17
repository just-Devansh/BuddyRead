import { Astronaut } from './Astronaut'

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
      {/* Black hole (unlit) — glow, accretion disk, lensed ring, the event
          horizon, then a lone astronaut floating in FRONT of it (painted last so
          it sits over the black disc), slowly drawn into the centre. */}
      <span className="bh" aria-hidden="true">
        <span className="bh-glow" />
        <span className="bh-disk" />
        <span className="bh-ring" />
        <span className="bh-hole" />
        <span className="bh-astronaut">
          <Astronaut />
        </span>
      </span>
    </button>
  )
}
