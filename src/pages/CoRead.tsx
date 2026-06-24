import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BookCover } from '../components/BookCover'
import { Eyebrow } from '../components/Eyebrow'
import { LogSessionSheet } from '../components/LogSessionSheet'
import { SplitProgressCard } from '../components/SplitProgressCard'
import { useConfirm } from '../components/useConfirm'
import { useAuth } from '../auth/useAuth'
import { useReads } from '../reads/useReads'
import { logActivity } from '../lib/activity'
import {
  fractionFor,
  logMyProgress,
  otherReader,
  removeRead,
  setupMyProgress,
} from '../lib/reads'

const EDITIONS = ['Paperback', 'Hardcover', 'Kindle', 'Ebook', 'Audiobook']

/** First-time setup for my side: my edition and how long it runs. */
function SetupMine({
  readId,
  uid,
  defaultTotal,
}: {
  readId: string
  uid: string
  defaultTotal: number | null
}) {
  const [edition, setEdition] = useState(EDITIONS[0])
  const [total, setTotal] = useState(defaultTotal ? String(defaultTotal) : '')
  const [start, setStart] = useState('0')
  const [busy, setBusy] = useState(false)

  const totalNum = Number(total)
  const valid = totalNum > 0 && Number(start) >= 0 && Number(start) <= totalNum

  const save = async () => {
    if (!valid) return
    setBusy(true)
    try {
      await setupMyProgress(readId, uid, edition, totalNum, Number(start))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface p-5">
      <Eyebrow className="block">Set up your edition</Eyebrow>
      <p className="mt-1.5 text-sm text-text-muted">
        Editions differ — tell us yours so the pace lines up.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {EDITIONS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEdition(e)}
            className={`rounded-xl py-2.5 text-sm transition-colors ${
              edition === e
                ? 'bg-accent text-accent-contrast'
                : 'border border-border bg-surface-alt text-text-muted hover:text-text'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block">
          <Eyebrow className="mb-2 block">Total pages</Eyebrow>
          <input
            inputMode="numeric"
            value={total}
            onChange={(e) => setTotal(e.target.value.replace(/\D/g, ''))}
            placeholder="—"
            className="w-full rounded-xl border border-border bg-surface-alt px-4 py-3 font-mono text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="block">
          <Eyebrow className="mb-2 block">Starting at</Eyebrow>
          <input
            inputMode="numeric"
            value={start}
            onChange={(e) => setStart(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-xl border border-border bg-surface-alt px-4 py-3 font-mono text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={!valid || busy}
        onClick={() => void save()}
        className="mt-5 w-full rounded-xl bg-accent py-3.5 font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? 'Just a moment…' : 'Begin reading'}
      </button>
    </div>
  )
}

/** A one-line nudge about pace — companionable, never a scoreboard. */
function paceLine(mine: number | null, theirs: number | null, buddyName: string) {
  if (mine == null || theirs == null) return null
  const gap = Math.round(Math.abs(mine - theirs) * 100)
  if (gap <= 2) return 'In step · reading shoulder to shoulder'
  return theirs > mine
    ? `${buddyName} is ${gap}% ahead · keep pace`
    : `You're ${gap}% ahead · give them a moment`
}

/**
 * The co-read screen — the heart of the app. A book strip, the split progress
 * card, your buddy's latest note, and a button to log tonight's pages. Real,
 * live data via ReadsProvider.
 */
export function CoRead() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { active, loading } = useReads()
  const { confirm, dialog } = useConfirm()
  const [logging, setLogging] = useState(false)
  const [saving, setSaving] = useState(false)

  const uid = user?.uid ?? ''
  const read = active.find((r) => r.id === id)

  if (!read) {
    return (
      <AppShell>
        <Link
          to="/home"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
        >
          ‹ Shelf
        </Link>
        <p className="mt-10 text-center text-sm text-text-muted">
          {loading ? 'Finding your read…' : "This read isn't on your shelf."}
        </p>
      </AppShell>
    )
  }

  const buddy = otherReader(read, uid)
  const mine = read.progress?.[uid]
  const theirs = read.progress?.[buddy.uid]
  const buddyName = buddy.displayName ?? 'Your buddy'

  const save = async (page: number, note: string) => {
    setSaving(true)
    try {
      await logMyProgress(read.id, uid, page, note)
      if (user)
        await logActivity(buddy.uid, user, 'read_logged', {
          bookTitle: read.book.title,
          page,
          note: note.trim() || null,
        })
      setLogging(false)
    } finally {
      setSaving(false)
    }
  }

  const leave = async () => {
    const ok = await confirm({
      title: 'Leave this read?',
      message: `You'll both drop out of “${read.book.title}” and lose its progress and notes. You can always start it again later.`,
      confirmLabel: 'Leave',
    })
    if (!ok) return
    if (user) await logActivity(buddy.uid, user, 'read_left', { bookTitle: read.book.title })
    await removeRead(read.id)
    navigate('/home')
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Link
          to="/home"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
        >
          ‹ Shelf
        </Link>
        <Eyebrow>Reading together</Eyebrow>
        <button
          type="button"
          onClick={() => void leave()}
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint transition-colors hover:text-accent"
        >
          Leave
        </button>
      </div>

      {/* Book strip */}
      <div className="mt-5 flex items-center gap-4">
        <BookCover
          book={{
            title: read.book.title,
            coverUrl: read.book.coverUrl,
            isbn13: null,
            isbn10: null,
          }}
          author={read.book.authors[0]}
          className="w-14 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl leading-tight text-text">
            {read.book.title}
          </h1>
          <p className="text-text-muted">{read.book.authors.join(', ')}</p>
          <Eyebrow className="mt-1.5 block">with {buddyName}</Eyebrow>
        </div>
      </div>

      {/* My side needs setting up before the card can show my pace */}
      {!mine ? (
        <SetupMine readId={read.id} uid={uid} defaultTotal={read.book.pageCount} />
      ) : (
        <>
          <div className="mt-5">
            <SplitProgressCard
              you={{ name: 'You', tone: 'terracotta', progress: mine }}
              buddy={{ name: buddyName, tone: 'gold', progress: theirs }}
              paceLine={paceLine(
                fractionFor(read, uid),
                fractionFor(read, buddy.uid),
                buddyName,
              )}
            />
          </div>

          {/* Buddy's latest note, if any */}
          {theirs?.note && (
            <div className="mt-5 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <Eyebrow>{buddyName}'s note</Eyebrow>
                <span className="font-mono text-[9px] text-text-faint">
                  p.{theirs.currentPage}
                </span>
              </div>
              <p className="mt-2 font-display text-lg italic leading-snug text-text-muted">
                “{theirs.note}”
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setLogging(true)}
            className="mt-6 w-full rounded-xl bg-accent py-4 font-medium text-accent-contrast shadow-[0_12px_24px_-14px_rgba(138,69,54,0.7)] transition-opacity hover:opacity-90"
          >
            Log tonight's pages
          </button>

          {logging && (
            <LogSessionSheet
              open
              startPage={mine.currentPage}
              total={mine.totalPages}
              edition={mine.edition}
              buddyName={buddyName}
              saving={saving}
              onSave={(page, note) => void save(page, note)}
              onClose={() => setLogging(false)}
            />
          )}
        </>
      )}

      {dialog}
    </AppShell>
  )
}
