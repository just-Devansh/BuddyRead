/** The wordmark. Type-led, like everything else here. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-display text-xl tracking-tight text-text ${className}`}
    >
      Buddy<span className="text-accent">Read</span>
    </span>
  )
}
