import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Eyebrow } from '../components/Eyebrow'
import { useConfirm } from '../components/useConfirm'
import { useAuth } from '../auth/useAuth'
import { useTheme } from '../theme/useTheme'
import type { Palette } from '../theme/theme-context'
import { tapHaptic } from '../lib/haptics'

/** A representative trio of swatches for each palette, so the choice is visible
 *  before it's made. Fixed colours (the light-mode accent/gold/lamp of each
 *  palette) — a preview, independent of what's currently painted. */
const PALETTES: {
  value: Palette
  name: string
  blurb: string
  swatches: [string, string, string]
}[] = [
  {
    value: 'warm',
    name: 'Warm',
    blurb: 'Terracotta & gold, candlelit. The original.',
    swatches: ['#8a4536', '#a8822f', '#f0a25c'],
  },
  {
    value: 'lavender',
    name: 'Lavender',
    blurb: 'Plum & gold, with a soft lilac lamplight.',
    swatches: ['#7c4f86', '#a8822f', '#b58fe0'],
  },
]

function Swatches({ colors }: { colors: [string, string, string] }) {
  return (
    <span className="flex -space-x-1.5" aria-hidden="true">
      {colors.map((c, i) => (
        <span
          key={i}
          className="h-6 w-6 rounded-full border border-black/10 shadow-sm ring-1 ring-surface"
          style={{ backgroundColor: c }}
        />
      ))}
    </span>
  )
}

/**
 * The reader's settings — reached from the gear on the You tab. For now it holds
 * the colour palette (warm | lavender) and sign-out; the theme light/dark toggle
 * stays on the profile for the moment. Built to grow into the app's catch-all
 * for preferences.
 */
export function Settings() {
  const { signOut } = useAuth()
  const { palette, setPalette } = useTheme()
  const { confirm, dialog } = useConfirm()

  const choose = (p: Palette) => {
    if (p === palette) return
    tapHaptic()
    setPalette(p)
  }

  const signOutConfirmed = async () => {
    if (
      await confirm({
        title: 'Sign out?',
        message: "You'll need to sign in with Google again to get back to your reads.",
        confirmLabel: 'Sign out',
        cancelLabel: 'Stay',
        destructive: false,
      })
    )
      void signOut()
  }

  return (
    <AppShell>
      <Link
        to="/profile"
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text"
      >
        ‹ You
      </Link>
      <Eyebrow className="mt-4 block">Preferences</Eyebrow>
      <h1 className="mt-1 font-display text-4xl text-text">Settings</h1>

      {/* Palette */}
      <section className="mt-8">
        <Eyebrow className="block">Palette</Eyebrow>
        <p className="mt-1 text-sm text-text-muted">
          The app's accent and the nook's lamplight. Light and dark stay as you set them.
        </p>
        <div
          role="radiogroup"
          aria-label="Palette"
          className="mt-4 space-y-2.5"
        >
          {PALETTES.map((p) => {
            const active = palette === p.value
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(p.value)}
                className={[
                  'flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors',
                  active
                    ? 'border-accent/50 bg-accent/8 ring-1 ring-inset ring-accent/20'
                    : 'border-border bg-surface hover:border-accent/30',
                ].join(' ')}
              >
                <Swatches colors={p.swatches} />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl leading-tight text-text">
                    {p.name}
                  </span>
                  <span className="block text-pretty text-sm leading-snug text-text-muted">
                    {p.blurb}
                  </span>
                </span>
                <span
                  className={[
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                    active ? 'border-accent bg-accent text-accent-contrast' : 'border-border',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {active && (
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 6" />
                    </svg>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Account */}
      <section className="mt-10 border-t border-border-soft pt-6">
        <Eyebrow className="block">Account</Eyebrow>
        <button
          type="button"
          onClick={() => void signOutConfirmed()}
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5 text-left transition-colors hover:border-accent/40"
        >
          <span className="font-display text-lg text-text">Sign out</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-text-faint">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
          </svg>
        </button>
      </section>

      {dialog}
    </AppShell>
  )
}
