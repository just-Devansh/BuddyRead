/**
 * Make the installed PWA feel like an app, not a web page.
 *
 * When BuddyRead runs **standalone** (installed to the home screen / launched
 * from the dock) we suppress the browser's native long-press callout — the
 * "Copy link · Download image · Share image · Open in Chrome" sheet that pops
 * up when you press-and-hold a cover. It's pure web-page chrome and only gets in
 * the way of our own long-press effects. In a normal browser tab we leave it
 * alone, so the website still behaves like a website.
 *
 * Detection is done once at boot and recorded as `.standalone` on <html>, which
 * also scopes the matching CSS in index.css (callout/drag/tap-highlight off).
 */
export function initStandalone(): void {
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's non-standard flag for home-screen apps.
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  if (!isStandalone) return

  document.documentElement.classList.add('standalone')

  // Android fires `contextmenu` on long-press; preventing it kills the sheet.
  // Leave real text fields alone so paste/selection still works there.
  document.addEventListener(
    'contextmenu',
    (e) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, [contenteditable=""], [contenteditable="true"]'))
        return
      e.preventDefault()
    },
    { capture: true },
  )
}
