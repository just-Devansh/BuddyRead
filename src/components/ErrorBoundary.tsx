import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Catches render-time crashes so a single bad record or component can't blank
 * the whole app — critical for the installed PWA, where there's no browser
 * chrome to navigate away from a white screen. Shows a calm, recoverable
 * fallback with a way back and a reload.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('BuddyRead crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-3xl text-text">Something came loose</p>
        <p className="mt-2 text-pretty leading-relaxed text-text-muted">
          A page hit a snag — that's on us, not you. Head back to the shelf and
          carry on.
        </p>
        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={() => window.location.assign('/home')}
            className="rounded-xl bg-accent px-5 py-2.5 font-medium text-accent-contrast transition-opacity hover:opacity-90"
          >
            Back to the shelf
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-border bg-surface-alt px-5 py-2.5 text-text transition-colors hover:border-accent/40"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
