import { writable } from 'svelte/store'

/**
 * Keeps the screen on while `want(true)` is in force. iOS (home-screen apps from 18.4) and other
 * browsers drop a wake lock whenever the page is hidden, so it is re-taken when the app comes back.
 * `held` says whether a lock is in place right now, for Settings to show.
 */
export const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
export const held = writable(false)

let wanted = false
let sentinel = null

async function acquire() {
  if (!supported || !wanted || sentinel || document.visibilityState !== 'visible') return
  try {
    sentinel = await navigator.wakeLock.request('screen')
    held.set(true)
    sentinel.addEventListener?.('release', () => { sentinel = null; held.set(false) })
  } catch {
    sentinel = null
    held.set(false)
  }
}

async function release() {
  const s = sentinel
  sentinel = null
  held.set(false)
  await s?.release?.().catch(() => {})
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'visible' ? acquire() : null))
}

export function want(on) {
  wanted = !!on
  return wanted ? acquire() : release()
}
