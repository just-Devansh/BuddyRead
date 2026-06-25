import { Logo } from './Logo'

/** A few lines from beloved books to hold the moment while auth resolves. */
const LINES: { line: string; source: string }[] = [
  { line: 'Not all those who wander are lost.', source: 'The Lord of the Rings' },
  { line: 'It does not do to dwell on dreams and forget to live.', source: 'Harry Potter' },
  { line: 'It is our choices that show what we truly are.', source: 'Harry Potter' },
  { line: 'All we have to decide is what to do with the time that is given us.', source: 'The Lord of the Rings' },
  { line: 'There is some good in this world, and it’s worth fighting for.', source: 'The Lord of the Rings' },
  { line: 'Happiness can be found, even in the darkest of times.', source: 'Harry Potter' },
  { line: 'Whatever our souls are made of, his and mine are the same.', source: 'Wuthering Heights' },
  { line: 'It is a truth universally acknowledged…', source: 'Pride and Prejudice' },
  { line: 'So we beat on, boats against the current.', source: 'The Great Gatsby' },
  { line: 'The night is darkest just before the dawn.', source: 'A Tale of Two Cities' },
]

// Chosen once per app load — the splash only really shows at startup, and a
// fixed pick keeps render pure (no impure call during render).
const pick = LINES[Math.floor(Math.random() * LINES.length)]

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
