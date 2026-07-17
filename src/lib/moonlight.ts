import { useSyncExternalStore } from 'react'

/**
 * The moon's lit state, shared. The moon lives in the Home nook but the starry
 * sky (which thins its stars when the moon is lit, just as real moonlight washes
 * them out) lives up in DeviceFrame — a different part of the tree. Rather than
 * thread a prop through everything, both read this one tiny external store, which
 * also persists to the same `buddyread:lamp` key the lamp always used.
 */
const KEY = 'buddyread:lamp'

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

let current = read()
const listeners = new Set<() => void>()

export function getMoonlight(): boolean {
  return current
}

export function setMoonlight(on: boolean): void {
  if (on === current) return
  current = on
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // Storage blocked (private mode) — the choice just won't be remembered.
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Reactively read whether the moon is lit. */
export function useMoonlight(): boolean {
  return useSyncExternalStore(subscribe, getMoonlight, () => false)
}
