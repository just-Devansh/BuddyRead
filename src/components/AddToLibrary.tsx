import { useState } from 'react'
import { Eyebrow } from './Eyebrow'
import { useLibrary } from '../library/useLibrary'
import {
  removeFromLibrary,
  setShelf,
  SHELVES,
  type LibraryBook,
  type Shelf,
} from '../lib/library'

const SHELF_NOTE: Record<Shelf, string> = {
  tbr: 'On the pile, waiting its turn.',
  read: 'A book you’ve finished.',
  favorite: 'A keeper — also shelved under Read.',
}

/**
 * The "Add to Library" control for a book: a button that opens a small sheet to
 * pick a shelf (To Read · Read · Favorites). Favorite implies Read. If the book
 * is already shelved, the button shows where, and the sheet can move or remove
 * it. Writes go straight to `users/{uid}/library` via the live provider.
 */
export function AddToLibrary({ uid, book }: { uid: string; book: LibraryBook }) {
  const { items } = useLibrary()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const current = items.find((i) => i.id === book.id)?.shelf ?? null
  const currentLabel = SHELVES.find((s) => s.key === current)?.label ?? null

  const choose = async (shelf: Shelf) => {
    setBusy(true)
    try {
      await setShelf(uid, book, shelf)
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await removeFromLibrary(uid, book.id)
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3.5 font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text ipad:w-auto ipad:px-10"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5.5C4 4.7 4.7 4 5.5 4H10v16H5.5C4.7 20 4 19.3 4 18.5z" />
          <path d="M20 5.5C20 4.7 19.3 4 18.5 4H14v16h4.5c.8 0 1.5-.7 1.5-1.5z" />
        </svg>
        {currentLabel ? `In your library · ${currentLabel}` : 'Add to Library'}
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-end justify-center">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="overlay-enter absolute inset-0 bg-black/55"
          />
          <div className="sheet-enter relative w-full max-w-app rounded-t-[28px] bg-surface px-6 pb-8 pt-3 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.5)]">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
            <h2 className="font-display text-2xl leading-tight text-text">
              Shelve <span className="italic">{book.title}</span>
            </h2>
            <Eyebrow className="mt-1 block">Choose a shelf</Eyebrow>

            <ul className="mt-4 space-y-2.5">
              {SHELVES.map((s) => {
                const on = current === s.key
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void choose(s.key)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                        on
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-surface-alt hover:border-accent/40'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg leading-tight text-text">
                          {s.label}
                        </span>
                        <span className="block text-sm text-text-muted">
                          {SHELF_NOTE[s.key]}
                        </span>
                      </span>
                      {on && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
                          ✓ here
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>

            {current && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="mt-4 w-full rounded-xl py-3 text-sm font-medium text-text-muted transition-colors hover:text-accent disabled:opacity-60"
              >
                Remove from library
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
