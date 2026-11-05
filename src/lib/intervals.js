import { writable } from 'svelte/store'

/**
 * Interval routines (Tabata, HIIT): a list of timed steps run in rounds. Written the way people
 * write them, "30 seconds climbers - 30 seconds cross climbers - 30 burpees, 30 s elbow plank",
 * and run by a full-screen timer that shows the current step big and the next one below.
 * Timing is from timestamps (start, pauses), so a throttled or backgrounded page never drifts.
 */

const lev = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}
/** "s", "sec", "seconds", "segundos" and their typos ("sceonds") → 1; "min", "minutes", "minutos" → 60; else null. */
export function unitOf(word) {
  const w = String(word ?? '').toLowerCase().replace(/[.,]$/, '')
  if (['s', '"', "''", 'sec', 'secs', 'seg', 'segs', 'seconds', 'second', 'segundos', 'segundo'].includes(w)) return 1
  if (['m', "'", 'min', 'mins', 'minute', 'minutes', 'minuto', 'minutos'].includes(w)) return 60
  if (w.length >= 5 && w[0] === 's' && Math.min(lev(w, 'seconds'), lev(w, 'segundos'), lev(w, 'second')) <= 2) return 1
  if (w.length >= 5 && w[0] === 'm' && Math.min(lev(w, 'minutes'), lev(w, 'minutos')) <= 2) return 60
  return null
}

const REST = /^(rest|descanso|pausa|break|recover(y)?|recuperaci[oó]n)$/i
const tidy = s => s.replace(/\b(and so on|etc\.?|y as[ií] sucesivamente)\b/gi, '').replace(/^[\s,;:\-–—|.·]+|[\s,;:\-–—|.·]+$/g, '').replace(/\s+/g, ' ').trim()

/**
 * Steps from free text: each number is a duration (seconds unless a unit says minutes), and the
 * words next to it are the exercise. Names may come after the duration ("30 s climbers") or
 * before it ("climbers 30"), whichever the text uses. "rest"/"descanso" steps are rests.
 * "3 rounds" / "x3" / "3 vueltas" anywhere sets the rounds.
 */
export function parseSteps(text) {
  let src = String(text ?? '')
  let rounds = null
  src = src.replace(/(?:\b(\d+)\s*(?:rounds?|rondas?|vueltas?|veces)\b|\bx\s*(\d+)\b|\b(\d+)\s*x\b(?!\s*\d))/gi, (_, a, b, c) => { rounds = +(a ?? b ?? c); return ' ' })
  const tokens = [...src.matchAll(/(\d+(?:[.,]\d+)?)(?:\s*(["']{1,2}|[a-záéíóúñ]+\.?))?/gi)]
  const nums = tokens.map(m => {
    const unit = unitOf(m[2])
    return { start: m.index, end: m.index + (unit ? m[0].length : m[1].length), seconds: Math.round(+m[1].replace(',', '.') * (unit ?? 1)) }
  })
  if (!nums.length) return { steps: [], rounds }
  const gaps = nums.map((n, i) => tidy(src.slice(n.end, nums[i + 1]?.start ?? src.length)))
  const before = [tidy(src.slice(0, nums[0].start)), ...nums.slice(1).map((n, i) => tidy(src.slice(nums[i].end, n.start)))]
  // names after the durations unless the text starts with a name and ends on a number
  const after = !(before[0] && !gaps.at(-1))
  const steps = nums.map((n, i) => {
    const name = after ? gaps[i] : before[i]
    return { name: name || '', seconds: n.seconds, ...(REST.test(name) ? { rest: true } : {}) }
  }).filter(s => s.seconds > 0)
  return { steps, rounds }
}

export const stepsText = steps => steps.map(s => `${s.seconds} s ${s.name}`).join('\n')

/** Every step in run order: an optional get-ready, the steps × rounds, a rest between rounds. */
export function schedule({ steps, rounds = 1, restBetween = 0, prep = 5 }) {
  const out = []
  if (prep > 0) out.push({ name: '', seconds: prep, prep: true, round: 1 })
  for (let r = 1; r <= Math.max(1, rounds); r++) {
    steps.forEach(s => out.push({ ...s, round: r }))
    if (restBetween > 0 && r < rounds) out.push({ name: '', seconds: restBetween, rest: true, between: true, round: r })
  }
  return out
}

export const totalSeconds = plan => plan.reduce((a, s) => a + s.seconds, 0)

/** Where a run is after `ms` of running time: the step index, ms left in it, and done at the end. */
export function at(plan, ms) {
  let t = 0
  for (let i = 0; i < plan.length; i++) {
    const len = plan[i].seconds * 1000
    if (ms < t + len) return { index: i, left: t + len - ms, done: false }
    t += len
  }
  return { index: plan.length - 1, left: 0, done: true }
}

/** Running time of a run { start, pausedAt, pausedMs } at `now`. */
export const runMs = (run, now = Date.now()) => (run ? (run.pausedAt ?? now) - run.start - (run.pausedMs ?? 0) : 0)
export const pause = (run, now = Date.now()) => (run.pausedAt ? run : { ...run, pausedAt: now })
export const resume = (run, now = Date.now()) => (run.pausedAt ? { ...run, pausedAt: null, pausedMs: (run.pausedMs ?? 0) + now - run.pausedAt } : run)
/** Jump to the start of step `index` (skip / back). */
export const seek = (run, plan, index, now = Date.now()) => {
  const target = plan.slice(0, Math.max(0, index)).reduce((a, s) => a + s.seconds * 1000, 0)
  return { ...run, start: (run.pausedAt ?? now) - (run.pausedMs ?? 0) - target }
}

/** True while an interval run is on screen and not finished: App keeps the screen on for it. */
export const intervalRunning = writable(false)

/** Short beeps through Web Audio; created on the Start tap, as iOS only allows sound after a gesture. */
export function beeper() {
  let ctx = null
  try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch {}
  return (freq = 880, ms = 120) => {
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + ms / 1000 + 0.02)
  }
}
