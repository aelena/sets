import { describe, it, expect } from 'vitest'
import { unitOf, parseSteps, schedule, totalSeconds, at, runMs, pause, resume, seek } from '../../src/lib/intervals.js'

describe('reading a routine the way people write it', () => {
  it('reads the units, typos included', () => {
    expect(['s', 'sec', 'seconds', 'segundos', 'sceonds', 'secodns', '"'].map(unitOf)).toEqual([1, 1, 1, 1, 1, 1, 1])
    expect(['min', 'minutes', 'minutos', "'"].map(unitOf)).toEqual([60, 60, 60, 60])
    expect(['climbers', 'shoulder', 'squats', ''].map(unitOf)).toEqual([null, null, null, null])
  })

  it('reads the user\'s own line, commas and dashes mixed, a typo and "and so on"', () => {
    const { steps } = parseSteps('30 seconds, climbers - 30 seconds, cross climbers - 30 seconds burpees - 30 sceonds elbow plank, 30 seconds straihgt arm plank, 30 shoulder touch planks and so on')
    expect(steps).toEqual([
      { name: 'climbers', seconds: 30 },
      { name: 'cross climbers', seconds: 30 },
      { name: 'burpees', seconds: 30 },
      { name: 'elbow plank', seconds: 30 },
      { name: 'straihgt arm plank', seconds: 30 },
      { name: 'shoulder touch planks', seconds: 30 },
    ])
  })

  it('reads one step per line, names first or last, minutes, rests and rounds', () => {
    expect(parseSteps('Jumping jacks 45\nRest 15\nSquats 1 min\n3 rounds')).toEqual({
      steps: [{ name: 'Jumping jacks', seconds: 45 }, { name: 'Rest', seconds: 15, rest: true }, { name: 'Squats', seconds: 60 }], rounds: 3,
    })
    expect(parseSteps('20s burpees, 10s descanso x8')).toEqual({ steps: [{ name: 'burpees', seconds: 20 }, { name: 'descanso', seconds: 10, rest: true }], rounds: 8 })
    expect(parseSteps('no numbers here').steps).toEqual([])
  })
})

describe('running it', () => {
  const steps = [{ name: 'A', seconds: 30 }, { name: 'B', seconds: 20 }]

  it('lays out get-ready, rounds and the rest between rounds', () => {
    const plan = schedule({ steps, rounds: 2, restBetween: 15, prep: 5 })
    expect(plan.map(s => s.prep ? 'ready' : s.between ? 'rest' : `${s.name}${s.round}`)).toEqual(['ready', 'A1', 'B1', 'rest', 'A2', 'B2'])
    expect(totalSeconds(plan)).toBe(5 + 50 + 15 + 50)
  })

  it('finds the step and time left at any moment, and the end', () => {
    const plan = schedule({ steps, rounds: 1, prep: 0 })
    expect(at(plan, 0)).toEqual({ index: 0, left: 30_000, done: false })
    expect(at(plan, 29_500)).toEqual({ index: 0, left: 500, done: false })
    expect(at(plan, 30_000)).toEqual({ index: 1, left: 20_000, done: false })
    expect(at(plan, 50_000)).toMatchObject({ index: 1, done: true })
  })

  it('pauses, resumes and skips by timestamps', () => {
    const plan = schedule({ steps, rounds: 1, prep: 0 })
    let run = { start: 1000 }
    expect(runMs(run, 11_000)).toBe(10_000)
    run = pause(run, 11_000)
    expect(runMs(run, 99_000)).toBe(10_000) // frozen while paused
    run = resume(run, 21_000)
    expect(runMs(run, 22_000)).toBe(11_000)
    run = seek(run, plan, 1, 22_000)
    expect(at(plan, runMs(run, 22_000))).toMatchObject({ index: 1, left: 20_000 })
  })
})
