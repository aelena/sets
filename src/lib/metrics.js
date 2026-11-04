import { loadOf } from './summary.js'

/** Which daily figures make sense for an exercise, best first. */
export const metricsFor = (exercise, sets) => {
  if (exercise?.type === 'time') return ['seconds', 'sets']
  if (sets.some(s => s.kg != null)) return ['volume', 'maxKg', 'reps', 'sets']
  return sets.some(s => s.bw != null) ? ['volume', 'reps', 'sets'] : ['reps', 'sets']
}

/** One point per day the exercise was done. Volume counts body weight on bodyweight sets; max kg is weight added only. */
export function daily(sets) {
  const days = new Map()
  for (const s of sets) {
    const d = days.get(s.date) ?? { date: s.date, sets: 0, reps: 0, seconds: 0, volume: 0, maxKg: null }
    d.sets++
    d.reps += s.reps ?? 0
    d.seconds += s.seconds ?? 0
    if (loadOf(s) != null) d.volume += loadOf(s) * (s.reps ?? 0)
    if (s.kg != null) d.maxKg = Math.max(d.maxKg ?? 0, s.kg)
    days.set(s.date, d)
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}
