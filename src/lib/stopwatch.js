import { writable } from 'svelte/store'

/**
 * A plain stopwatch like the phone's: start, stop, lap, reset. Nothing is recorded; the state is
 * kept in localStorage so it survives the app being closed or reloaded while it runs.
 * { startedAt: ms | null (running when set), before: ms accumulated while stopped, laps: [ms total at lap] }
 */
const KEY = 'sets:stopwatch'
const empty = { startedAt: null, before: 0, laps: [] }

export const elapsed = (s, now = Date.now()) => s.before + (s.startedAt != null ? now - s.startedAt : 0)
export const running = s => s.startedAt != null

export const start = (s, now = Date.now()) => (running(s) ? s : { ...s, startedAt: now })
export const stop = (s, now = Date.now()) => (running(s) ? { ...s, before: elapsed(s, now), startedAt: null } : s)
export const lap = (s, now = Date.now()) => (running(s) ? { ...s, laps: [...s.laps, elapsed(s, now)] } : s)
export const reset = () => ({ ...empty })

/** Laps as [{ n, split: ms of that lap, total: ms }], newest first. */
export const lapRows = s => s.laps.map((total, i) => ({ n: i + 1, total, split: total - (s.laps[i - 1] ?? 0) })).reverse()

/** 1:02.34 or 1:01:02.34 (minutes:seconds.hundredths) */
export const fmt = ms => {
  const cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60, h = Math.floor(ms / 3600000)
  const two = n => String(n).padStart(2, '0')
  return `${h ? `${h}:${two(m)}` : two(m)}:${two(s)}.${two(cs)}`
}

const read = () => { try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { ...empty } } }
export const watch = writable(typeof localStorage === 'undefined' ? { ...empty } : read())
if (typeof localStorage !== 'undefined') watch.subscribe(s => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {} })
