import { describe, it, expect } from 'vitest'
import { normalizeConfig, mergeConfig, exportConfig, cleanExercise } from '../../src/lib/config.js'
import { seedConfig } from '../../src/lib/seed.js'

describe('normalizeConfig', () => {
  it('builds the seed library with slug ids in group order', () => {
    const { exercises, groups, warnings } = normalizeConfig(seedConfig)
    expect(warnings).toEqual([])
    expect(groups.map(g => g.id)).toEqual(['kettlebell-supergroup', 'my-warm-up-routine'])
    expect(groups[0].exerciseIds).toHaveLength(12)
    expect(groups[0].exerciseIds[0]).toBe('chest-thrusts')
    expect(exercises.find(e => e.id === '3-phase-supercurl')).toMatchObject({ sets: 3, reps: 10, kg: 16, type: 'reps' })
  })

  it('resolves the same exercise in two groups to one exercise', () => {
    const { exercises, groups } = normalizeConfig({
      groups: [
        { name: 'A', exercises: [{ name: 'Halos', sets: 5, reps: 10, kg: 16 }] },
        { name: 'B', exercises: ['halos', 'HALOS', { name: 'Plank', seconds: 60, sets: 3 }] },
      ],
    })
    expect(exercises.map(e => e.id)).toEqual(['halos', 'plank'])
    expect(groups[1].exerciseIds).toEqual(['halos', 'plank'])
    expect(exercises[1]).toMatchObject({ type: 'time', seconds: 60, reps: null, kg: null })
  })

  it('references exercises already on the phone and warns on unknown ones', () => {
    const known = [cleanExercise({ name: 'Pull ups', sets: 3, reps: 8 }, 'pull-ups')]
    const { groups, warnings } = normalizeConfig({ groups: [{ name: 'Bar', exercises: ['Pull ups', 'ghost'] }] }, known)
    expect(groups[0].exerciseIds).toEqual(['pull-ups'])
    expect(warnings).toEqual(['Unknown exercise "ghost" skipped'])
  })

  it('rejects files that are not configs', () => {
    expect(() => normalizeConfig({ format: 'exercise-tracker/backup', groups: [] })).toThrow()
    expect(() => normalizeConfig({ exercises: [] })).toThrow(/groups/)
  })
})

describe('mergeConfig', () => {
  const current = normalizeConfig(seedConfig)
  const incoming = normalizeConfig({ groups: [{ name: 'Home', exercises: [{ name: 'Push ups', sets: 3, reps: 20 }] }] }, current.exercises)

  it('merge keeps existing groups and appends new ones', () => {
    const out = mergeConfig(current, incoming, 'merge')
    expect(out.groups.map(g => g.id)).toEqual(['kettlebell-supergroup', 'my-warm-up-routine', 'home'])
    expect(out.exercises.some(e => e.id === 'halos' && !e.archived)).toBe(true)
  })

  it('replace swaps groups and archives exercises it no longer mentions', () => {
    const out = mergeConfig(current, incoming, 'replace')
    expect(out.groups.map(g => g.id)).toEqual(['home'])
    expect(out.exercises.find(e => e.id === 'halos').archived).toBe(true)
    expect(out.exercises.find(e => e.id === 'push-ups').archived).toBe(false)
  })
})

describe('exportConfig', () => {
  it('round-trips through normalizeConfig', () => {
    const lib = normalizeConfig(seedConfig)
    const file = exportConfig(lib)
    expect(file.groups[1].exercises).toEqual(['arm-superseries', 'disc-routine'])
    expect(file.exercises[0]).not.toHaveProperty('seconds')
    const again = normalizeConfig(file)
    expect(again.exercises).toEqual(lib.exercises)
    expect(again.groups).toEqual(lib.groups)
  })
})

describe('localDesc and the classic groups', async () => {
  const { localDesc, CLASSIC_GROUPS } = await import('../../src/lib/seed.js')
  it('shows the line for the language, falls back to English, leaves plain text alone', () => {
    const d = 'EN: Elbows in.\nES: Codos pegados.'
    expect(localDesc(d, 'es')).toBe('Codos pegados.')
    expect(localDesc(d, 'en')).toBe('Elbows in.')
    expect(localDesc(d, 'fr')).toBe('Elbows in.')
    expect(localDesc('La superserie de curls.', 'en')).toBe('La superserie de curls.')
    expect(localDesc('', 'en')).toBe('')
  })
  it('every classic exercise has both languages and a form link', () => {
    const all = CLASSIC_GROUPS.flatMap(g => g.exercises)
    expect(all.length).toBeGreaterThanOrEqual(30)
    for (const e of all) {
      expect(e.desc).toMatch(/^EN: .+\nES: .+$/)
      expect(e.link).toMatch(/^https:\/\/www\.youtube\.com\/results\?search_query=.+\+proper\+form$/)
    }
  })
})
