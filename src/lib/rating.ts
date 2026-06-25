/** Format a 0–5 quarter-step rating with a fraction glyph, e.g. "4¼", "½". */
export function formatRating(v: number): string {
  const whole = Math.floor(v)
  const frac = v - whole
  const glyph = frac >= 0.75 ? '¾' : frac >= 0.5 ? '½' : frac >= 0.25 ? '¼' : ''
  if (whole === 0 && glyph) return glyph
  return `${whole}${glyph}`
}
