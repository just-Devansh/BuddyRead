/** Gradient avatar tones, one per reader — keeps people legible at a glance. */
const TONES = {
  terracotta: 'linear-gradient(150deg,#9b5a47,#6f3d30)',
  gold: 'linear-gradient(150deg,#8a743f,#5c4a26)',
  green: 'linear-gradient(150deg,#5a7d5a,#3a523a)',
  plum: 'linear-gradient(150deg,#6b5278,#43314f)',
} as const

export type AvatarTone = keyof typeof TONES

type AvatarProps = {
  src?: string | null
  name?: string | null
  /** Tailwind size classes, e.g. 'h-9 w-9'. */
  size?: string
  /** A gradient fill + cream initial, used for the demo readers. */
  tone?: AvatarTone
  className?: string
}

/** Round avatar with a tidy initial fallback when there's no photo. */
export function Avatar({
  src,
  name,
  size = 'h-9 w-9',
  tone,
  className = '',
}: AvatarProps) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?'

  return (
    <span
      className={`inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full font-display ${
        tone ? 'text-[#f4ecdb]' : 'border border-border bg-surface-alt text-text'
      } ${className}`}
      style={tone ? { background: TONES[tone] } : undefined}
    >
      {src && !tone ? (
        <img
          src={src}
          alt={name ?? 'Profile photo'}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  )
}
