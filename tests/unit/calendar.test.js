import { describe, it, expect } from 'vitest'
import { monthGrid, weekdays } from '../../src/lib/calendar.js'

describe('monthGrid', () => {
  it('starts on Monday and pads with neighbouring days', () => {
    const weeks = monthGrid(2026, 9) // October 2026 starts on a Thursday
    expect(weeks).toHaveLength(5)
    expect(weeks[0].map(c => c.day)).toEqual([28, 29, 30, 1, 2, 3, 4])
    expect(weeks[0][0]).toEqual({ date: '2026-09-28', day: 28, inMonth: false })
    expect(weeks[0][3]).toEqual({ date: '2026-10-01', day: 1, inMonth: true })
    expect(weeks.at(-1).map(c => c.date)).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'])
  })

  it('handles a month that fits exactly and one needing six rows', () => {
    expect(monthGrid(2021, 1)).toHaveLength(4) // Feb 2021: Monday 1st, 28 days
    expect(monthGrid(2026, 7)).toHaveLength(6) // Aug 2026: Saturday 1st, 31 days
  })

  it('names weekdays Monday first', () => {
    expect(weekdays('en')).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
    expect(weekdays('es')).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D'])
  })
})
