/**
 * The nook's moon — Starry Night's answer to the reading lamp, drawn to match the
 * design canvas: a smooth cream-to-lilac disc with a soft blurred halo and a wide
 * luminous bloom. Off, it hangs dimmed and cool; tapped, it swells to a full
 * silver glow and (via the `.lamp-wash` overlay in Home, recoloured by the
 * moonlight tokens) a pool of moonlight settles over the cards.
 *
 * Same contract as Lamp: `lit` + `onToggle`, with the whole lit look driven by the
 * `moon--lit` class so prefers-reduced-motion can flatten the pulse while keeping
 * the light. Sizing comes from `className` (a width; it's a circle).
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
      aria-label={lit ? 'Dim the moon' : 'Light the moon'}
      title={lit ? 'Dim the moon' : 'Light the moon'}
      className={`moon ${lit ? 'moon--lit' : ''} block aspect-square shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${className}`}
    >
      <span className="moon-halo" aria-hidden="true" />
      <span className="moon-disc" aria-hidden="true" />
    </button>
  )
}
