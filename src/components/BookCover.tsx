import { useState } from 'react'
import { coverCandidates, type Book } from '../lib/books'

type CoverBook = Pick<Book, 'title' | 'coverUrl' | 'isbn13' | 'isbn10'>

/**
 * A book cover in a 2:3 frame. Tries Google's image, then Open Library, then
 * settles into a quiet spine-like placeholder carrying the title — so a missing
 * cover still reads as a book rather than a broken image.
 *
 * Lists key each row by book id, so the source index resets per book on its own.
 */
export function BookCover({
  book,
  className = '',
}: {
  book: CoverBook
  className?: string
}) {
  const sources = coverCandidates(book)
  const [idx, setIdx] = useState(0)
  const exhausted = idx >= sources.length

  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-surface-alt ${className}`}
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
        <span className="line-clamp-5 flex h-full w-full items-center justify-center p-2 text-center font-display text-[0.7rem] leading-snug text-text-muted">
          {book.title}
        </span>
      )}
    </div>
  )
}
