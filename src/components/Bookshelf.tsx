import { SPINES } from '../lib/spines'
import { booksOnShelf, SHELVES, spineToneFor, type LibraryItem } from '../lib/library'
import type { BookshelfProps } from '../library/bookshelf'

/**
 * The Library bookcase — a static, hand-drawn 2D shelf (no 3D). Each book is a
 * bound spine: its colour is washed from its own cover (a blurred cover layer
 * tinted into the candlelit palette, falling back to a leather tone when there's
 * no cover), with raised hubs and a gold-stamped title. Tap a spine and the
 * Library screen brings its cover forward.
 */

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

/** One bound spine, sized and coloured from the book. */
function Spine({
  item,
  onSelect,
}: {
  item: LibraryItem
  onSelect: (i: LibraryItem) => void
}) {
  const tone = SPINES[spineToneFor(item.id)]
  const pages = item.book.pageCount ?? 300
  const width = Math.round(clamp(26, 42, 22 + pages / 40))
  const height = clamp(82, 99, 76 + pages / 40)
  const cover = item.book.coverUrl

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={item.book.title}
      title={item.book.title}
      style={{
        width: `${width}px`,
        height: `${height}%`,
        background: `linear-gradient(100deg, ${tone.from}, ${tone.to})`,
      }}
      className="spine flex shrink-0 items-center justify-center self-end"
    >
      {cover && (
        <span
          className="spine-wash"
          style={{ backgroundImage: `url("${cover}")` }}
          aria-hidden="true"
        />
      )}
      <span className="spine-tint" aria-hidden="true" />
      <span className="spine-band" style={{ top: '4%' }} aria-hidden="true" />
      <span className="spine-band" style={{ bottom: '4%' }} aria-hidden="true" />
      <span
        className="spine-title relative z-[1] max-h-[74%] overflow-hidden px-0.5 font-display text-[11px] font-semibold leading-none"
        style={{ color: tone.ink }}
      >
        {item.book.title}
      </span>
    </button>
  )
}

/** One shelf: a label, a recessed back of spines, the lit plank they rest on. */
function Shelf({
  label,
  items,
  onSelect,
}: {
  label: string
  items: LibraryItem[]
  onSelect: (i: LibraryItem) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between px-1 pb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e7d6b0]/85">
          {label}
        </span>
        <span className="font-mono text-[10px] text-[#e7d6b0]/45">{items.length}</span>
      </div>
      <div className="shelf-back no-scrollbar relative flex h-[20vh] min-h-[140px] items-end gap-[3px] overflow-x-auto px-3 pt-4">
        {items.length === 0 ? (
          <span className="self-center pb-4 font-display text-sm italic text-[#e7d6b0]/40">
            Nothing here yet.
          </span>
        ) : (
          items.map((it) => <Spine key={it.id} item={it} onSelect={onSelect} />)
        )}
      </div>
      <div className="shelf-plank h-3.5 rounded-[1px]" />
    </div>
  )
}

export function Bookshelf({ items, onSelect }: BookshelfProps) {
  return (
    <div className="bookcase rounded-2xl p-3 ipad:p-4">
      <div className="space-y-2.5">
        {SHELVES.map((s) => (
          <Shelf
            key={s.key}
            label={s.label}
            items={booksOnShelf(items, s.key)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
