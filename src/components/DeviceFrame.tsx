import { useLocation } from 'react-router-dom'
import { useTheme } from '../theme/useTheme'
import { StarryNightSky } from './StarryNightSky'

/**
 * The screens that wear the full Starry Night treatment — a real sky behind the
 * content. Everything else (You, Settings, the sign-in landing, Search, Book…)
 * gets the palette only: the same violet night, without the scenery. Matched on
 * the path's first segment so `/read/:id` counts.
 */
const STARRY_SCREENS = new Set(['home', 'read', 'library', 'activity'])

function isStarryScreen(pathname: string): boolean {
  const seg = pathname.split('/').filter(Boolean)[0] ?? ''
  return STARRY_SCREENS.has(seg)
}

/**
 * The whole app lives inside one of two layouts: a phone (fluid, full width)
 * or an iPad (a width-capped, centred column). A laptop/desktop just renders
 * the iPad screen — there is no third layout. This frame enforces that:
 * the viewport is filled with the themed background, and the app itself is
 * capped at `max-w-app` (≈ iPad portrait) and centred. On anything wider than
 * an iPad, hairline side borders mark the screen edges so the cap reads as
 * intentional rather than stranded.
 *
 * Under the Starry palette, the main screens also get a painterly night sky
 * behind their content (StarryNightSky) — clipped to this column so it never
 * bleeds past the iPad frame, and behind a z-raised content wrapper so taps and
 * text stay crisp.
 */
export function DeviceFrame({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme()
  const { pathname } = useLocation()
  const starry = palette === 'starry' && isStarryScreen(pathname)

  // The tree shape stays fixed across every route — the sky slot and the content
  // wrapper are ALWAYS present; only their classes change. (Toggling the tree
  // shape when crossing the starry↔non-starry boundary remounted the whole route
  // subtree — which reset RequireAuth's splash timer and reloaded the providers.)
  // Non-starry, the wrapper is `display:contents`, so it adds no box at all and
  // the layout is byte-for-byte what it was.
  return (
    <div className="min-h-dvh w-full bg-bg">
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-app flex-col bg-bg ipad:border-x ipad:border-border ${
          starry ? 'relative isolate' : ''
        }`}
      >
        {starry ? <StarryNightSky /> : null}
        <div className={starry ? 'relative z-10 flex flex-1 flex-col' : 'contents'}>
          {children}
        </div>
      </div>
    </div>
  )
}
