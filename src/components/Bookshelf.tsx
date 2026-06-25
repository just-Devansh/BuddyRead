import { Link } from 'react-router-dom'
import { BookCover } from './BookCover'
import { Eyebrow } from './Eyebrow'
import { booksOnShelf, SHELVES, spineToneFor, type LibraryItem } from '../lib/library'

/**
 * The Library shelf — real covers standing face-out on a slim wooden ledge,
 * themed to the app (warm oak by day, walnut by night). A boutique-bookstore
 * display rather than a dark box of spines: you see the actual art, and tapping
 * a book goes straight to its page. One row per shelf (To Read · Read ·
 * Favorites); rows scroll sideways when full.
 */

/** One book standing on the ledge — its cover, a page-block edge, a Link out. */
function ShelfBook({ item }: { item: LibraryItem }) {
  return (
    <li className="shelf-book shrink-0">
      <Link
        to={`/book/${item.book.id}`}
        aria-label={item.book.title}
        title={item.book.title}
        className="relative block w-[72px] ipad:w-[88px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <BookCover
          book={{
            title: item.book.title,
            coverUrl: item.book.coverUrl,
            isbn13: null,
            isbn10: null,
          }}
          author={item.book.authors[0]}
          tone={spineToneFor(item.id)}
          className="w-full shadow-[0_12px_16px_-9px_rgba(40,22,8,0.55)]"
        />
        <span className="book-edge" aria-hidden="true" />
      </Link>
    </li>
  )
}

/** One shelf: a label, the row of books, the ledge they stand on. */
function Shelf({ label, items }: { label: string; items: LibraryItem[] }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-0.5">
        <Eyebrow>{label}</Eyebrow>
        <span className="font-mono text-[10px] text-text-faint">{items.length}</span>
      </div>
      <div className="relative">
        {items.length === 0 ? (
          <div className="flex h-[120px] items-end px-1 pb-3 ipad:h-[146px]">
            <span className="font-display text-sm italic text-text-faint">
              Nothing here yet.
            </span>
          </div>
        ) : (
          <ul className="no-scrollbar flex items-end gap-4 overflow-x-auto px-1 pt-3 pb-0">
            {items.map((it) => (
              <ShelfBook key={it.id} item={it} />
            ))}
          </ul>
        )}
        <div className="shelf-ledge" />
      </div>
    </section>
  )
}

export function Bookshelf({ items }: { items: LibraryItem[] }) {
  return (
    <div className="space-y-7">
      {SHELVES.map((s) => (
        <Shelf key={s.key} label={s.label} items={booksOnShelf(items, s.key)} />
      ))}
    </div>
  )
}
