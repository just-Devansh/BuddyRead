import { Link } from 'react-router-dom'
import { BookCover } from './BookCover'
import { Eyebrow } from './Eyebrow'
import { booksOnShelf, SHELVES, spineToneFor, type LibraryItem } from '../lib/library'

/**
 * The Library — one wooden cabinet holding three shelves (To Read · Read ·
 * Favorites), themed to the app (warm oak by day, walnut by night). Each shelf
 * is a recessed compartment with a horizontal-scroll row of fixed-width covers;
 * the wood crossbars between compartments read as the shelves the books stand
 * on. Tapping a cover goes straight to its page. An empty shelf shows dashed
 * placeholder slots with a quiet hint.
 */

/** Shared cover width — fixed so 3–4 stand visible per shelf on a phone. */
const COVER = 'w-[80px] ipad:w-[92px]'

/** One book standing on the shelf — its cover, curved, with a Link out. */
function ShelfBook({ item }: { item: LibraryItem }) {
  return (
    <li className="shelf-book shrink-0">
      <Link
        to={`/book/${item.book.id}`}
        aria-label={item.book.title}
        title={item.book.title}
        className={`block ${COVER} rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-accent`}
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
          rounded="rounded-[7px]"
          className="w-full shadow-[0_10px_18px_-10px_rgba(20,12,4,0.7)]"
        />
      </Link>
    </li>
  )
}

/** An empty shelf — two dashed cover-slots and a one-line hint. */
function EmptyShelf({ hint }: { hint: string }) {
  return (
    <div className="flex items-stretch gap-3">
      <div
        className={`flex ${COVER} aspect-[2/3] shrink-0 items-center justify-center rounded-[7px] border border-dashed border-text-faint/45 text-2xl font-light text-text-faint/70`}
        aria-hidden="true"
      >
        +
      </div>
      <div
        className={`${COVER} aspect-[2/3] shrink-0 rounded-[7px] border border-dashed border-text-faint/30`}
        aria-hidden="true"
      />
      <p className="max-w-[8rem] self-center font-display text-[15px] italic leading-snug text-text-faint">
        {hint}
      </p>
    </div>
  )
}

/** One compartment: a label + count, then the books (or the empty hint). */
function Shelf({
  label,
  hint,
  items,
}: {
  label: string
  hint: string
  items: LibraryItem[]
}) {
  return (
    <section className="shelf-compartment">
      <div className="mb-3 flex items-baseline justify-between">
        <Eyebrow>{label}</Eyebrow>
        <span className="font-mono text-[10px] text-text-faint">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <EmptyShelf hint={hint} />
      ) : (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto pb-1 pt-1">
          {items.map((it) => (
            <ShelfBook key={it.id} item={it} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function Bookshelf({ items }: { items: LibraryItem[] }) {
  return (
    <div className="shelf-cabinet">
      {SHELVES.map((s) => (
        <Shelf
          key={s.key}
          label={s.label}
          hint={s.empty}
          items={booksOnShelf(items, s.key)}
        />
      ))}
    </div>
  )
}
