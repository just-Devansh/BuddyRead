import { Link } from 'react-router-dom'
import { BookCover } from './BookCover'
import { SHELVES, spineToneFor, type LibraryItem } from '../lib/library'

/**
 * The centred cover reveal — a tapped spine comes forward in its full glory over
 * a dimmed backdrop; tapping the cover opens the book's detail page. Shared by
 * the Library screen and a buddy's profile shelves.
 */
export function BookSpotlight({
  item,
  onClose,
}: {
  item: LibraryItem
  onClose: () => void
}) {
  const shelf = SHELVES.find(
    (s) => s.key === item.shelf || (s.key === 'read' && item.shelf === 'favorite'),
  )
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-8">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="overlay-enter absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="pop-enter relative flex flex-col items-center text-center">
        <Link to={`/book/${item.book.id}`} className="block w-44 ipad:w-52">
          <BookCover
            book={{ title: item.book.title, coverUrl: item.book.coverUrl, isbn13: null, isbn10: null }}
            author={item.book.authors[0]}
            tone={spineToneFor(item.id)}
            className="shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]"
          />
        </Link>
        <h2 className="mt-5 max-w-xs text-pretty font-display text-2xl leading-tight text-[#f4ecdb]">
          {item.book.title}
        </h2>
        {item.book.authors[0] && (
          <p className="mt-0.5 text-sm text-[#f4ecdb]/70">{item.book.authors.join(', ')}</p>
        )}
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#f4ecdb]/50">
          {shelf?.eyebrow ?? ''} · tap the cover for details
        </p>
      </div>
    </div>
  )
}
