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
    expect(await repo.applyPacks()).toEqual(PACKS.map(p => p.id))
    expect(await repo.applyPacks()).toEqual([])
    const { groups } = await repo.library()
    expect(groups.map(g => g.name)).toEqual(['Kettlebell Supergroup', 'My Warm up Routine', 'Biceps', 'Triceps', 'Shoulders', 'Leg Day', 'Core', 'Back', 'Push ups', 'Chest', 'Kegels · Men', 'Kegels · Women'])
    const leg = groups.find(g => g.id === 'leg-day').exerciseIds
    expect(leg.indexOf('glute-bridge')).toBe(leg.indexOf('barbell-hip-thrust') + 1) // appended in order, no new group
    expect(leg.at(-1)).toBe('seated-calf-raise') // then the review additions
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
    expect(await repo.applyPacks()).toEqual(PACKS.slice(2).map(p => p.id)) // curate-1 onwards
    const { groups, exercises } = await repo.library()
    expect(groups.map(g => g.name)).toEqual(['Kettlebell Supergroup', 'Back', 'Back (classic)', 'Push ups', 'Hip thrust', 'Chest', 'Kegels · Men', 'Kegels · Women'])
    expect(groups[1].exerciseIds).toEqual(['my-row'])
    expect(exercises.find(e => e.id === 'my-row')).toMatchObject({ kg: 70, muscles: [] })
    expect(groups[2].exerciseIds).toContain('my-row') // their Barbell Row, by name
    expect(exercises.find(e => e.id === 'halos').muscles).toBeUndefined()
  })

  it('a backup from before packs gets only the packs added since; one that lists its packs gets none', async () => {
    const repo = createRepo(createDb(`packs-${n++}`))
    const mine = { format: 'exercise-tracker/backup', version: 1, exercises: [], groups: [{ id: 'x', name: 'Only mine', order: 0, exerciseIds: [] }], sets: [], sessions: [], notes: [] }
    await repo.restore(mine)
    expect(await repo.applyPacks()).toEqual(PACKS.slice(2).map(p => p.id)) // curate-1 onwards
    expect((await repo.library()).groups.map(g => g.name)).toEqual(['Only mine', 'Back', 'Push ups', 'Hip thrust', 'Chest', 'Kegels · Men', 'Kegels · Women'])
    await repo.restore({ ...mine, packs: PACKS.map(p => p.id) })
    expect(await repo.applyPacks()).toEqual([])
    expect((await repo.library()).groups.map(g => g.name)).toEqual(['Only mine'])
  })
})

