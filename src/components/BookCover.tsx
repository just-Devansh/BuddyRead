import { useState } from 'react'
import { coverCandidates, type Book } from '../lib/books'
import { SPINES, type SpineTone } from '../lib/spines'

export type { SpineTone }

type CoverBook = Pick<Book, 'title' | 'coverUrl' | 'isbn13' | 'isbn10'>

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
  rounded = 'rounded-sm',
}: {
  book: CoverBook
  author?: string
  tone?: SpineTone
  className?: string
  /** Corner-radius utility — overridable so e.g. the Library can curve covers. */
  rounded?: string
}) {
  const sources = coverCandidates(book)
  const [idx, setIdx] = useState(0)
  const exhausted = idx >= sources.length
  const spine = SPINES[tone]

  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden border border-border bg-surface-alt ${rounded} ${className}`}
    >
      {!exhausted ? (
        <img
          src={sources[idx]}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
          onLoad={(e) => {
            // Google sometimes serves a tiny or oddly-shaped scan for older
            // titles (a near-square page photo, or a low-res placeholder), which
            // object-cover then zooms into a blurry crop. Reject anything too
            // small or far from a portrait book aspect (~1:1.5) so we fall through
            // to Open Library, then the typographic cover, instead of showing it.
            const img = e.currentTarget
            const { naturalWidth: w, naturalHeight: h } = img
            if (w && h && (w < 90 || h / w < 1.25)) setIdx((i) => i + 1)
          }}
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
