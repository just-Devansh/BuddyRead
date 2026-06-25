/**
 * Named spine gradients — bound covers, never flat boxes. Shared by the cover
 * placeholder (`BookCover`) and the library bookshelf, so a missing cover and a
 * shelved spine draw from the same warm, muted palette.
 */
export const SPINES = {
  olive: { from: '#46503a', to: '#353d2c', ink: '#d8c79a' },
  wine: { from: '#6b4a55', to: '#4a3039', ink: '#e6cdd2' },
  sand: { from: '#4a4636', to: '#34311f', ink: '#d8d0a8' },
  blue: { from: '#3a4a55', to: '#243038', ink: '#bcd0da' },
  brown: { from: '#5a4636', to: '#3a2a1f', ink: '#e0c9a8' },
  plum: { from: '#4a3a52', to: '#2e2336', ink: '#ddc9e6' },
} as const

export type SpineTone = keyof typeof SPINES
