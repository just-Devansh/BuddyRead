import { Avatar } from './Avatar'
import { Eyebrow } from './Eyebrow'

export type PickableBuddy = {
  uid: string
  displayName: string | null
  photoURL: string | null
}

/**
 * A bottom-sheet to choose which friend to start a read with. Friends already
 * reading this book (or already invited) are shown disabled with a quiet note.
 */
export function BuddyPicker({
  open,
  title,
  friends,
  disabled,
  busyUid,
  onPick,
  onClose,
}: {
  open: boolean
  title: string
  friends: PickableBuddy[]
  disabled: Record<string, string> // uid -> reason
  busyUid: string | null
  onPick: (buddy: PickableBuddy) => void
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="overlay-enter absolute inset-0 bg-black/55"
      />
      <div className="sheet-enter relative w-full max-w-app rounded-t-[28px] bg-surface px-6 pb-8 pt-3 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.5)]">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="font-display text-2xl leading-tight text-text">
          Read <span className="italic">{title}</span> with…
        </h2>
        <Eyebrow className="mt-1 block">Pick a buddy</Eyebrow>

        <ul className="mt-4 max-h-[50vh] overflow-y-auto">
          {friends.map((f) => {
            const reason = disabled[f.uid]
            const busy = busyUid === f.uid
            return (
              <li key={f.uid}>
                <button
                  type="button"
                  disabled={!!reason || busy}
                  onClick={() => onPick(f)}
                  className="flex w-full items-center gap-3 border-t border-border-soft py-3.5 text-left transition-colors enabled:hover:bg-surface-alt disabled:opacity-50"
                >
                  <Avatar src={f.photoURL} name={f.displayName} size="h-10 w-10" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg leading-tight text-text">
                      {f.displayName ?? 'A reader'}
                    </span>
                    {reason && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint">
                        {reason}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent">
                    {busy ? 'Sending…' : reason ? '' : 'Send ›'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
