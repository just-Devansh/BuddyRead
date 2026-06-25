import { useEffect, useRef } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Tints the confirm button as a weighty/destructive action. */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * A quiet modal for "are you sure?" moments. Backdrop click or Escape cancels;
 * the cancel button takes focus so a stray Enter never destroys anything.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <button
        type="button"
        aria-label="Cancel"
        tabIndex={-1}
        onClick={onCancel}
        className="overlay-enter absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div className="pop-enter relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <h2 id="confirm-title" className="font-display text-xl text-text">
          {title}
        </h2>
        {message && (
          <p className="mt-2 text-pretty text-sm leading-relaxed text-text-muted">
            {message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            ref={cancelRef}
            onClick={onCancel}
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-alt"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              'rounded-full px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90',
              destructive
                ? 'bg-text text-bg'
                : 'bg-accent text-accent-contrast',
            ].join(' ')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
