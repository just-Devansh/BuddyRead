import { useEffect, useState } from 'react'
import type { Timestamp } from 'firebase/firestore'
import { Eyebrow } from './Eyebrow'
import {
  changeUsername,
  cooldownRemaining,
  daysFromMs,
  isUsernameFree,
  normalizeUsername,
  UsernameError,
  usernameError,
} from '../lib/username'

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

/**
 * Edit your handle. Live availability + format checks as you type, the 30-day
 * cooldown surfaced up front. (Avatar presets will join this dialog next.)
 */
export function EditProfileDialog({
  open,
  uid,
  currentUsername,
  usernameUpdatedAt,
  onClose,
}: {
  open: boolean
  uid: string
  currentUsername: string
  usernameUpdatedAt: Timestamp | null | undefined
  onClose: () => void
}) {
  const [value, setValue] = useState(currentUsername)
  // The availability result is tagged with the name it's for, so a stale result
  // for an old keystroke is simply ignored in render (no setState in the effect).
  const [avail, setAvail] = useState<{ name: string; free: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = cooldownRemaining(usernameUpdatedAt)
  const locked = remaining > 0
  const next = normalizeUsername(value)
  const changed = next !== currentUsername

  const status: Status = !changed
    ? 'idle'
    : usernameError(next)
      ? 'invalid'
      : avail && avail.name === next
        ? avail.free
          ? 'available'
          : 'taken'
        : 'checking'

  useEffect(() => {
    if (!changed || usernameError(next)) return
    let active = true
    const t = setTimeout(() => {
      isUsernameFree(next, uid)
        .then((free) => {
          if (active) setAvail({ name: next, free })
        })
        .catch(() => {})
    }, 400)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [next, changed, uid])

  if (!open) return null

  const canSave = !locked && changed && status === 'available' && !saving

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await changeUsername(uid, next)
      onClose()
    } catch (e) {
      setError(e instanceof UsernameError ? e.message : 'That didn\'t take — try again?')
    } finally {
      setSaving(false)
    }
  }

  const hint =
    status === 'invalid' ? usernameError(next) :
    status === 'checking' ? 'Checking…' :
    status === 'taken' ? 'That username is taken.' :
    status === 'available' ? 'Available.' :
    null
  const hintTone = status === 'available' ? 'text-accent' : 'text-text-muted'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <h2 className="font-display text-xl text-text">Your username</h2>
        <p className="mt-1 text-sm text-text-muted">
          How buddies find and recognise you. Changeable once every 30 days.
        </p>

        <Eyebrow className="mb-2 mt-5 block">Username</Eyebrow>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-alt px-3.5 py-2 focus-within:ring-2 focus-within:ring-accent">
          <span className="font-mono text-text-faint">@</span>
          <input
            value={value}
            disabled={locked || saving}
            onChange={(e) => {
              setValue(normalizeUsername(e.target.value))
              setError(null)
            }}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent font-mono text-text placeholder:text-text-muted/60 focus:outline-none disabled:opacity-60"
          />
        </div>

        {locked ? (
          <p className="mt-2 text-sm text-text-muted">
            You can change it again in {daysFromMs(remaining)} day
            {daysFromMs(remaining) > 1 ? 's' : ''}.
          </p>
        ) : (
          hint && <p className={`mt-2 text-sm ${hintTone}`}>{hint}</p>
        )}
        {error && <p className="mt-2 text-sm text-text-muted">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-alt"
          >
            {locked ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => void save()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
