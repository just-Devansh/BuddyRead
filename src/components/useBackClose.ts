import { useEffect, useRef } from 'react'

/**
 * Make the device/browser **Back** button (and Android's back gesture) dismiss
 * an open overlay instead of navigating away from the page underneath it.
 *
 * While `active`, a throwaway history entry is pushed; pressing Back pops it and
 * closes the topmost overlay. Closing from the UI (backdrop, drag, save) instead
 * consumes the entry, so Back is never needed twice and the stack stays
 * balanced.
 *
 * Why a single module-level stack + one persistent listener (rather than a
 * per-instance listener)? Because overlays nest and hand off: a menu opens a
 * confirm dialog in the *same* tick, or a confirm opens a sheet. With per-hook
 * listeners, the programmatic `history.back()` one overlay fires while tearing
 * down would land on *another* overlay's listener and dismiss the wrong thing.
 * Here, every instance shares one listener and an `expectedProgrammatic` counter,
 * so a pop we caused ourselves is swallowed globally and only a genuine user Back
 * closes the topmost overlay. The placeholder entries are interchangeable (same
 * URL), so it only matters that their *count* tracks the number of open overlays
 * — which this keeps true through nesting and React StrictMode's double-invoke.
 */
type Overlay = { close: () => void; closedByBack: boolean }

const stack: Overlay[] = []
let expectedProgrammatic = 0
let listening = false

function onPopState() {
  // A pop we triggered ourselves (consuming an entry on teardown) — swallow it.
  if (expectedProgrammatic > 0) {
    expectedProgrammatic--
    return
  }
  // A genuine Back press → close the topmost overlay. Its entry is already gone
  // from history; mark it so the unmount cleanup doesn't pop a second time.
  const top = stack.pop()
  if (top) {
    top.closedByBack = true
    top.close()
  }
}

function ensureListening() {
  if (listening) return
  window.addEventListener('popstate', onPopState)
  listening = true
}

export function useBackClose(active: boolean, close: () => void) {
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })

  useEffect(() => {
    if (!active) return
    ensureListening()

    const overlay: Overlay = { close: () => closeRef.current(), closedByBack: false }
    window.history.pushState({ overlay: true }, '')
    stack.push(overlay)

    return () => {
      const idx = stack.lastIndexOf(overlay)
      if (idx !== -1) stack.splice(idx, 1)
      // Closed from the UI (Back never popped our entry) → consume it now to keep
      // the stack balanced. The persistent listener swallows the resulting pop.
      if (!overlay.closedByBack) {
        expectedProgrammatic++
        window.history.back()
      }
    }
  }, [active])
}
