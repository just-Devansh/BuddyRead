/** Format a 0–5 quarter-step rating as a plain decimal, e.g. "4", "4.25",
 *  "4.5", "4.75". Whole numbers stay whole (no trailing ".0"); the quarter
 *  steps read as decimals rather than tiny fraction glyphs. */
export function formatRating(v: number): string {
  return Number.isInteger(v) ? String(v) : Number(v.toFixed(2)).toString()
}
