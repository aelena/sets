import { describe, it, expect } from 'vitest'
import { normalizePlan, planDay, dayStatus, planProgress, nudges, exportPlan, planTemplate, planIcs, weekdayOf, daysBetween, addDays, targetLabel, phaseOf, endOf } from '../../src/lib/plan.js'

const library = [
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', names: { es: 'Hip thrust con barra' }, type: 'reps', sets: 4, reps: 10 },
  { id: 'leg-press', name: 'Leg Press', names: { es: 'Prensa' }, type: 'reps', sets: 4, reps: 12 },
  { id: 'plank', name: 'Plank', names: { es: 'Plancha' }, type: 'time', sets: 3, seconds: 60 },
  { id: 'abductor', name: 'Abductor', type: 'reps', sets: 4, reps: 15 },
  { id: 'old', name: 'Leg Press', type: 'reps', archived: true },
]
const file = {
  format: 'sets/plan', version: 1, name: '30-day challenge', names: { es: 'Reto de 30 días' }, start: '2026-11-03', days: 30,
  goal: 'Strength', rules: ['Warm up 5-10 min'], phases: [{ weeks: [1], focus: 'Routine' }, { weeks: [2], focus: 'Technique' }],
  week: {
    mon: { name: 'Legs', items: [{ exercise: 'barbell hip thrust', sets: 4, reps: 10 }, { exercise: 'Prensa', sets: 3, reps: '10-12' }, { exercise: 'Abductores', es: 'Abductor', sets: 3, reps: 15 }] },
    tue: { name: 'Core', items: [{ exercise: 'Plank', sets: 3, seconds: [20, 30] }, { exercise: 'Cable Glute Kickback', es: 'Patada de glúteo', sets: 3, reps: 15, perSide: true }] },
    wed: { rest: true, name: 'Rest' }, thu: { name: 'Legs', items: [{ exercise: 'Leg Press', sets: 3, reps: 12, kg: 80 }] },
    fri: { rest: true }, sat: {}, sun: { rest: true },
  },
  overrides: { '2026-11-10': { name: 'Light', items: [{ exercise: 'Plank', sets: 2, seconds: 20 }] }, 'nope': {} },
}

describe('reading a plan file', () => {
  it('resolves exercises by English or Spanish name, accents and case ignored, live ones first; creates the missing ones', () => {
    const { plan, created, warnings } = normalizePlan(file, library)
    expect(plan.week.mon.items).toEqual([
      { exerciseId: 'hip-thrust', sets: 4, reps: 10 },
      { exerciseId: 'leg-press', sets: 3, reps: [10, 12] },
      { exerciseId: 'abductor', sets: 3, reps: 15 },
    ])
    expect(plan.week.tue.items[0]).toEqual({ exerciseId: 'plank', sets: 3, seconds: [20, 30] })
    expect(created).toEqual([expect.objectContaining({ id: 'cable-glute-kickback', name: 'Cable Glute Kickback', names: { es: 'Patada de glúteo' }, type: 'reps', sets: 3, reps: 15, perSide: true })])
    expect(plan.week.tue.items[1]).toEqual({ exerciseId: 'cable-glute-kickback', sets: 3, reps: 15, perSide: true })
    expect(plan.week.thu.items[0]).toEqual({ exerciseId: 'leg-press', sets: 3, reps: 12, kg: 80 })
    expect([plan.week.wed.rest, plan.week.fri.rest, plan.week.sat.rest]).toEqual([true, true, true])
    expect(plan).toMatchObject({ id: '30-day-challenge', start: '2026-11-03', days: 30, rules: ['Warm up 5-10 min'], names: { es: 'Reto de 30 días' } })
    expect(Object.keys(plan.overrides)).toEqual(['2026-11-10'])
    expect(warnings).toEqual(['override "nope" is not a date'])
  })

  it('refuses what is not a plan', () => {
    expect(() => normalizePlan(null)).toThrow('planNotJson')
    expect(() => normalizePlan({ format: 'exercise-tracker/config', week: {} })).toThrow('planFormat')
    expect(() => normalizePlan({ name: 'x' })).toThrow('planNoWeek')
    expect(() => normalizePlan({ week: { mon: { rest: true } } })).toThrow('planNoTraining')
  })

  it('starts today when the file has no start date', () => {
    const { plan, warnings } = normalizePlan({ week: { mon: { items: ['Plank'] } } }, library, '2026-11-05')
    expect(plan.start).toBe('2026-11-05')
    expect(plan.week.mon.items).toEqual([{ exerciseId: 'plank', sets: 3, seconds: 60 }])
    expect(warnings).toContain('no start date: starts today')
  })
})

