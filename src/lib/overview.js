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
  for (const l of activityLogs) if (!l.short) seen('cardio', l.date) // sprints: no staleness rules
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
    return { start: d.getTime(), sessions: 0, minutes: 0, days: new Set(), volume: 0, cardioMin: 0, cardioKm: 0 }
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
  for (const s of sets) {
    const r = at(midnight(s.date))
    if (r && s.kg != null && s.reps != null) r.volume += s.kg * s.reps
  }
  for (const l of activityLogs) {
    const r = at(midnight(l.date))
    if (r) { r.cardioMin += l.minutes ?? 0; r.cardioKm += l.km ?? 0 }
  }
  return rows.map(r => ({
    start: r.start, sessions: r.sessions, minutes: Math.round(r.minutes), days: r.days.size,
    volume: Math.round(r.volume), cardioMin: Math.round(r.cardioMin), cardioKm: Math.round(r.cardioKm * 10) / 10,
  }))
}

/** Completed sessions oldest first, with their length in minutes. */
export const durations = sessions =>
  sessions.filter(s => s.end && !s.untimed).sort((a, b) => a.start - b.start).map(s => ({ x: s.start, y: Math.round((s.end - s.start) / 60000) }))

/** Mean of the last `n` weeks that are complete (the current week is still running). */
export const average = (rows, key, n = 4) => {
  const done = rows.slice(0, -1).slice(-n)
  return done.length ? done.reduce((a, r) => a + r[key], 0) / done.length : 0
}

/**
 * Sets per muscle per week, last `weeks` weeks, oldest first. A set counts 1 for the exercise's
 * first muscle and ½ for each other one; exercises without muscles count under their group.
 * Only keys trained at least once in the window are returned, busiest first.
 */
export function setsPerMuscle({ sets, exercisesById, weeks = 8, now = Date.now() }) {
  const starts = weekly({ sessions: [], weeks, now }).map(w => w.start)
  const index = new Map(starts.map((t, i) => [t, i]))
  const tally = new Map()
  const add = (key, i, v) => {
    if (!tally.has(key)) tally.set(key, Array(weeks).fill(0))
    tally.get(key)[i] += v
  }
  for (const s of sets) {
    const i = index.get(weekStart(midnight(s.date)))
    if (i == null) continue
    const ms = exercisesById[s.exerciseId]?.muscles
    if (ms?.length) ms.forEach((m, k) => add(`mu:${m}`, i, k === 0 ? 1 : 0.5))
    else if (s.groupId) add(`group:${s.groupId}`, i, 1)
  }
  return [...tally].map(([key, counts]) => ({ key, counts, total: counts.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total)
}

/** Total rest per timed session, in minutes, oldest first (sessions from before rests were kept have none). */
export const restPerSession = sessions =>
  sessions.filter(s => s.end && !s.untimed && s.stats).sort((a, b) => a.start - b.start)
    .map(s => ({ x: s.start, y: Math.round((s.stats.restMs ?? 0) / 6000) / 10, rests: s.stats.rests ?? 0 }))

/** Weeks in a row with at least `minDays` training days. The running week only extends a streak, never breaks it. */
export const STREAK_DAYS = 2
export function streaks(rows, minDays = STREAK_DAYS) {
  const ok = rows.map(r => r.days >= minDays)
  let best = 0, run = 0
  for (const x of ok) { run = x ? run + 1 : 0; best = Math.max(best, run) }
  let current = 0
  for (let i = ok.length - 1; i >= 0; i--) {
    if (ok[i]) current++
    else if (i === ok.length - 1) continue // this week is not over yet
    else break
  }
  return { current, best }
}

/** Every week from the first one with anything logged until now: the window for streaks. */
export const weeksSinceFirst = (rows, now = Date.now()) => {
  const first = rows.reduce((m, r) => (r.date && r.date < m ? r.date : m), dateKey(now))
  return Math.max(1, Math.round((weekStart(now) - weekStart(midnight(first))) / (7 * DAY)) + 1)
}

export const DAYPARTS = [['morning', 5, 12], ['afternoon', 12, 17], ['evening', 17, 22], ['night', 22, 29]]

/** Sets and activities by part of the day they were logged in. */
export function timeOfDay(rows) {
  const counts = Object.fromEntries(DAYPARTS.map(([k]) => [k, 0]))
  for (const r of rows) {
    const h = new Date(r.ts).getHours()
    const hh = h < 5 ? h + 24 : h
    const part = DAYPARTS.find(([, from, to]) => hh >= from && hh < to)
    if (part) counts[part[0]]++
  }
  return DAYPARTS.map(([key]) => ({ key, n: counts[key] }))
}
