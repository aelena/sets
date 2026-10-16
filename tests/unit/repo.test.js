import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { createDb } from '../../src/lib/db.js'
import { createRepo, IDLE_CLOSE_MS } from '../../src/lib/repo.js'
import { setRows } from '../../src/lib/export.js'
import { daily } from '../../src/lib/metrics.js'

const L = { sets: 'sets', exercises: 'exercises', volume: 'volume', rest: 'Rest', total: 'total', avg: 'avg', longest: 'longest', autoClosed: 'auto-closed' }
let now, repo, n = 0
const at = ms => { now = ms }
const T0 = new Date(2026, 9, 16, 18, 0).getTime()
const MIN = 60_000

beforeEach(async () => {
  now = T0
  repo = createRepo(createDb(`test-${n++}`), () => now)
  await repo.seedIfEmpty()
})

describe('repo', () => {
  it('seeds once', async () => {
    expect(await repo.seedIfEmpty()).toBe(false)
    expect((await repo.library()).groups).toHaveLength(7)
  })

  it('logs ad-hoc sets with a date and no session', async () => {
    const id = await repo.logSet({ exerciseId: 'halos', groupId: 'kettlebell-supergroup', reps: 10, kg: 16 })
    const row = await repo.db.sets.get(id)
    expect(row).toMatchObject({ date: '2026-10-16', sessionId: null, reps: 10, kg: 16 })
  })

  it('a session collects its sets and rests into a summary, then drops the rests', async () => {
    const s = await repo.startSession()
    at(T0 + 1 * MIN); await repo.logSet({ exerciseId: 'halos', reps: 10, kg: 16 })
    await repo.startRest()
    at(T0 + 2.5 * MIN); await repo.stopRest()
    at(T0 + 3 * MIN); await repo.logSet({ exerciseId: 'halos', reps: 8, kg: 16 })
    at(T0 + 4 * MIN); await repo.logSet({ exerciseId: 'disc-routine', reps: 1, kg: 10 })
    at(T0 + 40 * MIN)
    const closed = await repo.stopSession(L)
    expect(closed.id).toBe(s.id)
    expect(closed.summary).toContain('18:00 → 18:40 · 40m 00s')
    expect(closed.summary).toContain('3 sets · 2 exercises · 298 kg volume')
    expect(closed.summary).toContain('Rest: 1× · 1m 30s total')
    expect(closed.summary).toContain('Halos: 10 @16kg, 8 @16kg')
    expect(await repo.db.rests.count()).toBe(0)
    expect(await repo.activeSession()).toBeNull()
    expect((await repo.db.sessions.get(s.id)).stats).toEqual({ rests: 1, restMs: 1.5 * MIN })
  })

  it('rests outside a session are not kept', async () => {
    await repo.startRest()
    at(T0 + MIN)
    const r = await repo.stopRest()
    expect(r.end - r.start).toBe(MIN)
    expect(await repo.db.rests.count()).toBe(0)
  })

  it('auto-closes a forgotten session at its last activity', async () => {
    await repo.startSession()
    at(T0 + 10 * MIN); await repo.logSet({ exerciseId: 'halos', reps: 10, kg: 16 })
    at(T0 + 10 * MIN + IDLE_CLOSE_MS - 1)
    expect(await repo.autoCloseStale(L)).toBeNull()
    at(T0 + 10 * MIN + IDLE_CLOSE_MS)
    const closed = await repo.autoCloseStale(L)
    expect(closed.end).toBe(T0 + 10 * MIN)
    expect(closed.summary).toContain('auto-closed')
  })

  it('archives exercises with history and removes them from groups', async () => {
    await repo.logSet({ exerciseId: 'halos', reps: 10, kg: 16 })
    await repo.deleteExercise('halos')
    await repo.deleteExercise('upright-row')
    expect((await repo.db.exercises.get('halos')).archived).toBe(true)
    expect(await repo.db.exercises.get('upright-row')).toBeUndefined()
    const kb = await repo.db.groups.get('kettlebell-supergroup')
    expect(kb.exerciseIds).not.toContain('halos')
    expect(kb.exerciseIds).toHaveLength(10)
  })

  it('backup restores to an identical store', async () => {
    await repo.startSession()
    await repo.logSet({ exerciseId: 'halos', reps: 10, kg: 16 })
    await repo.addNote('  felt strong  ')
    const file = await repo.backup({ userName: 'A' })
    const other = createRepo(createDb(`test-${n++}`), () => now)
    expect(await other.restore(JSON.parse(JSON.stringify(file)))).toEqual({ userName: 'A' })
    expect((await other.backup({ userName: 'A' }))).toEqual(file)
    expect((await other.db.notes.toArray())[0].text).toBe('felt strong')
  })

  it('exports flat rows with set numbers per day and exercise', async () => {
    await repo.logSet({ exerciseId: 'halos', groupId: 'kettlebell-supergroup', reps: 10, kg: 16 })
    at(T0 + MIN); await repo.logSet({ exerciseId: 'halos', groupId: 'kettlebell-supergroup', reps: 9, kg: 16 })
    at(T0 + 24 * 60 * MIN); await repo.logSet({ exerciseId: 'halos', reps: 10, kg: 20 })
    const data = await repo.exportData()
    const rows = setRows(data.sets, data)
    expect(rows.map(r => [r.date, r.set_no, r.volume_kg])).toEqual([['2026-10-16', 1, 160], ['2026-10-16', 2, 144], ['2026-10-17', 1, 200]])
    expect(rows[0]).toMatchObject({ exercise: 'Halos', group: 'Kettlebell Supergroup', time: '18:00' })
    expect(daily(data.sets).map(d => [d.date, d.volume, d.maxKg])).toEqual([['2026-10-16', 304, 16], ['2026-10-17', 200, 20]])
  })
})

