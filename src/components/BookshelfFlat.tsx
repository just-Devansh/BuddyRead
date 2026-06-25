import { SPINES } from '../lib/spines'
import { booksOnShelf, SHELVES, spineToneFor, type LibraryItem } from '../lib/library'
import type { BookshelfProps } from '../library/bookshelf'

// A wooden bookcase, fixed warm tones (a shelf is wood in either theme). The
// terracotta/gold accents sit fine against brown.
const PLANK = 'linear-gradient(180deg,#6f4c30,#46301d)'
const CASE_BACK = 'linear-gradient(180deg,#34241733,#1c130b66)'

/** Spine height (% of the shelf opening) from page count — thicker books stand taller. */
function spineHeight(pages: number | null): number {
  const base = pages ?? 280
  return Math.max(66, Math.min(96, 60 + base / 26))
}

/** One upright spine on the shelf — tap to bring its cover forward. */
function Spine({
  item,
  onSelect,
}: {
  item: LibraryItem
  onSelect: (i: LibraryItem) => void
}) {
  const s = SPINES[spineToneFor(item.id)]
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={item.book.title}
      title={item.book.title}
      style={{
        height: `${spineHeight(item.book.pageCount)}%`,
        background: `linear-gradient(95deg, ${s.from}, ${s.to})`,
        boxShadow: 'inset 0 0 0 1px rgba(198,162,78,0.18), 0 6px 10px -6px rgba(0,0,0,0.6)',
      }}
      className="group relative w-9 shrink-0 origin-bottom self-end overflow-hidden rounded-[2px] transition-transform duration-200 hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline-none"
    >
      {/* head/tail bands, for a bound look */}
      <span className="absolute inset-x-0 top-1 h-px bg-white/15" aria-hidden="true" />
      <span className="absolute inset-x-0 bottom-1 h-px bg-white/15" aria-hidden="true" />
      <span
        style={{ writingMode: 'vertical-rl', color: s.ink }}
        className="mx-auto mt-2.5 block max-h-[82%] overflow-hidden px-0.5 font-display text-[10.5px] font-medium leading-none tracking-tight"
      >
        {item.book.title}
      </span>
    </button>
  )
}

/** One shelf: a label, a row of spines on a plank. */
function Shelf({
  label,
  count,
  items,
  onSelect,
}: {
  label: string
  count: number
  items: LibraryItem[]
  onSelect: (i: LibraryItem) => void
}) {
  return (
    <div className="relative">
      <div className="flex items-baseline justify-between px-3 pb-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#e7d6b0]">
          {label}
        </span>
        <span className="font-mono text-[10px] text-[#e7d6b0]/55">{count}</span>
      </div>
      <div
        style={{ background: CASE_BACK }}
        className="relative flex h-[18vh] min-h-[120px] items-end gap-[3px] overflow-x-auto px-3 pt-3"
      >
        {items.length === 0 ? (
          <span className="self-center pb-3 font-display text-sm italic text-[#e7d6b0]/45">
            Nothing here yet.
          </span>
        ) : (
          items.map((it) => <Spine key={it.id} item={it} onSelect={onSelect} />)
        )}
      </div>
      {/* The plank the books rest on */}
      <div
        style={{ background: PLANK }}
        className="h-3 rounded-[1px] shadow-[0_5px_8px_-3px_rgba(0,0,0,0.55)]"
      />
    </div>
  )
}

/**
 * The flat (CSS) bookshelf — the dependable baseline and the 3D shelf's loading
 * fallback / rollback target. Three shelves of real spines; tapping one asks the
 * Library screen to bring its cover forward.
 */
export function BookshelfFlat({ items, onSelect }: BookshelfProps) {
  return (
    <div
      className="no-scrollbar overflow-hidden rounded-2xl border border-[#3a2817] p-2 shadow-[0_24px_48px_-28px_rgba(20,12,4,0.8)]"
      style={{ background: 'linear-gradient(180deg,#241910,#1a1109)' }}
    >
      <div className="space-y-1.5">
        {SHELVES.map((s) => (
          <Shelf
            key={s.key}
            label={s.label}
            items={booksOnShelf(items, s.key)}
            count={booksOnShelf(items, s.key).length}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
