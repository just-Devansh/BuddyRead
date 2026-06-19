import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'

export function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center py-16 text-center">
        <p className="font-display text-5xl text-accent">404</p>
        <h1 className="mt-4 font-display text-2xl text-text">
          This page is uncut
        </h1>
        <p className="mt-2 max-w-sm text-pretty text-sm leading-relaxed text-text-muted">
          There's nothing printed here. Let's get you back to the shelf.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          Back to the shelf
        </Link>
      </div>
    </AppShell>
  )
}