describe('activities', () => {
  it('seeds the defaults on a fresh database', async () => {
    expect((await repo.db.activities.toArray()).map(a => a.name)).toEqual(['Gym Bike', 'Rowing', 'Running'])
  })

  it('logs running from duration and pace, lands in the session summary and the backup', async () => {
    const s = await repo.startSession()
    at(T0 + 5 * MIN)
    const id = await repo.logActivity({ activityId: 'running', minutes: 30, pace: "6'", notes: ' easy ' })
    expect(await repo.db.activityLogs.get(id)).toMatchObject({ minutes: 30, km: 5, sessionId: s.id, date: '2026-10-16', notes: 'easy' })
    expect(await repo.logActivity({ activityId: 'running', pace: '6' })).toBeNull()
    at(T0 + 40 * MIN)
    const closed = await repo.stopSession({ ...L, activities: 'activities' })
    expect(closed.summary).toContain('0 sets · 0 exercises · 1 activities')
    expect(closed.summary).toContain('Running: 30 min · 5 km · 6:00/km (easy)')
    const file = await repo.backup()
    expect(file.activityLogs).toHaveLength(1)
    expect(file.activities.map(a => a.id)).toContain('running')
  })

  it('reuses an activity by name, creates new ones, archives used ones on delete', async () => {
    expect((await repo.ensureActivity('  running ')).id).toBe('running')
    const swim = await repo.ensureActivity('Swimming')
    expect(swim).toEqual({ id: 'swimming', name: 'Swimming', archived: false })
    await repo.logActivity({ activityId: 'swimming', minutes: 40 })
    await repo.deleteActivity('swimming')
    await repo.deleteActivity('rowing')
    expect((await repo.db.activities.get('swimming')).archived).toBe(true)
    expect(await repo.db.activities.get('rowing')).toBeUndefined()
    expect((await repo.ensureActivity('swimming')).archived).toBe(false)
  })

  it('restores a v1 backup with the default activities', async () => {
    const v1 = { format: 'exercise-tracker/backup', version: 1, exercises: [], groups: [], sets: [], sessions: [], notes: [] }
    await repo.restore(v1)
    expect(await repo.db.activities.count()).toBe(3)
    expect(await repo.db.activityLogs.count()).toBe(0)
  })
})

describe('upgrade from v1', () => {
  it('keeps existing data and adds the default activities', async () => {
    const { default: Dexie } = await import('dexie')
    const name = `upgrade-${n++}`
    const v1 = new Dexie(name)
    v1.version(1).stores({ exercises: 'id, name', groups: 'id, order', sets: '++id, ts, date, exerciseId, sessionId, [exerciseId+date]', sessions: 'id, start', rests: '++id, sessionId, start', notes: '++id, ts, date, sessionId' })
    await v1.sets.add({ ts: T0, date: '2026-10-16', exerciseId: 'halos', reps: 10, kg: 16 })
    v1.close()
    const db = createDb(name)
    expect(await db.sets.count()).toBe(1)
    expect((await db.activities.toArray()).map(a => a.id)).toEqual(['gym-bike', 'rowing', 'running'])
  })
})

describe('upgrade to v3', () => {
  it('appends the classic groups to an existing library without touching the user\'s', async () => {
    const { default: Dexie } = await import('dexie')
    const name = `v3-${n++}`
    const v2 = new Dexie(name)
    v2.version(1).stores({ exercises: 'id, name', groups: 'id, order', sets: '++id, ts, date, exerciseId, sessionId, [exerciseId+date]', sessions: 'id, start', rests: '++id, sessionId, start', notes: '++id, ts, date, sessionId' })
    v2.version(2).stores({ activities: 'id, name', activityLogs: '++id, ts, date, activityId, sessionId' })
    await v2.exercises.bulkAdd([
      { id: 'halos', name: 'Halos', type: 'reps', sets: 5, reps: 10, kg: 16 },
      { id: 'plank', name: 'Plank', type: 'time', sets: 4, seconds: 90, kg: null }, // the user's own plank
    ])
    await v2.groups.add({ id: 'mine', name: 'Mine', order: 0, exerciseIds: ['halos', 'plank'] })
    v2.close()

    const db = createDb(name)
    const groups = await db.groups.orderBy('order').toArray()
    expect(groups.map(g => g.name)).toEqual(['Mine', 'Biceps', 'Triceps', 'Shoulders', 'Leg Day', 'Core'])
    expect(groups[0].exerciseIds).toEqual(['halos', 'plank'])
    expect((await db.exercises.get('plank')).seconds).toBe(90)
    expect(groups.at(-1).exerciseIds[0]).toBe('plank')
    expect(await db.exercises.get('dips')).toMatchObject({ name: 'Dips', reps: 10, kg: null })
  })

  it('a fresh install seeds all seven groups once', async () => {
    const groups = (await repo.library()).groups
    expect(groups.map(g => g.name)).toEqual(['Kettlebell Supergroup', 'My Warm up Routine', 'Biceps', 'Triceps', 'Shoulders', 'Leg Day', 'Core'])
  })
})
