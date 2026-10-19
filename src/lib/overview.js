import { MUSCLES } from './seed.js'
import { dateKey } from './time.js'

/** Amber after a week without training it, stale after two. (user, 2026-10-16) */
export const DUE_DAYS = 7
export const STALE_DAYS = 14

const DAY = 864e5
const midnight = key => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).getTime() }
/** Whole calendar days between two YYYY-MM-DD keys (DST-safe: rounds). */
export const daysBetween = (from, to) => Math.round((midnight(to) - midnight(from)) / DAY)

export const status = days => (days == null ? 'never' : days >= STALE_DAYS ? 'stale' : days >= DUE_DAYS ? 'due' : 'ok')

/**
 * The last day each muscle was trained and how long ago, most stale first.
 * Keys: `mu:<muscle>` for tagged exercises (every muscle they are tagged with), `group:<id>` for
 * exercises without muscles (kettlebells stay kettlebells: they count under the group they were
 * logged from), `cardio` for activities. Muscles never trained come last, with days null.
 */
export function recency({ sets, exercisesById, activityLogs = [], today = dateKey() }) {
  const last = new Map()
  const seen = (k, date) => { if (!last.has(k) || last.get(k) < date) last.set(k, date) }
  for (const s of sets) {
    const ms = exercisesById[s.exerciseId]?.muscles
    if (ms?.length) ms.forEach(m => seen(`mu:${m}`, s.date))
    else if (s.groupId) seen(`group:${s.groupId}`, s.date)
  }
  for (const l of activityLogs) seen('cardio', l.date)
  const keys = [...new Set([...MUSCLES.map(m => `mu:${m}`), ...last.keys()])]
  return keys
    .map(key => {
      const date = last.get(key) ?? null
      const days = date ? daysBetween(date, today) : null
      return { key, date, days, status: status(days) }
    })
    .sort((a, b) => (a.days == null) - (b.days == null) || (b.days ?? 0) - (a.days ?? 0))
}

/** Monday 00:00 of the week containing `ms`, local time. */
export const weekStart = ms => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

/**
 * The last `weeks` weeks, oldest first, Monday to Sunday:
 * completed sessions, training days (any set or activity, sessions or not) and minutes in sessions.
 */
export function weekly({ sessions, sets = [], activityLogs = [], weeks = 12, now = Date.now() }) {
  // calendar arithmetic, not 7 × 24 h: a window spanning a clock change must still land on Mondays 00:00
  const rows = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(weekStart(now))
    d.setDate(d.getDate() - (weeks - 1 - i) * 7)
    return { start: d.getTime(), sessions: 0, minutes: 0, days: new Set() }
  })
  const at = ms => {
    const ws = weekStart(ms)
    return rows.find(r => r.start === ws)
  }
  for (const s of sessions) {
    if (!s.end) continue
    const r = at(s.start)
    if (!r) continue
    r.sessions++
    if (!s.untimed) r.minutes += (s.end - s.start) / 60000
  }
  for (const x of [...sets, ...activityLogs]) at(midnight(x.date))?.days.add(x.date)
  return rows.map(r => ({ start: r.start, sessions: r.sessions, minutes: Math.round(r.minutes), days: r.days.size }))
}

/** Completed sessions oldest first, with their length in minutes. */
export const durations = sessions =>
  sessions.filter(s => s.end && !s.untimed).sort((a, b) => a.start - b.start).map(s => ({ x: s.start, y: Math.round((s.end - s.start) / 60000) }))

/** Mean of the last `n` weeks that are complete (the current week is still running). */
export const average = (rows, key, n = 4) => {
  const done = rows.slice(0, -1).slice(-n)
  return done.length ? done.reduce((a, r) => a + r[key], 0) / done.length : 0
}
