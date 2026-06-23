import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookCover, type SpineTone } from './BookCover'

/**
 * A starter pick that lifts and creaks open — the front cover swings from the
 * spine to reveal a title page and the edges of the stacked leaves. On a mouse
 * it opens on hover; on touch it opens on a long-press (hold to peek, release to
 * close; a quick tap navigates). Pure CSS 3D; honours reduced-motion via the
 * global transition reset. Used only for the Shelf's curated row.
 */
export function StarterBook({
  title,
  author,
  coverUrl,
  tone,
  to,
}: {
  title: string
  author: string
  coverUrl: string
  tone: SpineTone
  to: string
}) {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const longPressed = useRef(false)

  const startPress = () => {
    longPressed.current = false
    timer.current = window.setTimeout(() => {
      longPressed.current = true
      setOpen(true)
    }, 300)
  }

  const endPress = () => {
    window.clearTimeout(timer.current)
    setOpen(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    // A long-press is a peek, not a tap — don't navigate when one just happened.
    if (longPressed.current) {
      e.preventDefault()
      longPressed.current = false
    }
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      onTouchMove={endPress}
      onContextMenu={(e) => e.preventDefault()}
      data-open={open}
      className="group block select-none [-webkit-touch-callout:none] [perspective:1200px]"
    >
      <div className="relative aspect-[2/3] [transform-style:preserve-3d] transition-transform duration-500 ease-out group-hover:-translate-y-2 group-data-[open=true]:-translate-y-2">
        {/* The leaves: a title page, with stacked page-edges along the fore-edge. */}
        <div className="absolute inset-0 overflow-hidden rounded-sm border border-border bg-[#f6efe0] shadow-[inset_0_0_10px_rgba(120,90,50,0.12)]">
          <div className="flex h-full w-full flex-col items-center justify-center px-3 text-center">
            <span className="font-display text-[0.72rem] font-medium leading-tight text-[#2b231b]">
              {title}
            </span>
            <span className="my-1.5 h-px w-5 bg-[#c2b390]" />
            <span className="font-mono text-[6px] uppercase tracking-[0.12em] text-[#7a6a56]">
              {author}
            </span>
          </div>
          {/* fore-edge: stacked leaf lines */}
          <div
            className="absolute inset-y-[3%] right-0 w-[6px]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg,#d8c6a4 0,#d8c6a4 1px,#f6efe0 1px,#f6efe0 2px)',
            }}
          />
        </div>

        {/* The front cover, hinged at the spine. */}
        <div className="absolute inset-0 origin-left [backface-visibility:hidden] [transform-style:preserve-3d] shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)] transition-[transform,box-shadow] duration-500 ease-out group-hover:[transform:rotateY(-38deg)] group-hover:shadow-[0_22px_30px_-12px_rgba(0,0,0,0.55)] group-data-[open=true]:[transform:rotateY(-38deg)] group-data-[open=true]:shadow-[0_22px_30px_-12px_rgba(0,0,0,0.55)]">
          <BookCover
            book={{ title, coverUrl, isbn13: null, isbn10: null }}
            author={author}
            tone={tone}
            className="h-full w-full"
          />
          {/* a faint inner-spine shadow that deepens as it opens */}
          <span className="pointer-events-none absolute inset-y-0 left-0 w-1/4 rounded-l-sm bg-gradient-to-r from-black/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-data-[open=true]:opacity-100" />
        </div>
      </div>
    </Link>
  )
}
