import { normalizeConfig, mergeConfig, exportConfig, cleanExercise, BACKUP_FORMAT } from './config.js'
import { buildSummary } from './summary.js'
import { seedConfig } from './seed.js'
import { dateKey, uid, slugify } from './time.js'

export const IDLE_CLOSE_MS = 2 * 60 * 60 * 1000

/** All operations on the store, bound to one Dexie instance so tests can use their own. */
export const createRepo = (db, clock = () => Date.now()) => {
  const library = async () => ({ exercises: await db.exercises.toArray(), groups: await db.groups.orderBy('order').toArray() })

  const writeLibrary = ({ exercises, groups }) =>
    db.transaction('rw', db.exercises, db.groups, async () => {
      await db.exercises.bulkPut(exercises)
      await db.groups.clear()
      await db.groups.bulkPut(groups.map((g, i) => ({ ...g, order: i })))
    })

  const activeSession = async () =>
    (await db.sessions.orderBy('start').reverse().limit(5).toArray()).find(s => !s.end) ?? null

  const activeRest = async () => (await db.rests.orderBy('start').reverse().first()) ?? null

  async function seedIfEmpty() {
    if ((await db.groups.count()) || (await db.exercises.count())) return false
    const { exercises, groups } = normalizeConfig(seedConfig)
    await writeLibrary({ exercises, groups })
    return true
  }

  async function logSet({ exerciseId, groupId = null, reps = null, seconds = null, kg = null }) {
    const ts = clock()
    const session = await activeSession()
    return db.sets.add({ ts, date: dateKey(ts), exerciseId, groupId, sessionId: session?.id ?? null, reps, seconds, kg })
  }

  const updateSet = (id, patch) => db.sets.update(id, patch)
  const deleteSet = id => db.sets.delete(id)
  const restoreSet = row => db.sets.put(row)

  async function startSession() {
    const open = await activeSession()
    if (open) return open
    const session = { id: uid(), start: clock(), end: null, auto: false, summary: '' }
    await db.sessions.add(session)
    return session
  }

  async function stopSession(L, { end = clock(), auto = false } = {}) {
    const session = await activeSession()
    if (!session) return null
    const rest = await activeRest()
    if (rest && !rest.end) await db.rests.update(rest.id, { end: Math.min(end, clock()) })
    const [sets, rests, exercises] = await Promise.all([
      db.sets.where('sessionId').equals(session.id).toArray(),
      db.rests.where('sessionId').equals(session.id).toArray(),
      db.exercises.toArray(),
    ])
    const closed = { ...session, end, auto }
    closed.summary = buildSummary({ session: closed, sets, rests, exercisesById: Object.fromEntries(exercises.map(e => [e.id, e])), L })
    await db.transaction('rw', db.sessions, db.rests, async () => {
      await db.sessions.put(closed)
      await db.rests.where('sessionId').equals(session.id).delete()
    })
    return closed
  }

  /** A session left running is closed at its last activity once it has been idle for two hours. */
  async function autoCloseStale(L, idle = IDLE_CLOSE_MS) {
    const session = await activeSession()
    if (!session) return null
    const lastSet = await db.sets.where('sessionId').equals(session.id).reverse().sortBy('ts').then(a => a[0])
    const lastRest = await activeRest()
    const last = Math.max(session.start, lastSet?.ts ?? 0, lastRest?.end ?? lastRest?.start ?? 0)
    if (clock() - last < idle) return null
    return stopSession(L, { end: last, auto: true })
  }

  async function startRest() {
    const open = await activeRest()
    if (open && !open.end) return open
    const session = await activeSession()
    const rest = { sessionId: session?.id ?? null, start: clock(), end: null }
    rest.id = await db.rests.add(rest)
    return rest
  }

  /** Returns the rest just ended. Outside a session it is not kept at all. */
  async function stopRest() {
    const rest = await activeRest()
    if (!rest || rest.end) return null
    const done = { ...rest, end: clock() }
    if (done.sessionId) await db.rests.put(done)
    else await db.rests.delete(rest.id)
    return done
  }

  async function addNote(text) {
    const ts = clock()
    const session = await activeSession()
    return db.notes.add({ ts, date: dateKey(ts), sessionId: session?.id ?? null, text: text.trim() })
  }
  const updateNote = (id, text) => db.notes.update(id, { text: text.trim() })
  const deleteNote = id => db.notes.delete(id)

  async function saveExercise(raw) {
    const known = await db.exercises.toArray()
    const taken = new Set(known.map(e => e.id))
    let id = raw.id
    if (!id) { id = slugify(raw.name); let n = 2; while (taken.has(id)) id = `${slugify(raw.name)}-${n++}` }
    const ex = cleanExercise({ ...raw, archived: false }, id)
    await db.exercises.put(ex)
    return ex
  }

  /** Exercises with history are archived so old sets keep their name; unused ones go. */
  async function deleteExercise(id) {
    await db.transaction('rw', db.exercises, db.groups, db.sets, async () => {
      const used = await db.sets.where('exerciseId').equals(id).count()
      if (used) await db.exercises.update(id, { archived: true })
      else await db.exercises.delete(id)
      await db.groups.toCollection().modify(g => { g.exerciseIds = g.exerciseIds.filter(x => x !== id) })
    })
  }

  async function saveGroup(group) {
    const groups = await db.groups.orderBy('order').toArray()
    const id = group.id ?? (() => {
      const taken = new Set(groups.map(g => g.id))
      let base = slugify(group.name), x = base, n = 2
      while (taken.has(x)) x = `${base}-${n++}`
      return x
    })()
    const order = group.order ?? groups.find(g => g.id === id)?.order ?? groups.length
    const saved = { exerciseIds: [], ...group, id, order }
    await db.groups.put(saved)
    return saved
  }

  const deleteGroup = id => db.groups.delete(id)

  async function moveGroup(id, delta) {
    const groups = await db.groups.orderBy('order').toArray()
    const i = groups.findIndex(g => g.id === id), j = i + delta
    if (i < 0 || j < 0 || j >= groups.length) return
    ;[groups[i], groups[j]] = [groups[j], groups[i]]
    await db.groups.bulkPut(groups.map((g, k) => ({ ...g, order: k })))
  }

  async function importConfig(json, mode = 'merge') {
    const current = await library()
    const incoming = normalizeConfig(json, current.exercises)
    await writeLibrary(mergeConfig(current, incoming, mode))
    return incoming
  }

  const configFile = async () => exportConfig(await library())

  async function backup(settings = {}) {
    const [lib, sets, sessions, notes] = await Promise.all([library(), db.sets.toArray(), db.sessions.toArray(), db.notes.toArray()])
    return { format: BACKUP_FORMAT, version: 1, exportedAt: new Date(clock()).toISOString(), settings, ...lib, sets, sessions, notes }
  }

  async function restore(json) {
    if (json?.format !== BACKUP_FORMAT) throw new Error('Not a full backup file')
    await db.transaction('rw', [db.exercises, db.groups, db.sets, db.sessions, db.rests, db.notes], async () => {
      await Promise.all([db.exercises, db.groups, db.sets, db.sessions, db.rests, db.notes].map(t => t.clear()))
      await db.exercises.bulkPut(json.exercises ?? [])
      await db.groups.bulkPut(json.groups ?? [])
      await db.sets.bulkPut(json.sets ?? [])
      await db.sessions.bulkPut(json.sessions ?? [])
      await db.notes.bulkPut(json.notes ?? [])
    })
    return json.settings ?? {}
  }

  async function exportData() {
    const [lib, sets, sessions, notes] = await Promise.all([library(), db.sets.toArray(), db.sessions.toArray(), db.notes.toArray()])
    return { ...lib, sets, sessions, notes }
  }

  return {
    db, library, seedIfEmpty, logSet, updateSet, deleteSet, restoreSet,
    activeSession, startSession, stopSession, autoCloseStale,
    activeRest, startRest, stopRest, addNote, updateNote, deleteNote,
    saveExercise, deleteExercise, saveGroup, deleteGroup, moveGroup,
    importConfig, configFile, backup, restore, exportData,
  }
}
