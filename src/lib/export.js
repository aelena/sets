import { hhmm, dateKey } from './time.js'
import { paceOf, formatPace } from './activity.js'
import { trainingTime } from './summary.js'

/** One row per set, flat, ready for Excel. Set number counts within (day, exercise). */
export function setRows(sets, { exercises, groups, sessions }) {
  const ex = Object.fromEntries(exercises.map(e => [e.id, e]))
  const gr = Object.fromEntries(groups.map(g => [g.id, g]))
  const se = Object.fromEntries(sessions.map(s => [s.id, s]))
  const counter = new Map()
  return [...sets].sort((a, b) => a.ts - b.ts).map(s => {
    const key = `${s.date}|${s.exerciseId}`
    counter.set(key, (counter.get(key) ?? 0) + 1)
    return {
      date: s.date,
      time: hhmm(s.ts),
      exercise: ex[s.exerciseId]?.name ?? s.exerciseId,
      exercise_es: ex[s.exerciseId]?.names?.es ?? '',
      group: gr[s.groupId]?.name ?? '',
      set_no: counter.get(key),
      reps: s.reps ?? null,
      seconds: s.seconds ?? null,
      kg: s.kg ?? null,
      volume_kg: s.kg != null && s.reps != null ? s.kg * s.reps : null,
      session: se[s.sessionId] ? `${dateKey(se[s.sessionId].start)} ${hhmm(se[s.sessionId].start)}` : '',
      exercise_id: s.exerciseId,
    }
  })
}

export const sessionRows = (sessions, activityLogs = []) =>
  [...sessions].sort((a, b) => a.start - b.start).map(s => ({
    date: dateKey(s.start),
    start: hhmm(s.start),
    end: s.end ? hhmm(s.end) : '',
    minutes: s.end && !s.untimed ? Math.round((s.end - s.start) / 60000) : null,
    training_minutes: s.end && !s.untimed ? Math.round(trainingTime(s, activityLogs).ms / 60000) : null,
    summary: s.summary ?? '',
  }))

export function activityRows(logs, { activities = [], sessions = [] }) {
  const ac = Object.fromEntries(activities.map(a => [a.id, a]))
  const se = Object.fromEntries(sessions.map(s => [s.id, s]))
  return [...logs].sort((a, b) => a.ts - b.ts).map(l => ({
    date: l.date,
    time: hhmm(l.ts),
    activity: ac[l.activityId]?.name ?? l.activityId,
    activity_es: ac[l.activityId]?.names?.es ?? '',
    minutes: l.minutes ?? null,
    km: l.km ?? null,
    pace_min_km: paceOf(l) ? formatPace(paceOf(l)) : '',
    notes: l.notes ?? '',
    session: se[l.sessionId] ? `${dateKey(se[l.sessionId].start)} ${hhmm(se[l.sessionId].start)}` : '',
  }))
}

export const noteRows = notes =>
  [...notes].sort((a, b) => a.ts - b.ts).map(n => ({ date: n.date, time: hhmm(n.ts), note: n.text }))

/** Real .xlsx (not CSV): Excel in a Spanish locale reads it without separator surprises. */
export async function workbook(data) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const add = (rows, name) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name)
  add(setRows(data.sets, data), 'sets')
  add(activityRows(data.activityLogs ?? [], data), 'activities')
  add(sessionRows(data.sessions, data.activityLogs ?? []), 'sessions')
  add(noteRows(data.notes), 'notes')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/**
 * Hand a file to the iOS share sheet (Save to Files / iCloud Drive / AirDrop),
 * or download it where sharing files is not supported. Resolves true when the file left the app.
 */
export async function deliver(blob, filename) {
  const file = new File([blob], filename, { type: blob.type })
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return true }
    catch (e) { if (e.name === 'AbortError') return false }
  }
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
  return true
}

export const jsonBlob = obj => new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
