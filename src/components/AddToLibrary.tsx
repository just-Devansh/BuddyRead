import { useState } from 'react'
import {
  removeFromLibrary,
  setShelf,
  SHELVES,
  type LibraryBook,
  type Shelf,
} from '../lib/library'
import { useLibrary } from '../library/useLibrary'

/**
 * The "Add to Library" control: a button that opens a small, centred menu to
 * pick a shelf (To Read · Read · Favorites). Favorite implies Read. If the book
 * is already shelved, the button shows where, and the menu can move or remove
 * it. Writes go to `users/{uid}/library` via the live provider.
 */
export function AddToLibrary({ uid, book }: { uid: string; book: LibraryBook }) {
  const { items } = useLibrary()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<Shelf | 'remove' | null>(null)
  const [error, setError] = useState(false)

  const current = items.find((i) => i.id === book.id)?.shelf ?? null
  const currentLabel = SHELVES.find((s) => s.key === current)?.label ?? null

  const choose = async (shelf: Shelf) => {
    setBusy(shelf)
    setError(false)
    try {
      await setShelf(uid, book, shelf)
      setOpen(false)
    } catch {
      setError(true)
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    setBusy('remove')
    setError(false)
    try {
      await removeFromLibrary(uid, book.id)
      setOpen(false)
    } catch {
      setError(true)
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(false)
          setOpen(true)
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3.5 font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text ipad:w-auto ipad:px-10"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5.5C4 4.7 4.7 4 5.5 4H10v16H5.5C4.7 20 4 19.3 4 18.5z" />
          <path d="M20 5.5C20 4.7 19.3 4 18.5 4H14v16h4.5c.8 0 1.5-.7 1.5-1.5z" />
        </svg>
        {currentLabel ? `In your library · ${currentLabel}` : 'Add to Library'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="overlay-enter absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="pop-enter relative w-full max-w-xs rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <h2 className="font-display text-lg leading-tight text-text">Add to library</h2>
            <p className="mt-0.5 truncate text-sm text-text-muted">{book.title}</p>

            <ul className="mt-4 space-y-2">
              {SHELVES.map((s) => {
                const on = current === s.key
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void choose(s.key)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors disabled:opacity-60 ${
                        on
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-surface-alt hover:border-accent/40'
                      }`}
                    >
                      <span className="font-display text-lg leading-none text-text">
                        {s.label}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
                        {busy === s.key ? '…' : on ? '✓ here' : ''}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <p className="mt-2.5 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-text-faint">
              Favorites are also shelved under Read
            </p>

            {error && (
              <p className="mt-2 text-center text-sm text-text-muted">
                That didn't save. Try again in a moment.
              </p>
            )}

            {current && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void remove()}
                className="mt-3 w-full rounded-xl py-2 text-sm font-medium text-text-muted transition-colors hover:text-accent disabled:opacity-60"
              >
                {busy === 'remove' ? 'Removing…' : 'Remove from library'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
