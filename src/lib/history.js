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
 * as much weight (or more) and as many reps or seconds (or more).
 * Nothing flames on the exercise's first day, when there is nothing to beat yet.
 */
export function personalBests(sets) {
  const sorted = [...sets].sort((a, b) => a.ts - b.ts)
  const firstDay = sorted[0]?.date
  const ids = new Set()
  const seen = []
  for (const s of sorted) {
    const w = s.kg ?? 0, v = amount(s)
    if (s.date !== firstDay && !seen.some(p => p.w >= w && p.v >= v)) ids.add(s.id)
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
