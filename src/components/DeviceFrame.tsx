/**
 * The whole app lives inside one of two layouts: a phone (fluid, full width)
 * or an iPad (a width-capped, centred column). A laptop/desktop just renders
 * the iPad screen — there is no third layout. This frame enforces that:
 * the viewport is filled with the themed background, and the app itself is
 * capped at `max-w-app` (≈ iPad portrait) and centred. On anything wider than
 * an iPad, hairline side borders mark the screen edges so the cap reads as
 * intentional rather than stranded.
 */
export function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-bg">
      <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-bg ipad:border-x ipad:border-border">
        {children}
      </div>
    </div>
  )
}
