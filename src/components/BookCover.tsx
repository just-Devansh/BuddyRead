import { useState } from 'react'
import { coverCandidates, type Book } from '../lib/books'

type CoverBook = Pick<Book, 'title' | 'coverUrl' | 'isbn13' | 'isbn10'>

/** Named spine gradients for the placeholder — bound covers, never flat boxes. */
const SPINES = {
  olive: { from: '#46503a', to: '#353d2c', ink: '#d8c79a' },
  wine: { from: '#6b4a55', to: '#4a3039', ink: '#e6cdd2' },
  sand: { from: '#4a4636', to: '#34311f', ink: '#d8d0a8' },
  blue: { from: '#3a4a55', to: '#243038', ink: '#bcd0da' },
  brown: { from: '#5a4636', to: '#3a2a1f', ink: '#e0c9a8' },
  plum: { from: '#4a3a52', to: '#2e2336', ink: '#ddc9e6' },
} as const

export type SpineTone = keyof typeof SPINES

/**
 * A book cover in a 2:3 frame. Tries Google's image, then Open Library, then
 * settles into a quiet bound-spine placeholder carrying the title — so a missing
 * cover still reads as a book rather than a broken image.
 *
 * `author` and `tone` only colour the placeholder; a real cover ignores them.
 * Lists key each row by book id, so the source index resets per book on its own.
 */
export function BookCover({
  book,
  author,
  tone = 'olive',
  className = '',
}: {
  book: CoverBook
  author?: string
  tone?: SpineTone
  className?: string
}) {
  const sources = coverCandidates(book)
  const [idx, setIdx] = useState(0)
  const exhausted = idx >= sources.length
  const spine = SPINES[tone]

  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-sm border border-border bg-surface-alt ${className}`}
    >
      {!exhausted ? (
        <img
          src={sources[idx]}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="flex h-full w-full flex-col items-center justify-center px-2 py-3 text-center"
          style={{
            background: `linear-gradient(160deg, ${spine.from}, ${spine.to})`,
            boxShadow: 'inset 0 0 0 1px rgba(198,162,78,0.22)',
          }}
        >
          <span
            className="line-clamp-4 font-display text-[0.72rem] font-medium leading-tight"
            style={{ color: spine.ink }}
          >
            {book.title}
          </span>
          {author && (
            <>
              <span
                className="my-1.5 h-px w-4"
                style={{ background: spine.ink, opacity: 0.5 }}
              />
              <span
                className="font-mono text-[6px] uppercase tracking-[0.12em]"
                style={{ color: spine.ink, opacity: 0.75 }}
              >
                {author}
              </span>
            </>
          )}
        </span>
      )}
    </div>
  )
}
