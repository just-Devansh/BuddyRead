/**
 * The faintest physical acknowledgement — a single short buzz on a tap, where
 * the hardware allows it. Used on the bottom-nav tabs so switching screens has a
 * little tactile confirmation to go with the new view sliding in.
 *
 * `navigator.vibrate` is only present on (mostly Android) touch devices and is a
 * no-op everywhere else — iOS Safari and desktop simply ignore it — so this is
 * best-effort and silent when unsupported. Kept deliberately brief (a few ms):
 * the goal is a whisper of feedback, never a rumble.
 */
export function tapHaptic(): void {
  try {
    navigator.vibrate?.(8)
  } catch {
    // Some browsers throw if called outside a user gesture — ignore; it's cosmetic.
  }
}
