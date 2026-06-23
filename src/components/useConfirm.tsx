import { useCallback, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

type ConfirmOptions = {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Weighty/destructive tint on the confirm button. Defaults to true. */
  destructive?: boolean
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void }

/**
 * Awaitable confirmation: `await confirm({ title, … })` resolves true/false, and
 * `dialog` is dropped once into the page. One quiet "are you sure?" for every
 * irreversible action, so a stray tap never destroys anything. Reuses the shared
 * ConfirmDialog (backdrop/Escape cancels, cancel button takes focus).
 */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  )

  const settle = (ok: boolean) => {
    pending?.resolve(ok)
    setPending(null)
  }

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.title ?? ''}
      message={pending?.message}
      confirmLabel={pending?.confirmLabel ?? 'Confirm'}
      cancelLabel={pending?.cancelLabel ?? 'Keep'}
      destructive={pending?.destructive ?? true}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  )

  return { confirm, dialog }
}
