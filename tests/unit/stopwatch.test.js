import { describe, it, expect } from 'vitest'
import { elapsed, start, stop, lap, reset, lapRows, fmt, running } from '../../src/lib/stopwatch.js'

describe('stopwatch', () => {
  it('runs, pauses, resumes, laps and resets', () => {
    let s = reset()
    s = start(s, 1000)
    expect(running(s)).toBe(true)
    expect(elapsed(s, 3500)).toBe(2500)
    s = lap(s, 3500)
    s = stop(s, 5000)
    expect(elapsed(s, 99999)).toBe(4000) // stopped: time does not move
    s = start(s, 10000)
    s = lap(s, 11000)
    expect(lapRows(s)).toEqual([{ n: 2, total: 5000, split: 2500 }, { n: 1, total: 2500, split: 2500 }])
    expect(lap(stop(s, 12000), 13000).laps).toHaveLength(2) // no laps while stopped
    expect(reset()).toEqual({ startedAt: null, before: 0, laps: [] })
  })

  it('formats minutes, seconds and hundredths', () => {
    expect([fmt(0), fmt(62_345), fmt(3_723_450)]).toEqual(['00:00.00', '01:02.34', '1:02:03.45'])
  })
})
