import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BookCover } from '../components/BookCover'
import { CloseReadSheet } from '../components/CloseReadSheet'
import { Eyebrow } from '../components/Eyebrow'
import { FitToWidth } from '../components/FitToWidth'
import { KeepsakeCard, KEEPSAKE_WIDTH } from '../components/KeepsakeCard'
import { KeepsakeShareModal } from '../components/KeepsakeShareModal'
import { LogSessionSheet } from '../components/LogSessionSheet'
import { SplitProgressCard } from '../components/SplitProgressCard'
import { StarRating } from '../components/StarRating'
import { useConfirm } from '../components/useConfirm'
import { useAuth } from '../auth/useAuth'
import { useTheme } from '../theme/useTheme'
import { useReads } from '../reads/useReads'
import { clearReadActivity, logActivity } from '../lib/activity'
import { setShelf } from '../lib/library'
import { formatRating } from '../lib/rating'
import {
  bothFinished,
  finishFor,
  finishRead,
  fractionFor,
  isSolo,
  logMyProgress,
  otherReader,
  removeRead,
  reopenRead,
  setupMyProgress,
  type Verdict,
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
  const { resolved } = useTheme()
  const { active, loading } = useReads()
  const { confirm, dialog } = useConfirm()
  const [logging, setLogging] = useState(false)
  const [closing, setClosing] = useState(false)
  const [sharing, setSharing] = useState(false)
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

  const solo = isSolo(read)
  const buddy = solo ? null : otherReader(read, uid)
  const mine = read.progress?.[uid]
  const theirs = buddy ? read.progress?.[buddy.uid] : undefined
  const buddyName = buddy?.displayName ?? 'Your buddy'
  const myFinish = finishFor(read, uid)
  const theirFinish = buddy ? finishFor(read, buddy.uid) : null
  const bothDone = bothFinished(read) // verdicts unseal once finished (both, or you if solo)

  // The keepsake's sides (only meaningful once the book's been closed).
  const startedAt = read.respondedAt?.toMillis() ?? read.createdAt?.toMillis() ?? null
  const youSide =
    myFinish && { name: 'You', src: user?.photoURL, finish: myFinish, progress: mine }
  const buddySide =
    buddy && theirFinish
      ? { name: buddyName, src: buddy.photoURL, finish: theirFinish, progress: theirs }
      : null
  // Solo keepsakes show once you close; buddy keepsakes once you both have.
  const keepsakeReady = bothDone && youSide && (solo || buddySide)

  const save = async (page: number, note: string, mood: string | null) => {
    setSaving(true)
    try {
      await logMyProgress(read.id, uid, page, note, mood)
      // Page logs go to the buddy's feed (never your own); a solo read has no one
      // to notify, so it logs nothing.
      if (user && buddy)
        await logActivity(buddy.uid, user, 'read_logged', {
          bookTitle: read.book.title,
          bookId: read.book.id,
          page,
          note: note.trim() || null,
          mood,
        })
      setLogging(false)
    } finally {
      setSaving(false)
    }
  }

  const finish = async (verdict: Verdict) => {
    setSaving(true)
    try {
      await finishRead(read.id, uid, verdict, mine?.totalPages ?? null)
      // A finish files the book on your shelf automatically; loving it favorites
      // it (and favorite implies read). Setting it down touches no shelf.
      if (!verdict.dnf)
        await setShelf(uid, read.book, verdict.favorite ? 'favorite' : 'read')
      if (user) {
        const type = verdict.dnf ? 'read_set_down' : 'read_finished'
        const detail = { bookTitle: read.book.title, bookId: read.book.id }
        // Buddy reads tell the buddy; a solo read records it in your own feed.
        if (buddy) await logActivity(buddy.uid, user, type, detail)
        else await logActivity(uid, user, type, detail)
      }
      setClosing(false)
    } finally {
      setSaving(false)
    }
  }

  const reopen = async () => {
    const ok = await confirm({
      title: 'Reopen this read?',
      message: `Your verdict on “${read.book.title}” will be cleared and you'll be back to logging pages.`,
      confirmLabel: 'Reopen',
    })
    if (!ok) return
    await reopenRead(read.id, uid)
  }

  const leave = async () => {
    const ok = await confirm(
      solo
        ? {
            title: 'Set this read aside?',
            message: `You'll clear your progress on “${read.book.title}”. You can always start it again later.`,
            confirmLabel: 'Set aside',
          }
        : {
            title: 'Leave this read?',
            message: `You'll both drop out of “${read.book.title}” and the shared card will be cleared. You can always start it again later.`,
            confirmLabel: 'Leave',
          },
    )
    if (!ok) return
    if (user) {
      // Tidy your own feed: keep only the "begun" line, then record that you left.
      await clearReadActivity(uid, read.book.id)
      const detail = { bookTitle: read.book.title, bookId: read.book.id }
      if (buddy) {
        // withName marks it a buddy-read leave (vs solo) in the feed copy.
        await logActivity(buddy.uid, user, 'read_left', { ...detail, withName: user.displayName })
        await logActivity(uid, user, 'read_left', { ...detail, withName: buddyName })
      } else {
        await logActivity(uid, user, 'read_left', detail)
      }
    }
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
        <Eyebrow>{solo ? 'Reading solo' : 'Reading together'}</Eyebrow>
        <button
          type="button"
          onClick={() => void leave()}
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint transition-colors hover:text-accent"
        >
          {solo ? 'Set aside' : 'Leave'}
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
          <Eyebrow className="mt-1.5 block">{solo ? 'On your own' : `with ${buddyName}`}</Eyebrow>
        </div>
      </div>

      {/* My side needs setting up before the card can show my pace */}
      {!mine ? (
        <SetupMine readId={read.id} uid={uid} defaultTotal={read.book.pageCount} />
      ) : (
        <>
          {keepsakeReady && youSide ? (
            /* The book's closed — the keepsake appears (solo: just yours). */
            <div className="mt-6">
              <div className="text-center">
                <Eyebrow className="block">
                  {solo ? "You've closed the book" : "You've both closed the book"}
                </Eyebrow>
                <p className="mx-auto mt-2 max-w-md text-pretty leading-relaxed text-text-muted">
                  Here's what “{read.book.title}” left you{solo ? '' : ' both'}.
                </p>
              </div>
              <div className="mt-6">
                <FitToWidth width={KEEPSAKE_WIDTH}>
                  <KeepsakeCard
                    book={read.book}
                    you={youSide}
                    buddy={buddySide}
                    startedAt={startedAt}
                    mode={resolved}
                  />
                </FitToWidth>
              </div>
              <button
                type="button"
                onClick={() => setSharing(true)}
                className="mt-6 w-full rounded-xl bg-accent py-3.5 font-medium text-accent-contrast transition-opacity hover:opacity-90"
              >
                Save or share this keepsake
              </button>
            </div>
          ) : (
            <>
              <div className="mt-5">
                <SplitProgressCard
                  you={{ name: 'You', tone: 'terracotta', src: user?.photoURL, progress: mine }}
                  buddy={
                    buddy
                      ? {
                          name: buddyName,
                          tone: 'gold',
                          src: buddy.photoURL,
                          to: `/u/${buddy.uid}`,
                          progress: theirs,
                        }
                      : null
                  }
                  paceLine={
                    buddy
                      ? paceLine(fractionFor(read, uid), fractionFor(read, buddy.uid), buddyName)
                      : null
                  }
                />
              </div>

              {/* Buddy's latest note, if any */}
              {buddy && theirs?.note && (
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

              {myFinish ? (
                /* I've closed the book — my verdict, sealed until they finish too. */
                <div className="mt-6 rounded-2xl border border-border bg-surface p-5 text-center">
                  <Eyebrow className="block">
                    {myFinish.dnf ? 'You set this down' : 'You closed the book'}
                  </Eyebrow>
                  {!myFinish.dnf && myFinish.rating != null && (
                    <div className="mt-3 flex flex-col items-center gap-1.5">
                      <StarRating value={myFinish.rating} size="text-2xl" />
                      <span className="font-display text-lg text-text-muted">
                        {formatRating(myFinish.rating)}
                        {myFinish.favorite && <span className="ml-1.5 text-accent">♥</span>}
                      </span>
                    </div>
                  )}
                  {myFinish.review && (
                    <p className="mx-auto mt-3 max-w-md font-display text-lg italic leading-snug text-text-muted">
                      “{myFinish.review}”
                    </p>
                  )}
                  <p className="mt-4 text-sm leading-relaxed text-text-muted">
                    Sealed until {buddyName} finishes — then you'll read each other's at once.
                  </p>
                  <button
                    type="button"
                    onClick={() => void reopen()}
                    className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint transition-colors hover:text-accent"
                  >
                    Reopen this read
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setLogging(true)}
                    className="mt-6 w-full rounded-xl bg-accent py-4 font-medium text-accent-contrast shadow-[0_12px_24px_-14px_rgba(138,69,54,0.7)] transition-opacity hover:opacity-90"
                  >
                    Log tonight's pages
                  </button>
                  <button
                    type="button"
                    onClick={() => setClosing(true)}
                    className="mx-auto mt-3 block font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint transition-colors hover:text-accent"
                  >
                    Close this read ›
                  </button>
                </>
              )}
            </>
          )}

          {logging && (
            <LogSessionSheet
              open
              startPage={mine.currentPage}
              startMood={mine.mood}
              total={mine.totalPages}
              edition={mine.edition}
              buddyName={buddyName}
              saving={saving}
              onSave={(page, note, mood) => void save(page, note, mood)}
              onClose={() => setLogging(false)}
            />
          )}

          {closing && (
            <CloseReadSheet
              open
              bookTitle={read.book.title}
              buddyName={buddyName}
              solo={solo}
              saving={saving}
              onSave={(verdict) => void finish(verdict)}
              onClose={() => setClosing(false)}
            />
          )}

          {sharing && youSide && (
            <KeepsakeShareModal
              book={read.book}
              you={youSide}
              buddy={buddySide}
              startedAt={startedAt}
              defaultMode={resolved}
              onClose={() => setSharing(false)}
            />
          )}
        </>
      )}

      {dialog}
    </AppShell>
  )
}
