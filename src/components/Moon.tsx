/**
 * The nook's moon — Starry Night's answer to the reading lamp. Off, it hangs dim
 * and cool over the sky; tapped, it brightens to a full silver glow, its craters
 * catching the light, a soft halo blooming behind it, and (via the `.lamp-wash`
 * overlay in Home, recoloured by the moonlight tokens) a pool of moonlight
 * settling over the cards. Same contract as Lamp: `lit` + `onToggle`, with all of
 * the lit look driven by the `moon--lit` class so prefers-reduced-motion can
 * flatten the bloom while keeping the light.
 *
 * The face carries real character — a scatter of craters and maria, a couple of
 * rimmed highlights — so it reads as a moon, not a disc.
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
      className={`moon ${lit ? 'moon--lit' : ''} block shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${className}`}
    >
      <svg viewBox="0 0 120 120" className="block h-auto w-full" aria-hidden="true">
        <defs>
          <radialGradient id="moonFace" cx="38%" cy="32%" r="78%">
            <stop offset="0%" stopColor="#fdfbff" />
            <stop offset="52%" stopColor="#ece2ff" />
            <stop offset="100%" stopColor="#c3addf" />
          </radialGradient>
          <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(226,216,255,0.55)" />
            <stop offset="45%" stopColor="rgba(178,150,240,0.28)" />
            <stop offset="100%" stopColor="rgba(150,120,230,0)" />
          </radialGradient>
          <radialGradient id="craterShade" cx="42%" cy="38%" r="66%">
            <stop offset="0%" stopColor="rgba(120,96,180,0.05)" />
            <stop offset="100%" stopColor="rgba(96,74,150,0.42)" />
          </radialGradient>
          <clipPath id="moonClip">
            <circle cx="60" cy="60" r="40" />
          </clipPath>
        </defs>

        {/* Halo bloom — only visible once lit. */}
        <circle className="moon-halo" cx="60" cy="60" r="58" fill="url(#moonHalo)" />

        {/* The face + everything painted on it, clipped to the disc. */}
        <g clipPath="url(#moonClip)">
          <circle cx="60" cy="60" r="40" fill="url(#moonFace)" />

          {/* Maria + craters — a believable scatter, each with a soft shaded well
              and a faint upper rim so it dishes into the surface. */}
          <circle cx="45" cy="44" r="9" fill="url(#craterShade)" />
          <path d="M37 41 a9 9 0 0 1 15 -3" fill="none" stroke="rgba(255,252,255,0.5)" strokeWidth="1.1" />

          <circle cx="74" cy="52" r="6.5" fill="url(#craterShade)" />
          <path d="M68.5 49 a6.5 6.5 0 0 1 11 -2" fill="none" stroke="rgba(255,252,255,0.45)" strokeWidth="1" />

          <circle cx="58" cy="70" r="11" fill="url(#craterShade)" />
          <path d="M48 67 a11 11 0 0 1 19 -4" fill="none" stroke="rgba(255,252,255,0.4)" strokeWidth="1.1" />

          <circle cx="79" cy="74" r="4.5" fill="url(#craterShade)" />
          <circle cx="42" cy="66" r="3.4" fill="url(#craterShade)" />
          <circle cx="66" cy="38" r="3" fill="url(#craterShade)" />
          <circle cx="52" cy="55" r="2.4" fill="rgba(96,74,150,0.28)" />
          <circle cx="70" cy="63" r="2" fill="rgba(96,74,150,0.24)" />

          {/* A gentle terminator — the lower-right edge falls into cooler shade,
              giving the sphere its roundness. */}
          <circle cx="76" cy="76" r="40" fill="rgba(40,26,74,0.28)" />

          {/* The dimming veil — night-coloured, drawn last inside the clip; it
              fades away when the moon is lit (see .moon-dim in index.css). */}
          <circle className="moon-dim" cx="60" cy="60" r="40" />
        </g>

        {/* A crisp rim so the disc keeps its edge whether lit or dim. */}
        <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(214,200,255,0.35)" strokeWidth="1" />
      </svg>
    </button>
  )
}
