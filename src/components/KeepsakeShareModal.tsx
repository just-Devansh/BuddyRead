import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Eyebrow } from './Eyebrow'
import { FitToWidth } from './FitToWidth'
import { KeepsakeCard, KEEPSAKE_WIDTH, type KeepsakeSide } from './KeepsakeCard'
import type { ReadBook } from '../lib/reads'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error ?? new Error('read failed'))
    r.readAsDataURL(blob)
  })
}

/**
 * Turn a remote image URL into a `data:` URL so html-to-image can rasterize it
 * without tainting the export canvas.
 *
 * This is the whole reason Download/Share used to fail: Google serves book
 * covers (books.google.com) AND profile photos (googleusercontent.com) with no
 * `Access-Control-Allow-Origin` header. Drawing such an <img> onto a <canvas>
 * taints it, and the subsequent `canvas.toDataURL()` throws a SecurityError —
 * which surfaced as "Could not save the image."
 *
 * Strategy: fetch directly first (works for CORS-enabled hosts like Open
 * Library and anything same-origin), then fall back to the weserv image proxy,
 * which re-serves any image with `Access-Control-Allow-Origin: *`. Returns null
 * if every path fails, so the caller can export the card's typographic/initial
 * fallback rather than failing the whole export.
 */
async function inlineImage(url: string): Promise<string | null> {
  if (url.startsWith('data:')) return url
  const grab = async (u: string) => {
    const res = await fetch(u)
    if (!res.ok) throw new Error(`status ${res.status}`)
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) throw new Error('not an image')
    return blobToDataUrl(blob)
  }
  try {
    return await grab(url)
  } catch {
    /* not CORS-enabled — route it through the proxy below */
  }
  try {
    const proxied =
      'https://images.weserv.nl/?url=' +
      encodeURIComponent('ssl:' + url.replace(/^https?:\/\//, ''))
    return await grab(proxied)
  } catch {
    return null
  }
}

/**
 * Wraps the keepsake in a share surface: a light/dark toggle (so you can save it
 * in either mode regardless of the app's theme), a fitted preview, and Download
 * / Share. Export is html-to-image at 3× — the card carries its own palette, so
 * what you see is what lands in the PNG.
 */
export function KeepsakeShareModal({
  book,
  you,
  buddy,
  startedAt,
  defaultMode,
  onClose,
}: {
  book: ReadBook
  you: KeepsakeSide
  /** Omit (or null) for a solo read's single-side keepsake. */
  buddy?: KeepsakeSide | null
  startedAt: number | null
  defaultMode: 'light' | 'dark'
  onClose: () => void
}) {
  const [mode, setMode] = useState<'light' | 'dark'>(defaultMode)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The card's three remote images (cover + both avatars) inlined to data: URLs
  // so the export canvas stays CORS-clean. Seeded with the originals so the
  // preview shows instantly; swapped to data URLs (or null → fallback) once
  // resolved. See {@link inlineImage} for why this is necessary.
  const [assets, setAssets] = useState({
    cover: book.coverUrl ?? null,
    you: you.src ?? null,
    buddy: buddy?.src ?? null,
  })
  const assetsReady = useRef<Promise<void> | null>(null)

  const ensureAssets = () => {
    if (!assetsReady.current) {
      assetsReady.current = (async () => {
        const [cover, youSrc, buddySrc] = await Promise.all([
          book.coverUrl ? inlineImage(book.coverUrl) : null,
          you.src ? inlineImage(you.src) : null,
          buddy?.src ? inlineImage(buddy.src) : null,
        ])
        setAssets({ cover, you: youSrc, buddy: buddySrc })
      })()
    }
    return assetsReady.current
  }

  // Inline up front so the export is ready by the time anyone taps Download.
  useEffect(() => {
    void ensureAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cardRef = useRef<HTMLDivElement>(null)

  const filename = `${book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'read'}-buddyread.png`

  const render = async (): Promise<string> => {
    const node = cardRef.current
    if (!node) throw new Error('no card')

    // Inline the remote images (cover + avatars) to data: URLs, then wait for
    // React to commit the swap and the browser to decode them. Without this the
    // cross-origin images taint the canvas and toPng throws a SecurityError.
    await ensureAssets()
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    )
    await Promise.all(
      Array.from(node.querySelectorAll('img')).map((img) =>
        (img as HTMLImageElement).decode().catch(() => {}),
      ),
    )

    // Give web fonts a chance to settle before rasterizing — but never block on
    // it: document.fonts.ready can hang, and the export must not.
    if (document.fonts?.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 1500)),
      ])
    }

    // html-to-image can return a half-baked image on the very first pass (fonts
    // not yet inlined), so we prime it and keep the second pass. `cacheBust` is
    // off on purpose — it appends a query string that would turn a cacheable
    // image into a fresh (CORS-blocked) fetch.
    const opts = { pixelRatio: 3, cacheBust: false }
    const twice = async (o: typeof opts & { skipFonts?: boolean }) => {
      await toPng(node, o)
      return toPng(node, o)
    }
    try {
      return await twice(opts)
    } catch {
      // Embedding Google Fonts can reject behind a CORS wall — fall back to
      // system serifs rather than failing the whole export.
      return twice({ ...opts, skipFonts: true })
    }
  }

  const download = async () => {
    setBusy(true)
    setError(null)
    try {
      const dataUrl = await render()
      // A blob: object URL downloads more reliably than a huge data: URL, and
      // the anchor must be in the document for some browsers to honour it.
      const blob = await (await fetch(dataUrl)).blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.download = filename
      a.href = objUrl
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(objUrl), 10_000)
    } catch {
      setError('Could not save the image. Try again, or screenshot it instead.')
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    setBusy(true)
    setError(null)
    try {
      const url = await render()
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], filename, { type: 'image/png' })
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean
      }
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: book.title,
          text: `${book.title} — finished together on BuddyRead.`,
        })
      } else {
        // No file-share support (most desktops) — fall back to a download.
        const a = document.createElement('a')
        a.download = filename
        a.href = url
        a.click()
      }
    } catch (e) {
      // A user cancelling the share sheet throws AbortError — not an error.
      if ((e as Error)?.name !== 'AbortError')
        setError('Could not share the image. Try again, or screenshot it instead.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-5">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="overlay-enter absolute inset-0 bg-black/60"
      />

      <div className="pop-enter relative flex max-h-[92vh] w-full max-w-app flex-col overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center justify-between px-6 pt-5">
          <Eyebrow>Your keepsake</Eyebrow>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
          >
            Close
          </button>
        </div>

        {/* Light / dark toggle */}
        <div className="mt-4 flex justify-center px-6">
          <div className="inline-flex rounded-full border border-border bg-surface-alt p-1">
            {(['light', 'dark'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                  mode === m
                    ? 'bg-accent text-accent-contrast'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {m === 'light' ? 'Parchment' : 'Candlelit'}
              </button>
            ))}
          </div>
        </div>

        {/* Fitted preview */}
        <div className="mt-5 overflow-y-auto px-6">
          <FitToWidth width={KEEPSAKE_WIDTH}>
            <KeepsakeCard
              ref={cardRef}
              book={{ ...book, coverUrl: assets.cover }}
              you={{ ...you, src: assets.you }}
              buddy={buddy ? { ...buddy, src: assets.buddy } : null}
              startedAt={startedAt}
              mode={mode}
            />
          </FitToWidth>
        </div>

        {error && (
          <p className="px-6 pt-3 text-center text-sm text-accent">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6 pt-5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void download()}
            className="flex-1 rounded-xl border border-border bg-surface-alt py-3 font-medium text-text transition-colors hover:border-accent/40 disabled:opacity-60"
          >
            {busy ? 'Working…' : 'Download'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void share()}
            className="flex-1 rounded-xl bg-accent py-3 font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
