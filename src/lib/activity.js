/** Ad-hoc activities (running, rowing, bike...): measured in minutes and, optionally, km. */

export const DEFAULT_ACTIVITIES = [
  { id: 'running', name: 'Running', archived: false },
  { id: 'rowing', name: 'Rowing', archived: false },
  { id: 'gym-bike', name: 'Gym Bike', archived: false },
]

const num = v => (v === '' || v == null || !Number.isFinite(+v) || +v <= 0 ? null : +v)

/** "6", "6:00", "6'", "6'30\"", "6.5" → minutes per km; null when it does not read as a pace. */
export function parsePace(text) {
  const s = String(text ?? '').trim().replace(',', '.')
  if (!s) return null
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(?:[:'’´]\s*(\d{1,2})?\s*(?:["”]|'')?)?\s*(?:\/?\s*km)?$/i)
  if (!m) return null
  const minutes = +m[1] + (m[2] ? +m[2] / 60 : 0)
  return minutes > 0 ? minutes : null
}

/** 6.5 → "6:30" */
export const formatPace = minPerKm => {
  const total = Math.round(minPerKm * 60)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d

/**
 * From any two of duration, distance and pace, the stored pair { minutes, km }.
 * Pace is never stored: it is always minutes / km when both exist.
 */
export function resolve({ minutes, km, pace }) {
  let m = num(minutes), k = num(km)
  const p = typeof pace === 'number' ? num(pace) : parsePace(pace)
  if (m != null && k == null && p != null) k = round(m / p, 2)
  if (m == null && k != null && p != null) m = round(k * p, 1)
  return { minutes: m, km: k }
}

export const paceOf = log => (log.minutes && log.km ? log.minutes / log.km : null)

/** "30 min · 5 km · 6:00/km", parts left out when unknown. */
export function activityLabel(log) {
  const pace = paceOf(log)
  if (log.short) // sprints: seconds and metres read better than 0.5 min and 0.4 km
    return [
      log.minutes != null ? `${Math.round(log.minutes * 60)} s` : null,
      log.km != null ? `${Math.round(log.km * 1000)} m` : null,
      pace ? `${formatPace(pace)}/km` : null,
    ].filter(Boolean).join(' · ')
  return [
    log.minutes != null ? `${round(log.minutes, 1)} min` : null,
    log.km != null ? `${round(log.km, 2)} km` : null,
    pace ? `${formatPace(pace)}/km` : null,
  ].filter(Boolean).join(' · ')
}

/** One point per day: total minutes and km, and the pace over the day's totals. */
export function dailyActivity(logs) {
  const days = new Map()
  for (const l of logs) {
    const d = days.get(l.date) ?? { date: l.date, entries: 0, minutes: 0, km: 0, paced: { minutes: 0, km: 0 } }
    d.entries++
    d.minutes += l.minutes ?? 0
    d.km += l.km ?? 0
    if (l.minutes && l.km) { d.paced.minutes += l.minutes; d.paced.km += l.km }
    days.set(l.date, d)
  }
  return [...days.values()]
    .map(({ paced, ...d }) => ({ ...d, pace: paced.km ? paced.minutes / paced.km : null }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
