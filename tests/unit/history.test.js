import { describe, it, expect } from 'vitest'
import { lastDay, personalBests, compact } from '../../src/lib/history.js'
import { recapData } from '../../src/lib/recap.js'

let id = 0
const set = (date, reps, kg = null, extra = {}) => ({ id: ++id, date, ts: Date.parse(`${date}T10:00:00`) + id, exerciseId: 'halos', reps, kg, seconds: null, ...extra })

describe('lastDay', () => {
  it('returns the most recent earlier day, sets in order', () => {
    const sets = [set('2026-10-10', 10, 16), set('2026-10-14', 10, 16), set('2026-10-14', 9, 16), set('2026-10-16', 12, 16)]
    const d = lastDay(sets, '2026-10-16')
    expect(d.date).toBe('2026-10-14')
    expect(d.sets.map(s => s.reps)).toEqual([10, 9])
    expect(lastDay(sets.slice(3), '2026-10-16')).toBeNull()
  })
})

describe('personalBests', () => {
  it('flames sets no earlier set matched on both weight and amount', () => {
    const a = set('2026-10-01', 10, 16), b = set('2026-10-01', 12, 16) // first day: never
    const c = set('2026-10-03', 12, 16) // equal, not a best
    const d = set('2026-10-03', 13, 16) // more reps
    const e = set('2026-10-05', 5, 20) // heavier
    const f = set('2026-10-05', 5, 18) // lighter than e with same reps: dominated
    expect([...personalBests([f, e, d, c, b, a], 2)]).toEqual([d.id, e.id])
    expect([...personalBests([f, e, d, c, b, a], 3)]).toEqual([e.id]) // day 3 is the first that may flame
    expect([...personalBests([f, e, d, c, b, a])]).toEqual([]) // default: from the 12th day
  })

  it('handles bodyweight and timed sets', () => {
    const plank = (date, seconds) => set(date, null, null, { seconds })
    const sets = [plank('2026-10-01', 60), plank('2026-10-02', 45), plank('2026-10-03', 75)]
    expect([...personalBests(sets, 2)]).toEqual([sets[2].id])
  })
})

describe('compact', () => {
  it('collapses identical sets, keeps a shared weight once, spells out mixed weights', () => {
    expect(compact([set('d', 50, 16), set('d', 50, 16)])).toBe('2×50 @16kg')
    expect(compact([set('d', 10, 16), set('d', 10, 16), set('d', 9, 16)])).toBe('2×10 · 9 @16kg')
    expect(compact([set('d', 8, 50), set('d', 6, 60)])).toBe('8@50 · 6@60')
    expect(compact([set('d', 20), set('d', 18)])).toBe('20 · 18')
    expect(compact([5, 5, 5, 5, 4].map(r => set('d', r, 80)))).toBe('4×5 · 4 @80kg')
    expect(compact([set('d', 8, 50), set('d', 8, 50), set('d', 6, 60)])).toBe('2×8@50 · 6@60')
    expect(compact([set('d', null, null, { seconds: 60 })])).toBe('1×60s')
  })
})

describe('recapData', () => {
  it('summarises a session and counts its personal bests against history', () => {
    const old = set('2026-10-10', 10, 16)
    const s1 = set('2026-10-16', 12, 16, { sessionId: 's' })
    const s2 = set('2026-10-16', 50, 20, { sessionId: 's', exerciseId: 'swing' })
    const r = recapData({
      session: { start: s1.ts - 60_000, end: s1.ts + 30 * 60_000, stats: { rests: 3 } },
      sets: [s2, s1], history: [old, s1, s2],
      exercisesById: { halos: { name: 'Halos' }, swing: { name: 'Lateral Swing' } }, bestsFromDay: 2,
    })
    expect(r).toMatchObject({ sets: 2, exercises: 2, volume: 1192, rests: 3, bests: 1, durationMs: 31 * 60_000 })
    expect(r.lines).toEqual([
      { name: 'Halos', detail: '1×12 @16kg', best: true },
      { name: 'Lateral Swing', detail: '1×50 @20kg', best: false },
    ])
  })
})

describe('recapData muscles', () => {
  it('ranks muscles by sets, falling back to the group name for untagged exercises', () => {
    const a = set('2026-10-16', 8, 100, { exerciseId: 'dl' })
    const b = set('2026-10-16', 8, 100, { exerciseId: 'dl' })
    const c = set('2026-10-16', 10, 16, { exerciseId: 'halos', groupId: 'kb' })
    const r = recapData({
      session: { start: 0, end: 1 }, sets: [a, b, c],
      exercisesById: { dl: { name: 'Deadlift', muscles: ['back', 'hamstrings'] }, halos: { name: 'Halos' } },
      groupsById: { kb: { name: 'Kettlebell Supergroup' } },
    })
    expect(r.muscles).toEqual(['mu:back', 'mu:hamstrings', 'group:Kettlebell Supergroup'])
  })
})

describe('open batch and last finished batch', async () => {
  const { isOpen, lastBatch } = await import('../../src/lib/history.js')
  const r = (ts, date, sessionId = null) => ({ id: ts, ts, date, sessionId, reps: 10, kg: 16 })

  it('open = the running session, or loose rows when none runs', () => {
    expect([isOpen(r(1, 'd', null), null), isOpen(r(1, 'd', 's1'), null), isOpen(r(1, 'd', 's1'), 's1'), isOpen(r(1, 'd', null), 's1')])
      .toEqual([true, false, true, false])
  })

  it('last batch: the latest finished session, else the latest day of loose sets', () => {
    const sets = [r(1, '2026-10-14', 'a'), r(2, '2026-10-14', 'a'), r(3, '2026-10-19', 'u'), r(4, '2026-10-19', null)]
    expect(lastBatch(sets, null)).toEqual({ date: '2026-10-19', sets: [sets[2]] }) // the loose one is open
    expect(lastBatch(sets, 'u').sets.map(s => s.id)).toEqual([4]) // with 'u' running, the loose row is finished
    expect(lastBatch([r(9, 'd', null)], null)).toBeNull()
  })
})

describe('recap title', () => {
  it('travels from the session to the recap data', () => {
    const r = recapData({ session: { start: 0, end: 1, recapTitle: 'Killer day' }, sets: [], exercisesById: {} })
    expect(r.title).toBe('Killer day')
    expect(recapData({ session: { start: 0, end: 1 }, sets: [], exercisesById: {} }).title).toBe('')
  })
})

describe('recap with a bundled activity', () => {
  it('uses the training time and says what it is made of', () => {
    const MIN = 60000
    const session = { id: 's', start: 10 * 60 * MIN, end: 11 * 60 * MIN + 5 * MIN }
    const r = recapData({
      session, sets: [], exercisesById: {}, activitiesById: { running: { name: 'Running', names: { es: 'Correr' } } }, lang: 'es',
      activityLogs: [{ sessionId: 's', ts: 8 * 60 * MIN, activityId: 'running', minutes: 45, km: 8.5 }],
    })
    expect(r.durationMs).toBe(110 * MIN)
    expect(r.parts).toEqual({ sessionMs: 65 * MIN, extra: [{ name: 'Correr', minutes: 45 }] })
    expect(recapData({ session, sets: [], exercisesById: {} }).parts).toBeNull()
  })
})