describe('days of a plan', () => {
  const { plan } = normalizePlan(file, library)
  const logged = new Map([
    ['2026-11-03', new Set(['hip-thrust', 'leg-press', 'abductor'])], // Tue? no: Nov 3 2026 is a Tuesday
  ])

  it('knows dates', () => {
    expect(weekdayOf('2026-11-03')).toBe('tue')
    expect(weekdayOf('2026-11-09')).toBe('mon')
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3)
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(endOf(plan)).toBe('2026-12-02')
  })

  it('gives each date its day number and content, an override winning', () => {
    expect(planDay(plan, '2026-11-02')).toBeNull()
    expect(planDay(plan, '2026-11-03')).toMatchObject({ n: 1, weekday: 'tue', name: 'Core', rest: false })
    expect(planDay(plan, '2026-11-04')).toMatchObject({ n: 2, rest: true })
    expect(planDay(plan, '2026-11-10')).toMatchObject({ n: 8, name: 'Light', items: [{ exerciseId: 'plank', sets: 2, seconds: 20 }] })
    expect(planDay(plan, '2026-12-02')).toMatchObject({ n: 30 })
    expect(planDay(plan, '2026-12-03')).toBeNull()
  })

  it('marks done, partial, missed, today, future and rest', () => {
    const today = '2026-11-09'
    expect(dayStatus(plan, '2026-11-03', new Set(['plank', 'cable-glute-kickback']), today)).toBe('done')
    expect(dayStatus(plan, '2026-11-03', new Set(['plank']), today)).toBe('partial')
    expect(dayStatus(plan, '2026-11-03', new Set(['halos']), today)).toBe('partial') // trained, not the plan
    expect(dayStatus(plan, '2026-11-05', new Set(), today)).toBe('missed')
    expect(dayStatus(plan, '2026-11-04', new Set(), today)).toBe('rest')
    expect(dayStatus(plan, '2026-11-09', new Set(), today)).toBe('today')
    expect(dayStatus(plan, '2026-11-10', new Set(), today)).toBe('future')
    expect(dayStatus(plan, '2026-11-02', new Set(), today)).toBeNull()
    expect(logged.size).toBe(1)
  })

  it('tallies the plan so far and says what to nudge about', () => {
    const byDate = new Map([['2026-11-03', new Set(['plank', 'cable-glute-kickback'])], ['2026-11-09', new Set(['leg-press'])]])
    // Tue 3 done, Wed 4 rest, Thu 5 missed, Fri-Sun rest, Mon 9 partial
    expect(planProgress(plan, byDate, '2026-11-09')).toMatchObject({ done: 1, partial: 1, missed: 1, trainingDays: 3, day: 7, week: 1 })
    expect(nudges(plan, byDate, '2026-11-06').map(n => n.kind)).toEqual(['missed'])
    expect(nudges(plan, new Map(), '2026-11-09').map(n => n.kind)).toEqual(['today'])
    expect(nudges(plan, byDate, '2026-11-04')).toEqual([])
    expect(nudges(plan, new Map(), '2026-12-04').map(n => n.kind)).toEqual(['ended'])
    expect(phaseOf(plan, 9)).toMatchObject({ focus: 'Technique' })
    expect(targetLabel({ sets: 3, reps: [10, 12], kg: 40, perSide: true }, null)).toBe('3 × 10–12 · 40 kg · per side')
    expect(targetLabel({ sets: 3, seconds: [20, 30] }, null)).toBe('3 × 20–30 s')
  })
})

describe('plan files out', () => {
  const { plan, created } = normalizePlan(file, library)
  const byId = Object.fromEntries([...library, ...created].map(e => [e.id, e]))

  it('exports by name and reads back the same', () => {
    const out = exportPlan(plan, byId)
    expect(out.week.mon.items[0]).toEqual({ exercise: 'Barbell Hip Thrust', es: 'Hip thrust con barra', sets: 4, reps: 10 })
    expect(out.week.wed).toEqual({ rest: true, name: 'Rest' })
    expect(normalizePlan(out, [...library, ...created]).plan).toEqual(plan)
  })

  it('makes a template that lists the library and reads as a plan', () => {
    const tpl = planTemplate(library, '2026-11-05')
    expect(tpl.library).toEqual(['Abductor', 'Barbell Hip Thrust · Hip thrust con barra', 'Leg Press · Prensa', 'Plank · Plancha'])
    expect(tpl._instructions.join(' ')).toContain('no nutrition, no medical advice')
    expect(normalizePlan(tpl, library).plan.week.mon.items).toHaveLength(2)
  })

  it('writes the training days as calendar events with an alarm', () => {
    const ics = planIcs(plan, byId, { time: '18:30', minutes: 60, alarm: 30, now: new Date(Date.UTC(2026, 10, 5, 12)) })
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(13) // Nov 3 to Dec 2: 5 Tuesdays, 4 Thursdays, 4 Mondays
    expect(ics).toContain('DTSTART:20261103T183000\r\nDTEND:20261103T193000')
    expect(ics).toContain('SUMMARY:Core · 1/30')
    expect(ics).toContain('TRIGGER:-PT30M')
    expect(ics).toContain('DTSTAMP:20261105T120000Z')
    expect(ics.split('\r\n').every(l => new TextEncoder().encode(l).length <= 75)).toBe(true)
    expect(ics).toContain('Plank: 3 × 20–30 s')
  })
})
