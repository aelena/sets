import { describe, it, expect } from 'vitest'
import { recency, weekly, durations, average, daysBetween, status, weekStart, setsPerMuscle, restPerSession, streaks, weeksSinceFirst, timeOfDay } from '../../src/lib/overview.js'

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

describe('round 2', () => {
  const at = (d, h, m = 0) => new Date(2026, 9, d, h, m).getTime()

  it('weekly volume and cardio', () => {
    const rows = weekly({
      now: at(28, 12), weeks: 2, sessions: [],
      sets: [{ date: '2026-10-20', reps: 10, kg: 50 }, { date: '2026-10-21', reps: 10, kg: null }, { date: '2026-10-27', reps: 5, kg: 100 }],
      activityLogs: [{ date: '2026-10-22', minutes: 30, km: 5 }, { date: '2026-10-23', minutes: 20, km: null }],
    })
    expect(rows.map(r => [r.volume, r.cardioMin, r.cardioKm])).toEqual([[500, 50, 5], [500, 0, 0]])
  })

  it('sets per muscle per week: primary 1, secondary half, untagged by group, busiest first', () => {
    const out = setsPerMuscle({
      now: at(28, 12), weeks: 2,
      exercisesById: { dl: { muscles: ['back', 'hamstrings'] }, halos: {} },
      sets: [
        { date: '2026-10-20', exerciseId: 'dl' }, { date: '2026-10-27', exerciseId: 'dl' }, { date: '2026-10-27', exerciseId: 'dl' },
        { date: '2026-10-27', exerciseId: 'halos', groupId: 'kb' }, { date: '2026-09-01', exerciseId: 'dl' },
      ],
    })
    expect(out).toEqual([
      { key: 'mu:back', counts: [1, 2], total: 3 },
      { key: 'mu:hamstrings', counts: [0.5, 1], total: 1.5 },
      { key: 'group:kb', counts: [0, 1], total: 1 },
    ])
  })

  it('rest per timed session in minutes', () => {
    expect(restPerSession([
      { start: 2, end: 3, stats: { rests: 3, restMs: 150_000 } },
      { start: 1, end: 2, stats: { rests: 0, restMs: 0 } },
      { start: 4, end: 5, untimed: true, stats: { rests: 0, restMs: 0 } },
      { start: 6, end: 7 }, // before rests were kept
    ])).toEqual([{ x: 1, y: 0, rests: 0 }, { x: 2, y: 2.5, rests: 3 }])
  })

  it('streaks: the running week extends but never breaks', () => {
    const w = days => days.map(d => ({ days: d }))
    expect(streaks(w([2, 3, 0, 2, 2, 3, 1]))).toEqual({ current: 3, best: 3 })
    expect(streaks(w([2, 2, 2, 0, 2, 2]))).toEqual({ current: 2, best: 3 })
    expect(streaks(w([0, 0, 1]))).toEqual({ current: 0, best: 0 })
    expect(weeksSinceFirst([{ date: '2026-10-13' }, { date: '2026-10-20' }], at(28, 12))).toBe(3)
  })

  it('time of day bands, night wraps past midnight', () => {
    const r = timeOfDay([{ ts: at(1, 7) }, { ts: at(1, 12) }, { ts: at(1, 18) }, { ts: at(1, 23) }, { ts: at(1, 2) }, { ts: at(1, 5) }])
    expect(r).toEqual([{ key: 'morning', n: 2 }, { key: 'afternoon', n: 1 }, { key: 'evening', n: 1 }, { key: 'night', n: 2 }])
  })
})
