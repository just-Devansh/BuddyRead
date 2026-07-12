import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BookCover } from './BookCover'
import { Eyebrow } from './Eyebrow'
import { RatingBadge } from './RatingBadge'
import { useAuth } from '../auth/useAuth'
import {
  booksOnShelf,
  reorderShelf,
  SHELVES,
  spineToneFor,
  type LibraryItem,
  type Shelf as ShelfKey,
} from '../lib/library'

/**
 * The Library — one wooden cabinet holding three shelves (To Read · Read ·
 * Favorites), themed to the app (warm oak by day, walnut by night). Each shelf
 * is a recessed compartment with a horizontal-scroll row of fixed-width covers;
 * the wood crossbars between compartments read as the shelves the books stand
 * on. Tapping a cover goes straight to its page.
 *
 * On **your own** library the covers can be hand-arranged: hold a cover to lift
 * it, drag to reorder, and drop — the new left-to-right order persists (a quick
 * tap still just opens the book, and a horizontal swipe still scrolls). Dragging
 * a cover to the shelf's edge auto-scrolls, since a long shelf can't all fit. A
 * buddy's shelves are read-only.
 */

/** Shared cover width — fixed so 3–4 stand visible per shelf on a phone. */
const COVER = 'w-[80px] ipad:w-[92px]'

/** The cover + its rating badge — the tappable heart of a shelf book, shared by
 *  the static and the drag-sortable variants. */
function CoverLink({ item }: { item: LibraryItem }) {
  const { pathname } = useLocation()
  return (
    <Link
      to={`/book/${item.book.id}`}
      state={{ from: pathname }}
      aria-label={item.book.title}
      title={item.book.title}
      draggable={false}
      className={`relative block ${COVER} rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-accent`}
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
      {/* A rating, when there is one — perched at the foot of the cover, Fable-style. */}
      {item.rating != null && (
        <RatingBadge value={item.rating} className="absolute bottom-1 left-1" />
      )}
    </Link>
  )
}

/** One book standing on a read-only shelf (a buddy's profile). */
function ShelfBook({ item }: { item: LibraryItem }) {
  return (
    <li className="shelf-book shrink-0">
      <CoverLink item={item} />
    </li>
  )
}

/** One book on your own shelf — draggable to reorder. A hold lifts it; a plain
 *  tap falls through to the cover's Link. `disarmGuard`/`guarded` gate that Link:
 *  each gesture starts clean, a finished drag arms the guard, so a drop never also
 *  navigates while a real tap still opens the book. */
function SortableBook({
  item,
  disarmGuard,
  guarded,
}: {
  item: LibraryItem
  disarmGuard: () => void
  guarded: () => boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    position: isDragging ? 'relative' : undefined,
  }
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`shelf-book shrink-0 ${isDragging ? 'is-dragging' : ''}`}
      onPointerDownCapture={disarmGuard}
      onClickCapture={(e) => {
        if (guarded()) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      {...attributes}
      {...listeners}
    >
      <CoverLink item={item} />
    </li>
  )
}

/** Your own shelf: a drag-sortable, edge-auto-scrolling row. Order is held
 *  locally for a snappy drop, then persisted; the live library snapshot echoes
 *  the same order back, so there's no flash. */
function EditableShelf({
  shelf,
  items,
  uid,
}: {
  shelf: ShelfKey
  items: LibraryItem[]
  uid: string
}) {
  const wasDragging = useRef(false)
  // The last hand-arrangement, held locally for a snappy drop; null until the
  // reader drags. Set only in the drag handler — never in an effect.
  const [handOrder, setHandOrder] = useState<string[] | null>(null)

  // Derived, pure: apply the hand order over the current membership (so the live
  // snapshot's add/remove still flow through, new books landing leftmost); with
  // no hand order yet, fall straight through to the persisted booksOnShelf order.
  const orderIds = useMemo(() => {
    const incoming = items.map((i) => i.id)
    if (!handOrder) return incoming
    const inSet = new Set(incoming)
    const handSet = new Set(handOrder)
    const kept = handOrder.filter((id) => inSet.has(id))
    const added = incoming.filter((id) => !handSet.has(id))
    return [...added, ...kept]
  }, [items, handOrder])

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const ordered = orderIds
    .map((id) => byId.get(id))
    .filter((i): i is LibraryItem => i != null)

  // A short hold (220ms) starts the drag; moving more than a little before that
  // is read as a scroll/tap instead, so the shelf still swipes and covers still
  // open on a plain tap.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  )

  const onDragEnd = (e: DragEndEvent) => {
    wasDragging.current = true
    const { active, over } = e
    if (over && active.id !== over.id) {
      const from = orderIds.indexOf(String(active.id))
      const to = orderIds.indexOf(String(over.id))
      if (from >= 0 && to >= 0) {
        const next = arrayMove(orderIds, from, to)
        setHandOrder(next)
        void reorderShelf(uid, shelf, next)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={orderIds} strategy={horizontalListSortingStrategy}>
        <ul className="shelf-editable no-scrollbar flex gap-3 overflow-x-auto pb-1 pt-1">
          {ordered.map((it) => (
            <SortableBook
              key={it.id}
              item={it}
              disarmGuard={() => {
                wasDragging.current = false
              }}
              guarded={() => wasDragging.current}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

/** An empty shelf — two dashed cover-slots and a one-line hint. The leading `+`
 *  glyph is an "add a book" cue, so it only shows on your own bookcase; a buddy's
 *  empty shelf gets a plain placeholder (you can't shelve for them). */
function EmptyShelf({ hint, owner }: { hint: string; owner: boolean }) {
  return (
    <div className="flex items-stretch gap-3">
      <div
        className={`flex ${COVER} aspect-[2/3] shrink-0 items-center justify-center rounded-[7px] border border-dashed border-text-faint/45 text-2xl font-light text-text-faint/70`}
        aria-hidden="true"
      >
        {owner ? '+' : ''}
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

/** One compartment: a label + count, then the books (or the empty hint). Your own
 *  shelves are drag-sortable; a buddy's are static. */
function Shelf({
  shelf,
  label,
  hint,
  owner,
  uid,
  items,
}: {
  shelf: ShelfKey
  label: string
  hint: string
  owner: boolean
  uid?: string
  items: LibraryItem[]
}) {
  return (
    <section className="shelf-compartment">
      <div className="mb-3 flex items-baseline justify-between">
        <Eyebrow>{label}</Eyebrow>
        <span className="font-mono text-[10px] text-text-faint">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <EmptyShelf hint={hint} owner={owner} />
      ) : owner && uid ? (
        <EditableShelf shelf={shelf} items={items} uid={uid} />
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

/**
 * The wooden cabinet of three shelves. Renders your own library by default; pass
 * `owner={false}` with the shelf-holder's `name` on a buddy's profile, so empty
 * shelves lose the "add" cue and speak about them in the third person, and the
 * shelves become read-only (no reordering someone else's books).
 */
export function Bookshelf({
  items,
  owner = true,
  name,
}: {
  items: LibraryItem[]
  owner?: boolean
  name?: string
}) {
  const { user } = useAuth()
  const uid = owner ? user?.uid : undefined
  return (
    <div className="shelf-cabinet">
      {SHELVES.map((s) => (
        <Shelf
          key={s.key}
          shelf={s.key}
          label={s.label}
          hint={owner ? s.empty : s.emptyOther(name ?? 'They')}
          owner={owner}
          uid={uid}
          items={booksOnShelf(items, s.key)}
        />
      ))}
    </div>
  )
}
