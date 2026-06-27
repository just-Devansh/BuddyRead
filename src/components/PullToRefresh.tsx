import { useRef, useState, type ReactNode, type TouchEvent } from 'react'

const THRESHOLD = 70 // pull past this (px) to trigger
const MAX = 96 // furthest the content travels
const MIN_SPIN = 1200 // keep the dots up at least this long, so it never blinks

/**
 * A custom pull-to-refresh that only engages when the page is already scrolled to
 * the very top. On-theme (terracotta arc on the app background), adaptive to
 * light/dark via tokens, and deliberately gentle: the content follows the finger
 * with damping, springs back on release, and the spinner is held a beat so a
 * fast refresh never flashes. Native overscroll-refresh is disabled in CSS, so
 * this is the only refresh gesture.
 *
 * `onRefresh` is awaited; with a realtime backend the data is already live, so
 * by default the gesture just settles smoothly (the indicator is the point).
 */
export function PullToRefresh({
  children,
  onRefresh,
}: {
  children: ReactNode
  onRefresh?: () => Promise<void> | void
}) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const startY = useRef<number | null>(null)

  const atTop = () =>
    (window.scrollY || document.documentElement.scrollTop || 0) <= 0

  const onTouchStart = (e: TouchEvent) => {
    if (refreshing || !atTop()) {
      startY.current = null
      return
    }
    startY.current = e.touches[0].clientY
  }

  const onTouchMove = (e: TouchEvent) => {
    if (startY.current == null || refreshing) return
    const dy = e.touches[0].clientY - startY.current
    // Only a downward pull from the top counts; anything else hands control back
    // to normal scrolling.
    if (dy <= 0 || !atTop()) {
      if (pull !== 0) setPull(0)
      startY.current = atTop() ? startY.current : null
      return
    }
    setDragging(true)
    // Resistance: the further you pull, the slower it gives.
    setPull(Math.min(MAX, dy * 0.5))
  }

  const onTouchEnd = async () => {
    if (startY.current == null) return
    startY.current = null
    setDragging(false)
    if (pull < THRESHOLD) {
      setPull(0)
      return
    }
    setRefreshing(true)
    setPull(THRESHOLD * 0.62) // rest at a calm spot while it spins
    try {
      await Promise.all([
        Promise.resolve(onRefresh?.()),
        new Promise((r) => setTimeout(r, MIN_SPIN)),
      ])
    } finally {
      setRefreshing(false)
      setPull(0)
    }
  }

  const progress = Math.min(1, pull / THRESHOLD)
  // A lingering transform makes this the containing block for fixed children
  // (every modal), so when idle we set no transform at all.
  const lifted = pull > 0 || refreshing

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      className="relative"
    >
      {/* Three terracotta dots, centred, that pulse in sequence while refreshing
          and grow in as you pull. Descends from above the top edge. */}
      <div
        aria-hidden={!lifted}
        className="pointer-events-none absolute left-1/2 top-0 z-20 flex items-center gap-2"
        style={{
          transform: `translate(-50%, ${pull - 26}px)`,
          opacity: refreshing ? 1 : progress,
          transition: dragging ? 'none' : 'transform 360ms cubic-bezier(0.22,0.61,0.18,1), opacity 200ms ease',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`block h-2.5 w-2.5 rounded-full bg-accent ${refreshing ? 'ptr-dot' : ''}`}
            style={
              refreshing
                ? { animationDelay: `${i * 160}ms` }
                : { transform: `scale(${0.5 + progress * 0.5})` }
            }
          />
        ))}
      </div>

      <div
        style={{
          transform: lifted ? `translateY(${pull}px)` : undefined,
          transition: dragging ? 'none' : 'transform 360ms cubic-bezier(0.22,0.61,0.18,1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
