/**
 * An exercise earns flames from its 12th training day on: before that, nearly every set is a best.
 * Per exercise, counted in days the exercise was done, ad-hoc days included. (user, 2026-10-16)
 */
export const BESTS_FROM_DAY = 12

/** The amount a set is measured in: reps, or seconds for timed exercises. */
const amount = s => s.reps ?? s.seconds ?? 0

/**
 * Sets of the most recent day before `today`, oldest first, or null.
 * `sets` are one exercise's sets in any order.
 */
export function lastDay(sets, today) {
  const date = sets.reduce((d, s) => (s.date < today && s.date > d ? s.date : d), '')
  return date ? { date, sets: sets.filter(s => s.date === date).sort((a, b) => a.ts - b.ts) } : null
}

/**
 * Ids of the sets that were a personal best when logged: no earlier set had
 * as much weight (or more) and as many reps or seconds (or more). Only sets logged on the
 * exercise's `fromDay`-th training day or later can count; earlier ones still set the bar.
 */
export function personalBests(sets, fromDay = BESTS_FROM_DAY) {
  const sorted = [...sets].sort((a, b) => a.ts - b.ts)
  const ids = new Set()
  const seen = []
  const days = new Set()
  for (const s of sorted) {
    days.add(s.date)
    const w = s.kg ?? 0, v = amount(s)
    if (days.size >= fromDay && seen.length && !seen.some(p => p.w >= w && p.v >= v)) ids.add(s.id)
    seen.push({ w, v })
  }
  return ids
}

/** Runs of equal values collapse: [10, 10, 9] → "2×10 · 9". */
const runs = values => {
  const out = []
  for (const v of values) {
    const last = out.at(-1)
    if (last?.v === v) last.n++
    else out.push({ v, n: 1 })
  }
  return out.map(({ v, n }) => (n > 1 ? `${n}×${v}` : v)).join(' · ')
}

/** "2×50 @16kg" when every set is the same, else "2×10 · 9 @16kg", per-set kg only when it varies. */
export function compact(sets) {
  if (!sets.length) return ''
  const unit = s => (s.seconds != null ? `${s.seconds}s` : `${s.reps}`)
  const kgs = new Set(sets.map(s => s.kg ?? null))
  const kg = kgs.size === 1 ? [...kgs][0] : undefined
  const tail = kg != null ? ` @${kg}kg` : ''
  if (kg !== undefined && new Set(sets.map(unit)).size === 1) return `${sets.length}×${unit(sets[0])}${tail}`
  if (kg !== undefined) return runs(sets.map(unit)) + tail
  return runs(sets.map(s => `${unit(s)}${s.kg != null ? `@${s.kg}` : ''}`))
}

/**
 * The workout in progress: with a timed session running, its rows; otherwise the loose rows
 * (logged outside any session, not completed yet). Counters only count these, so they go back
 * to zero whenever a session is stopped or an untimed one is completed.
 */
export const isOpen = (row, activeSessionId) => (activeSessionId ? row.sessionId === activeSessionId : !row.sessionId)

/**
 * The most recent finished batch of one exercise's sets: the last session it was done in
 * (timed or untimed), or the last day of loose sets. Oldest first; null when there is none.
 */
export function lastBatch(sets, activeSessionId) {
  const done = sets.filter(s => !isOpen(s, activeSessionId))
  if (!done.length) return null
  const latest = done.reduce((a, b) => (b.ts > a.ts || (b.ts === a.ts && b.id > a.id) ? b : a)) // ties: the later entry
  const same = latest.sessionId ? s => s.sessionId === latest.sessionId : s => !s.sessionId && s.date === latest.date
  return { date: latest.date, sets: done.filter(same).sort((a, b) => a.ts - b.ts) }
}
