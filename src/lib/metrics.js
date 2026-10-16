/** Which daily figures make sense for an exercise, best first. */
export const metricsFor = (exercise, sets) => {
  if (exercise?.type === 'time') return ['seconds', 'sets']
  return sets.some(s => s.kg != null) ? ['volume', 'maxKg', 'reps', 'sets'] : ['reps', 'sets']
}

/** One point per day the exercise was done. */
export function daily(sets) {
  const days = new Map()
  for (const s of sets) {
    const d = days.get(s.date) ?? { date: s.date, sets: 0, reps: 0, seconds: 0, volume: 0, maxKg: null }
    d.sets++
    d.reps += s.reps ?? 0
    d.seconds += s.seconds ?? 0
    if (s.kg != null) {
      d.volume += s.kg * (s.reps ?? 0)
      d.maxKg = Math.max(d.maxKg ?? 0, s.kg)
    }
    days.set(s.date, d)
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}
