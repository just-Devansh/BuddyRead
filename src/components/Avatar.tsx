type AvatarProps = {
  src?: string | null
  name?: string | null
  /** Tailwind size classes, e.g. 'h-9 w-9'. */
  size?: string
  className?: string
}

/** Round avatar with a tidy initial fallback when there's no photo. */
export function Avatar({
  src,
  name,
  size = 'h-9 w-9',
  className = '',
}: AvatarProps) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?'

  return (
    <span
      className={`inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-alt font-display text-text ${className}`}
    >
      {src ? (
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