describe('curate-1 on a library like the first hand-built one', () => {
  it('renames under guard, translates, merges the unused Face Pull, keeps every id and set', async () => {
    const repo = createRepo(createDb(`curate-${n++}`))
    await repo.applyPacks(PACKS.filter(p => ['base-1', 'classic-1'].includes(p.id)))
    const db = repo.db
    await db.exercises.bulkAdd([
      { id: 'polea-alta-al-pecho', name: 'Polea alta al pecho', type: 'reps', sets: 4, reps: 12, kg: 52, desc: 'De 52 en adelante' },
      { id: 'polea-ajustable-hacia-la-cabeza', name: 'Polea Ajustable hacia la cabeza', type: 'reps', sets: 3, reps: 10, kg: 32 },
      { id: 'dominadas', name: 'Dominadas', type: 'reps', sets: 2, reps: 12, kg: null },
      { id: 'remo-sentado', name: 'Remo Sentado', type: 'reps', sets: 4, reps: 12, kg: 35 },
      { id: 'curl-muneca-sentado', name: 'Curl mu\u00f1eca sentado', type: 'reps', sets: 4, reps: 12, kg: 25 },
      { id: 'renamed-by-me', name: 'My own row', type: 'reps', sets: 3, reps: 10, kg: 40 },
    ])
    await db.groups.bulkAdd([
      { id: 'nuevo-grupo', name: 'Espalda', order: 7, exerciseIds: ['polea-alta-al-pecho', 'polea-ajustable-hacia-la-cabeza', 'remo-sentado'] },
      { id: 'nuevo-grupo-3', name: 'Amtebrazos', order: 8, exerciseIds: ['curl-muneca-sentado'] },
    ])
    await db.sets.bulkAdd([
      { ts: 1, date: '2026-10-16', exerciseId: 'polea-alta-al-pecho', reps: 12, kg: 52, sessionId: 's' },
      { ts: 2, date: '2026-10-16', exerciseId: 'polea-ajustable-hacia-la-cabeza', reps: 10, kg: 32, sessionId: 's' },
    ])
    const setsBefore = await db.sets.toArray()

    expect(await repo.applyPacks()).toEqual(PACKS.slice(2).map(p => p.id)) // curate-1 onwards
    const ex = id => db.exercises.get(id)
    expect(await ex('polea-alta-al-pecho')).toMatchObject({ name: 'Lat Pulldown', names: { es: 'Jal\u00f3n al pecho' }, kg: 52, sets: 4 })
    expect((await ex('polea-alta-al-pecho')).desc).toMatch(/^EN: .+\nES: .+\nDe 52 en adelante\.$/)
    expect(await ex('curl-muneca-sentado')).toMatchObject({ name: 'Seated Barbell Wrist Curl', muscles: ['forearms'] })
    expect((await ex('renamed-by-me')).name).toBe('My own row')

    // Face Pull: the built-in one had no sets, so it folds into the user's
    expect((await ex('face-pull')).archived).toBe(true)
    const shoulders = await db.groups.get('shoulders')
    expect(shoulders.exerciseIds).toContain('polea-ajustable-hacia-la-cabeza')
    expect(shoulders.exerciseIds).not.toContain('face-pull')

    const groups = await db.groups.orderBy('order').toArray()
    expect(groups.find(g => g.id === 'nuevo-grupo')).toMatchObject({ name: 'Back', names: { es: 'Espalda' } })
    expect(groups.find(g => g.id === 'nuevo-grupo-3')).toMatchObject({ name: 'Forearms', names: { es: 'Antebrazos' } })
    // the Back pack arrives as its own group and reuses the user's renamed exercises
    const classic = groups.find(g => g.name === 'Back (classic)')
    expect(classic).toMatchObject({ name: 'Back (classic)', names: { es: 'Espalda (cl\u00e1sico)' } })
    expect(classic.exerciseIds).toEqual(expect.arrayContaining(['polea-alta-al-pecho', 'remo-sentado', 'dominadas', 'polea-ajustable-hacia-la-cabeza']))
    expect(await db.exercises.where('name').equals('Lat Pulldown').count()).toBe(1)

    // built-ins got Spanish names, user data untouched
    expect((await ex('barbell-curl')).names).toEqual({ es: 'Curl con barra' })
    expect(await db.sets.toArray()).toEqual(setsBefore)
  })
})

describe('curate-2 fill-only', () => {
  it('writes a description or link only where the exercise has none', async () => {
    const { planCuration } = await import('../../src/lib/packs.js')
    const { CURATE_2 } = await import('../../src/lib/catalog2.js')
    const plan = planCuration(CURATE_2, {
      exercises: [
        { id: 'halos', name: 'Halos', desc: 'my own note' },
        { id: 'chest-thrusts', name: 'Chest Thrusts' },
        { id: 'torso-twists', name: 'My twists' }, // renamed by the user: left alone
      ],
      groups: [],
    })
    const by = Object.fromEntries(plan.exerciseUpdates.map(u => [u.id, u.changes]))
    expect(Object.keys(by.halos)).toEqual(['link'])
    expect(by['chest-thrusts']).toEqual({ link: 'https://www.youtube.com/results?search_query=kettlebell+Chest+Thrusts' })
    expect(by['torso-twists']).toBeUndefined()
  })
})

describe('chest-1 goes before the Kegels groups', () => {
  it('slots in front of them and moves them down', async () => {
    const chest = PACKS.find(p => p.id === 'chest-1')
    const groups = [
      { id: 'mine', name: 'Mine', order: 0, exerciseIds: [] },
      { id: 'kegels-men', name: 'Kegels · Men', order: 1, exerciseIds: [] },
      { id: 'kegels-women', name: 'Kegels · Women', order: 2, exerciseIds: [] },
    ]
    const plan = planPack(chest, { exercises: [], groups })
    expect(plan.addGroups.map(g => [g.name, g.order])).toEqual([['Chest', 1]])
    expect(plan.shift).toEqual([{ id: 'kegels-men', order: 2 }, { id: 'kegels-women', order: 3 }])
    expect(planPack(chest, { exercises: [], groups: groups.slice(0, 1) }).shift).toBeUndefined() // no Kegels: appended
  })
})
