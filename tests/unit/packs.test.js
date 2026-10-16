import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import Dexie from 'dexie'
import { planPack, missingMuscles } from '../../src/lib/packs.js'
import { PACKS, BACK_GROUPS, CATALOG_MUSCLES } from '../../src/lib/seed.js'
import { createDb } from '../../src/lib/db.js'
import { createRepo } from '../../src/lib/repo.js'

let n = 0
const back = PACKS.find(p => p.id === 'back-1')

describe('planPack', () => {
  const mine = {
    exercises: [
      { id: 'deadlift', name: 'Deadlift', type: 'reps', sets: 5, reps: 3, kg: 140 }, // the user's own, heavier
      { id: 'face-pull', name: 'Face Pull', type: 'reps', sets: 3, reps: 15, kg: 15 },
    ],
    groups: [{ id: 'back', name: 'Back', order: 0, exerciseIds: ['deadlift'] }],
  }

  it('reuses the user\'s exercises, never changes them, adds the rest', () => {
    const { addExercises } = planPack(back, mine)
    expect(addExercises.map(e => e.id)).not.toContain('deadlift')
    expect(addExercises.map(e => e.id)).not.toContain('face-pull')
    expect(addExercises.map(e => e.id)).toContain('lat-pulldown')
  })

  it('adds a clashing group next to the user\'s instead of replacing it', () => {
    const { addGroups } = planPack(back, mine)
    expect(addGroups).toHaveLength(1)
    expect(addGroups[0]).toMatchObject({ name: 'Back (classic)', order: 1 })
    expect(addGroups[0].id).not.toBe('back')
    expect(addGroups[0].exerciseIds[0]).toBe('deadlift') // the user's deadlift, by name
    expect(addGroups[0].exerciseIds).toContain('face-pull')
  })

  it('a brand-new library just gets the pack', () => {
    const { addExercises, addGroups } = planPack(back, { exercises: [], groups: [] })
    expect(addGroups.map(g => g.name)).toEqual(['Back'])
    expect(addExercises).toHaveLength(BACK_GROUPS[0].exercises.length - 1) // Face Pull is a name reference, not in this pack
  })
})

describe('missingMuscles', () => {
  it('fills only exercises that never had muscles', () => {
    const out = missingMuscles([
      { id: 'a', name: 'Plank' },
      { id: 'b', name: 'Dips', muscles: [] }, // cleared on purpose
      { id: 'c', name: 'Halos' }, // not in the catalog
    ], CATALOG_MUSCLES)
    expect(out).toEqual([{ id: 'a', muscles: ['core'] }])
  })
})

describe('applyPacks', () => {
  it('fresh phone: all packs once, nothing on the second start', async () => {
    const repo = createRepo(createDb(`packs-${n++}`))
    expect(await repo.applyPacks()).toEqual(['base-1', 'classic-1', 'back-1'])
    expect(await repo.applyPacks()).toEqual([])
    const { groups } = await repo.library()
    expect(groups.map(g => g.name)).toEqual(['Kettlebell Supergroup', 'My Warm up Routine', 'Biceps', 'Triceps', 'Shoulders', 'Leg Day', 'Core', 'Back'])
  })

  it('phone with hand-made content from v3: only back-1 is added, nothing of the user\'s changes', async () => {
    const name = `packs-${n++}`
    const old = new Dexie(name)
    old.version(1).stores({ exercises: 'id, name', groups: 'id, order', sets: '++id, ts, date, exerciseId, sessionId, [exerciseId+date]', sessions: 'id, start', rests: '++id, sessionId, start', notes: '++id, ts, date, sessionId' })
    old.version(2).stores({ activities: 'id, name', activityLogs: '++id, ts, date, activityId, sessionId' })
    old.version(3).stores({})
    await old.exercises.bulkAdd([
      { id: 'halos', name: 'Halos', type: 'reps', sets: 5, reps: 10, kg: 16 },
      { id: 'my-row', name: 'Barbell Row', type: 'reps', sets: 5, reps: 5, kg: 70, muscles: [] },
    ])
    await old.groups.bulkAdd([
      { id: 'kettlebell-supergroup', name: 'Kettlebell Supergroup', order: 0, exerciseIds: ['halos'] },
      { id: 'my-back', name: 'Back', order: 1, exerciseIds: ['my-row'] },
    ])
    old.close()

    const repo = createRepo(createDb(name))
    expect(await repo.applyPacks()).toEqual(['back-1'])
    const { groups, exercises } = await repo.library()
    expect(groups.map(g => g.name)).toEqual(['Kettlebell Supergroup', 'Back', 'Back (classic)'])
    expect(groups[1].exerciseIds).toEqual(['my-row'])
    expect(exercises.find(e => e.id === 'my-row')).toMatchObject({ kg: 70, muscles: [] })
    expect(groups[2].exerciseIds).toContain('my-row') // their Barbell Row, by name
    expect(exercises.find(e => e.id === 'halos').muscles).toBeUndefined()
  })

  it('a restored backup is not topped up with packs', async () => {
    const repo = createRepo(createDb(`packs-${n++}`))
    await repo.restore({ format: 'exercise-tracker/backup', version: 1, exercises: [], groups: [{ id: 'x', name: 'Only mine', order: 0, exerciseIds: [] }], sets: [], sessions: [], notes: [] })
    expect(await repo.applyPacks()).toEqual([])
    expect((await repo.library()).groups.map(g => g.name)).toEqual(['Only mine'])
  })
})
