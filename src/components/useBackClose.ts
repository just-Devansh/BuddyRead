import { useEffect, useRef } from 'react'

/**
 * Make the device/browser **Back** button (and Android's back gesture) dismiss
 * an open overlay instead of navigating away from the page underneath it.
 *
 * While `active`, a throwaway history entry is pushed; pressing Back pops it and
 * runs `close()`, so an open sheet/modal *eats* the Back press. Closing from the
 * UI instead (backdrop, drag-to-dismiss, save) consumes that entry on cleanup,
 * so Back never has to be pressed twice and no stray entry is left in the stack.
 *
 * Robust under React StrictMode's mount→unmount→remount double-invoke: the
 * `ignoreNextPop` ref swallows the single popstate that the dev-only remount's
 * cleanup `history.back()` produces, so the overlay isn't closed the instant it
 * opens.
 */
export function useBackClose(active: boolean, close: () => void) {
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })
  // Survives the StrictMode cleanup→effect boundary (same component instance).
  const ignoreNextPop = useRef(false)

  useEffect(() => {
    if (!active) return

    window.history.pushState({ overlay: true }, '')
    let poppedByBack = false

    const onPop = () => {
      // The pop our own cleanup-time back() produced (StrictMode) — ignore once.
      if (ignoreNextPop.current) {
        ignoreNextPop.current = false
        return
      }
      poppedByBack = true
      closeRef.current()
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      // Closed from the UI (not by Back) → Back never popped our entry, so remove
      // it now to keep the stack balanced. Flag the resulting popstate as ours so
      // a still-mounted listener (StrictMode's second effect) doesn't act on it.
      if (!poppedByBack) {
        ignoreNextPop.current = true
        window.history.back()
      }
    }
  }, [active])
}
