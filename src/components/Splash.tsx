import { Logo } from './Logo'
import { pickLine } from '../lib/lines'

// Chosen once per app load — the splash only really shows at startup, and a
// fixed pick keeps render pure (no impure call during render).
const pick = pickLine()

/** A quiet full-height holding screen while auth resolves. */
export function Splash({ message }: { message?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
      <Logo />
      {message ? (
        <p className="animate-pulse text-sm text-text-muted">{message}</p>
      ) : (
        <div className="max-w-xs animate-pulse">
          <p className="font-display text-lg italic leading-snug text-text-muted">
            “{pick.line}”
          </p>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
            {pick.source}
          </p>
        </div>
      )}
    </div>
  )
}
