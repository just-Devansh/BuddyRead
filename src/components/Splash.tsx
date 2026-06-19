import { Logo } from './Logo'

/** A quiet full-height holding screen while auth resolves. */
export function Splash({ message = 'Finding your place…' }: { message?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
      <Logo />
      <p className="animate-pulse text-sm text-text-muted">{message}</p>
    </div>
  )
}
