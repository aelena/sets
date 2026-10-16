import { describe, it, expect } from 'vitest'
import { recency, weekly, durations, average, daysBetween, status, weekStart } from '../../src/lib/overview.js'

const ex = {
  dl: { muscles: ['back', 'hamstrings'] },
  curl: { muscles: ['biceps'] },
  halos: {}, // untagged: counts for nothing
}

describe('muscleRecency', () => {
  it('last day per muscle, most stale first, never-trained last; untagged by group; cardio from activities', () => {
    const rows = recency({
      today: '2026-10-30',
      exercisesById: ex,
      sets: [
        { exerciseId: 'dl', date: '2026-10-10' },
        { exerciseId: 'dl', date: '2026-10-23' },
        { exerciseId: 'curl', date: '2026-10-29' },
        { exerciseId: 'halos', date: '2026-10-28', groupId: 'kettlebell-supergroup' },
      ],
      activityLogs: [{ date: '2026-10-15' }],
    })
    const trained = rows.filter(r => r.days != null)
    expect(trained).toEqual([
      { key: 'cardio', date: '2026-10-15', days: 15, status: 'stale' },
      { key: 'mu:back', date: '2026-10-23', days: 7, status: 'due' },
      { key: 'mu:hamstrings', date: '2026-10-23', days: 7, status: 'due' },
      { key: 'group:kettlebell-supergroup', date: '2026-10-28', days: 2, status: 'ok' },
      { key: 'mu:biceps', date: '2026-10-29', days: 1, status: 'ok' },
    ])
    expect(rows.slice(trained.length).every(r => r.status === 'never')).toBe(true)
    expect(rows.find(r => r.key === 'mu:core').days).toBeNull()
  })

  it('thresholds 7 and 14, days across a DST change', () => {
    expect([status(null), status(0), status(6), status(7), status(13), status(14)]).toEqual(['never', 'ok', 'ok', 'due', 'due', 'stale'])
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2) // Europe falls back on 25 Oct 2026
  })
})

describe('weekly', () => {
  const at = (d, h, m = 0) => new Date(2026, 9, d, h, m).getTime()
  it('counts sessions, minutes and training days per Monday-start week', () => {
    const rows = weekly({
      now: at(28, 12), weeks: 3, // Wed 28 Oct; weeks start Mon 12, 19, 26
      sessions: [
        { start: at(13, 18), end: at(13, 19) },
        { start: at(15, 18), end: at(15, 18, 45) },
        { start: at(20, 7), end: at(20, 7, 30) },
        { start: at(27, 18), end: null }, // running: not counted
        { start: at(1, 18), end: at(1, 19) }, // before the window
      ],
      sets: [{ date: '2026-10-13' }, { date: '2026-10-14' }, { date: '2026-10-14' }, { date: '2026-10-27' }],
      activityLogs: [{ date: '2026-10-21' }],
    })
    expect(rows.map(r => [new Date(r.start).getDate(), r.sessions, r.minutes, r.days])).toEqual([[12, 2, 105, 2], [19, 1, 30, 1], [26, 0, 0, 1]])
    expect(average(rows, 'sessions')).toBe(1.5) // the running week is left out
    expect(weekStart(at(25, 23))).toBe(new Date(2026, 9, 19).getTime()) // Sunday belongs to the week before
  })

  it('durations in minutes, oldest first', () => {
    expect(durations([{ start: 2000, end: 2000 + 50 * 60000 }, { start: 1000, end: 1000 + 30 * 60000 }, { start: 3000, end: null }]))
      .toEqual([{ x: 1000, y: 30 }, { x: 2000, y: 50 }])
  })
})
