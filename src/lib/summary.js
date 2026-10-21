import { duration, hhmm, dateKey } from './time.js'
import { activityLabel } from './activity.js'
import { nameById } from './names.js'

/**
 * A timed session's training time: its own duration plus the minutes of activities bundled into it,
 * i.e. its activities logged outside its start..end (a morning run joined to the evening gym).
 * Activities logged during the session are already inside its duration. Untimed: null.
 * Returns { ms, sessionMs, extra: [log, ...] }.
 */
export function trainingTime(session, activityLogs = []) {
  if (session.untimed || !session.end) return { ms: null, sessionMs: null, extra: [] }
  const sessionMs = session.end - session.start
  const extra = activityLogs.filter(l => l.sessionId === session.id && (l.ts < session.start || l.ts > session.end) && l.minutes)
  return { ms: sessionMs + extra.reduce((a, l) => a + l.minutes * 60000, 0), sessionMs, extra }
}

/** What one logged set amounts to, in the exercise's own unit. */
export const setLabel = s =>
  `${s.seconds != null ? `${s.seconds}s` : s.reps}${s.kg != null ? ` @${s.kg}kg` : ''}`

export const volume = sets => sets.reduce((a, s) => a + (s.kg != null && s.reps != null ? s.kg * s.reps : 0), 0)

/**
 * The small text kept with each session once it is stopped.
 * `L` holds the localized words so the summary is written in the UI language of the moment.
 */
const totalPart = (session, logs, L) => {
  const t = trainingTime({ ...session, end: session.end ?? Date.now() }, logs)
  return t.extra.length ? ` · ${L.totalTime ?? 'total'} ${duration(t.ms)}` : ''
}

export function buildSummary({ session, sets, rests, exercisesById, L, activityLogs = [], activitiesById = {} }) {
  const end = session.end ?? Date.now()
  const order = []
  const byEx = new Map()
  for (const s of [...sets].sort((a, b) => a.ts - b.ts)) {
    if (!byEx.has(s.exerciseId)) { byEx.set(s.exerciseId, []); order.push(s.exerciseId) }
    byEx.get(s.exerciseId).push(s)
  }
  const done = rests.filter(r => r.end)
  const restMs = done.map(r => r.end - r.start)
  const total = restMs.reduce((a, b) => a + b, 0)
  const vol = volume(sets)

  const lines = [
    session.untimed
      ? `${dateKey(session.start)} · ${L.untimed}`
      : `${dateKey(session.start)} ${hhmm(session.start)} → ${hhmm(end)} · ${duration(end - session.start)}${session.auto ? ` (${L.autoClosed})` : ''}${totalPart(session, activityLogs, L)}`,
    [`${sets.length} ${L.sets}`, `${order.length} ${L.exercises}`, activityLogs.length ? `${activityLogs.length} ${L.activities}` : null, vol ? `${Math.round(vol)} kg ${L.volume}` : null].filter(Boolean).join(' · '),
  ]
  if (done.length)
    lines.push(`${L.rest}: ${done.length}× · ${duration(total)} ${L.total} · ${L.avg} ${duration(total / done.length)} · ${L.longest} ${duration(Math.max(...restMs))}`)
  else if (session.stats?.rests) { // rebuilt later (e.g. bundling): the rest rows are gone, their stats are not
    const { rests: n, restMs: ms, restLongest } = session.stats
    lines.push(`${L.rest}: ${n}× · ${duration(ms)} ${L.total} · ${L.avg} ${duration(ms / n)}${restLongest ? ` · ${L.longest} ${duration(restLongest)}` : ''}`)
  }
  for (const id of order) {
    const list = byEx.get(id)
    lines.push(`${nameById(exercisesById, id, L.lang)}: ${list.map(setLabel).join(', ')}`)
  }
  for (const a of [...activityLogs].sort((x, y) => x.ts - y.ts))
    lines.push(`${nameById(activitiesById, a.activityId, L.lang)}: ${activityLabel(a)}${a.notes ? ` (${a.notes})` : ''}`)
  return lines.join('\n')
}
