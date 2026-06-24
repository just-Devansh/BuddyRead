import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Eyebrow } from '../components/Eyebrow'
import { useConfirm } from '../components/useConfirm'
import { useAuth } from '../auth/useAuth'
import { useFriends } from '../friends/useFriends'
import { logActivity } from '../lib/activity'
import {
  acceptFriendRequest,
  normalizeInviteCode,
  otherParty,
  pairId,
  removeRelationship,
  resolveInviteCode,
  sendFriendRequest,
  type InviteTarget,
  type Relationship,
} from '../lib/friends'

/** A reader row: avatar + name, with an action slot on the right. */
function PersonRow({
  name,
  photoURL,
  subtitle,
  children,
}: {
  name: string | null
  photoURL: string | null
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3 border-t border-border-soft py-3.5">
      <Avatar src={photoURL} name={name} size="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg leading-tight text-text">
          {name ?? 'A reader'}
        </p>
        {subtitle && (
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </li>
  )
}

const PILL =
  'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50'
const PILL_SOLID = `${PILL} bg-accent text-accent-contrast hover:opacity-90`
const PILL_QUIET = `${PILL} border border-border text-text-muted hover:text-text`

export function Friends() {
  const { user } = useAuth()
  const { friends, incoming, outgoing, loading, error } = useFriends()

  // --- Add-by-code flow ----------------------------------------------------
  const [code, setCode] = useState('')
  const [resolving, setResolving] = useState(false)
  const [target, setTarget] = useState<InviteTarget | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  // ids being acted on, to disable their buttons briefly
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  // which friend's "⋮" options menu is open, if any
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  const setBusy = (id: string, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const lookUp = async () => {
    if (!user) return
    setTarget(null)
    setNotice(null)
    const clean = normalizeInviteCode(code)
    if (clean.length < 6) {
      setNotice('Invite codes are six characters.')
      return
    }
    setResolving(true)
    try {
      const found = await resolveInviteCode(clean)
      if (!found) {
        setNotice('No reader carries that code. Mind the spelling?')
        return
      }
      if (found.uid === user.uid) {
        setNotice("That's your own code — share it with a friend.")
        return
      }
      const existingId = pairId(user.uid, found.uid)
      if (friends.some((f) => f.id === existingId)) {
        setNotice("You're already reading together.")
        return
      }
      if (outgoing.some((o) => o.id === existingId)) {
        setNotice('You already have a request out to them.')
        return
      }
      if (incoming.some((i) => i.id === existingId)) {
        setNotice('They beat you to it — their request is waiting below.')
        return
      }
      setTarget(found)
    } catch {
      setNotice('That lookup failed. Try again in a moment?')
    } finally {
      setResolving(false)
    }
  }

  const send = async () => {
    if (!user || !target) return
    setSending(true)
    try {
      await sendFriendRequest(user, target)
      setTarget(null)
      setCode('')
      setNotice('Request sent. The ball is in their court.')
    } catch {
      setNotice("That didn't send. Try again?")
    } finally {
      setSending(false)
    }
  }

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id, true)
    try {
      await fn()
    } finally {
      setBusy(id, false)
    }
  }

  const friendName = (rel: Relationship) =>
    otherParty(rel, user?.uid ?? '').displayName

  return (
    <AppShell>
      <Eyebrow>Your reading circle</Eyebrow>
      <h1 className="mt-1 font-display text-4xl text-text">Friends</h1>
      <p className="mt-1 text-text-muted">
        The people you read alongside. Add one with their invite code.
      </p>

      {/* Add by code */}
      <section className="mt-6">
        <label
          htmlFor="invite"
          className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint"
        >
          Add by invite code
        </label>
        <div className="flex gap-2">
          <input
            id="invite"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setTarget(null)
              setNotice(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && void lookUp()}
            placeholder="e.g. K7M2QP"
            maxLength={8}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-alt px-3.5 py-2 font-mono text-sm uppercase tracking-[0.2em] text-text placeholder:tracking-normal placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="button"
            onClick={() => void lookUp()}
            disabled={resolving || !code.trim()}
            className={PILL_SOLID}
          >
            {resolving ? '…' : 'Find'}
          </button>
        </div>

        {notice && <p className="mt-2 text-sm text-text-muted">{notice}</p>}

        {target && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface-alt p-3">
            <Avatar src={target.photoURL} name={target.displayName} size="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg leading-tight text-text">
                {target.displayName ?? 'A reader'}
              </p>
              <p className="text-sm text-text-muted">Send a reading request?</p>
            </div>
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending}
              className={PILL_SOLID}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        )}
      </section>

      {loading && (
        <p className="mt-8 text-center text-sm text-text-muted">
          Gathering your circle…
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          Couldn't load your friends: {error}
        </p>
      )}

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-text">Wanting to read with you</h2>
          <ul className="mt-2">
            {incoming.map((r) => (
              <PersonRow key={r.id} name={r.fromName} photoURL={r.fromPhotoURL}>
                <button
                  type="button"
                  onClick={() =>
                    void act(r.id, async () => {
                      await acceptFriendRequest(r.id)
                      if (user) await logActivity(r.fromUid, user, 'friend_accepted')
                    })
                  }
                  disabled={busyIds.has(r.id)}
                  className={PILL_SOLID}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      await confirm({
                        title: 'Decline this request?',
                        message: `${r.fromName ?? 'They'} will be told it didn't take, and you can add each other later with an invite code.`,
                        confirmLabel: 'Decline',
                      })
                    )
                      void act(r.id, async () => {
                        if (user) await logActivity(r.fromUid, user, 'friend_declined')
                        await removeRelationship(r.id)
                      })
                  }}
                  disabled={busyIds.has(r.id)}
                  className={PILL_QUIET}
                >
                  Decline
                </button>
              </PersonRow>
            ))}
          </ul>
        </section>
      )}

      {/* The circle */}
      <section className="mt-8">
        <h2 className="font-display text-xl text-text">Your circle</h2>
        {!loading && friends.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-surface/60 p-8 text-center">
            <p className="text-pretty text-sm leading-relaxed text-text-muted">
              No one here yet. Trade invite codes with a friend and you'll both
              show up — ready to pick a book.
            </p>
          </div>
        ) : (
          <ul className="mt-2">
            {friends.map((r) => (
              <PersonRow
                key={r.id}
                name={friendName(r)}
                photoURL={otherParty(r, user?.uid ?? '').photoURL}
                subtitle="Reading buddy"
              >
                <Link
                  to={`/search?with=${otherParty(r, user?.uid ?? '').uid}&name=${encodeURIComponent(friendName(r) ?? '')}`}
                  className={PILL_SOLID}
                >
                  Read
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    aria-label="More options"
                    onClick={() => setOpenMenuId((id) => (id === r.id ? null : r.id))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-text-muted transition-colors hover:bg-surface-alt hover:text-text"
                  >
                    ⋮
                  </button>
                  {openMenuId === r.id && (
                    <>
                      <button
                        type="button"
                        aria-hidden
                        tabIndex={-1}
                        onClick={() => setOpenMenuId(null)}
                        className="fixed inset-0 z-10 cursor-default"
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[0_12px_28px_-12px_rgba(40,28,16,0.6)]">
                        <button
                          type="button"
                          disabled={busyIds.has(r.id)}
                          onClick={async () => {
                            setOpenMenuId(null)
                            if (
                              await confirm({
                                title: `Remove ${friendName(r) ?? 'this reader'}?`,
                                message:
                                  "You'll drop out of each other's circle and stop seeing each other's reading. You can always swap codes again later.",
                                confirmLabel: 'Remove',
                              })
                            )
                              void act(r.id, () => removeRelationship(r.id))
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-text-muted transition-colors hover:bg-surface-alt hover:text-text disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </PersonRow>
            ))}
          </ul>
        )}
      </section>

      {/* Outgoing requests */}
      {outgoing.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-text">Waiting on a reply</h2>
          <ul className="mt-2">
            {outgoing.map((r) => (
              <PersonRow
                key={r.id}
                name={r.toName}
                photoURL={r.toPhotoURL}
                subtitle="Request sent"
              >
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      await confirm({
                        title: 'Withdraw this request?',
                        message: `We'll cancel your request to ${r.toName ?? 'them'}. You can send it again anytime.`,
                        confirmLabel: 'Withdraw',
                      })
                    )
                      void act(r.id, () => removeRelationship(r.id))
                  }}
                  disabled={busyIds.has(r.id)}
                  className={PILL_QUIET}
                >
                  Cancel
                </button>
              </PersonRow>
            ))}
          </ul>
        </section>
      )}

      {dialog}
    </AppShell>
  )
}
