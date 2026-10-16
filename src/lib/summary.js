import { duration, hhmm, dateKey } from './time.js'
import { activityLabel } from './activity.js'
import { nameById } from './names.js'

/** What one logged set amounts to, in the exercise's own unit. */
export const setLabel = s =>
  `${s.seconds != null ? `${s.seconds}s` : s.reps}${s.kg != null ? ` @${s.kg}kg` : ''}`

export const volume = sets => sets.reduce((a, s) => a + (s.kg != null && s.reps != null ? s.kg * s.reps : 0), 0)

/**
 * The small text kept with each session once it is stopped.
 * `L` holds the localized words so the summary is written in the UI language of the moment.
 */
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
    `${dateKey(session.start)} ${hhmm(session.start)} → ${hhmm(end)} · ${duration(end - session.start)}${session.auto ? ` (${L.autoClosed})` : ''}`,
    [`${sets.length} ${L.sets}`, `${order.length} ${L.exercises}`, activityLogs.length ? `${activityLogs.length} ${L.activities}` : null, vol ? `${Math.round(vol)} kg ${L.volume}` : null].filter(Boolean).join(' · '),
  ]
  if (done.length)
    lines.push(`${L.rest}: ${done.length}× · ${duration(total)} ${L.total} · ${L.avg} ${duration(total / done.length)} · ${L.longest} ${duration(Math.max(...restMs))}`)
  for (const id of order) {
    const list = byEx.get(id)
    lines.push(`${nameById(exercisesById, id, L.lang)}: ${list.map(setLabel).join(', ')}`)
  }
  for (const a of [...activityLogs].sort((x, y) => x.ts - y.ts))
    lines.push(`${nameById(activitiesById, a.activityId, L.lang)}: ${activityLabel(a)}${a.notes ? ` (${a.notes})` : ''}`)
  return lines.join('\n')
}
