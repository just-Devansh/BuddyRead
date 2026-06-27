/**
 * A little nightstand lamp for the nook. Tap it and it warms to life — the
 * shade fills with light, a bulb-bloom glows beneath it, and (via the
 * `.lamp-wash` overlay in Home) a pool of warm light settles over the cards.
 * Pure SVG + CSS, no dependencies; the lit look is driven entirely by the
 * `lamp--lit` class so `prefers-reduced-motion` can flatten the motion.
 */
export function Lamp({
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
      aria-label={lit ? 'Turn the reading lamp off' : 'Turn the reading lamp on'}
      title={lit ? 'Turn off' : 'Light the lamp'}
      className={`lamp ${lit ? 'lamp--lit' : ''} block shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-md ${className}`}
    >
      <svg viewBox="0 0 100 172" className="block h-auto w-full" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="lampShade" cx="50%" cy="34%" r="68%">
            <stop offset="0%" stopColor="rgb(255 230 168)" />
            <stop offset="55%" stopColor="rgb(235 184 100)" />
            <stop offset="100%" stopColor="rgb(201 140 76)" />
          </radialGradient>
          <radialGradient id="lampBulb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(255 236 184)" stopOpacity="0.95" />
            <stop offset="60%" stopColor="rgb(255 212 128)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(255 200 110)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Warm bloom under the shade — only visible once lit. */}
        <ellipse className="lamp-bulb" cx="50" cy="52" rx="40" ry="26" fill="url(#lampBulb)" />

        <g
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Finial */}
          <circle cx="50" cy="9" r="2.6" />
          <path d="M50 11.6 V20" />

          {/* Shade — fills with light when lit */}
          <path className="lamp-shade" d="M37 22 H63 L78 58 Q50 67 22 58 Z" />
          <path d="M50 22 V63" opacity="0.55" />
          <path d="M44 22 L40 60" opacity="0.4" />
          <path d="M56 22 L60 60" opacity="0.4" />

          {/* Beaded fringe along the shade's hem */}
          <path
            d="M24 58 v6 M30 60.5 v6.5 M37 61.5 v7 M44 62.3 v7 M50 62.6 v7 M56 62.3 v7 M63 61.5 v7 M70 60.5 v6.5 M76 58 v6"
            strokeWidth="1.15"
            opacity="0.85"
          />

          {/* Pull chain + crystal bead */}
          <path d="M68 56 q4.5 7 1 12.5" strokeWidth="1" opacity="0.7" />
          <circle cx="68.5" cy="71" r="2" />

          {/* Neck */}
          <path d="M50 67 V74" />

          {/* Turned baluster body (stylised stacked forms) */}
          <ellipse cx="50" cy="76" rx="8" ry="2.3" />
          <path d="M43 78 Q33.5 92 44 104 L56 104 Q66.5 92 57 78" />
          <ellipse cx="50" cy="105" rx="10" ry="2.3" />
          <path d="M45 107 L43 119 L57 119 L55 107" />
          <ellipse cx="50" cy="122" rx="12" ry="3" />
          <path d="M40 121 Q50 133 60 121" opacity="0.85" />

          {/* Ornate spreading base */}
          <path d="M40 123 L36 143 Q34.5 150 30.5 152 Q50 159 69.5 152 Q65.5 150 64 143 L60 123" />
          <ellipse cx="50" cy="156" rx="22" ry="4" />
          <path d="M34 153 q-3 3 -5 4 M66 153 q3 3 5 4" strokeWidth="1.2" opacity="0.7" />
        </g>
      </svg>
    </button>
  )
}
