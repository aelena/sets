import { describe, it, expect } from 'vitest'
import { parsePace, formatPace, resolve, activityLabel, dailyActivity } from '../../src/lib/activity.js'

describe('parsePace', () => {
  it.each([
    ['6', 6], ['6:00', 6], ["6'", 6], ["6'30\"", 6.5], ['6:30', 6.5], ['5,5', 5.5], ['6:00/km', 6], ["4'45''", 4.75], [' 7 ', 7],
  ])('%s → %s', (text, minutes) => expect(parsePace(text)).toBeCloseTo(minutes))

  it.each(['', 'fast', '0', '6:3x', '-5'])('rejects %j', text => expect(parsePace(text)).toBeNull())
})

describe('resolve', () => {
  it('derives the missing one of duration, distance and pace', () => {
    expect(resolve({ minutes: 30, pace: "6'" })).toEqual({ minutes: 30, km: 5 })
    expect(resolve({ km: 10, pace: '5:30' })).toEqual({ minutes: 55, km: 10 })
    expect(resolve({ minutes: '45', km: '15' })).toEqual({ minutes: 45, km: 15 })
    expect(resolve({ minutes: 20 })).toEqual({ minutes: 20, km: null })
    expect(resolve({ minutes: 0, km: '' })).toEqual({ minutes: null, km: null })
  })
})

describe('labels and days', () => {
  it('formats a log and its pace', () => {
    expect(formatPace(6.5)).toBe('6:30')
    expect(activityLabel({ minutes: 30, km: 5 })).toBe('30 min · 5 km · 6:00/km')
    expect(activityLabel({ minutes: 20, km: null })).toBe('20 min')
    expect(activityLabel({ minutes: null, km: 2.5 })).toBe('2.5 km')
  })

  it('sums a day and paces over the logs that have both', () => {
    const d = dailyActivity([
      { date: '2026-10-16', minutes: 30, km: 5 },
      { date: '2026-10-16', minutes: 10, km: null },
      { date: '2026-10-14', minutes: 25, km: 5 },
    ])
    expect(d).toEqual([
      { date: '2026-10-14', entries: 1, minutes: 25, km: 5, pace: 5 },
      { date: '2026-10-16', entries: 2, minutes: 40, km: 5, pace: 6 },
    ])
  })
})
