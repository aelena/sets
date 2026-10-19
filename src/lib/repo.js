import { normalizeConfig, mergeConfig, exportConfig, cleanExercise, BACKUP_FORMAT } from './config.js'
import { buildSummary } from './summary.js'
import { PACKS, CATALOG_MUSCLES } from './seed.js'
import { planPack, missingMuscles, missingNames, planCuration } from './packs.js'
import { ES_EXERCISES, ES_GROUPS, ES_ACTIVITIES } from './catalog.js'
import { dateKey, uid, slugify } from './time.js'
import { resolve, DEFAULT_ACTIVITIES } from './activity.js'

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

  /**
   * Add every built-in pack this phone has not had yet, then fill muscles where an exercise has none.
   * Add-only: whatever the user created, edited or removed stays as it is. Returns the ids applied now.
   */
  async function applyPacks(packs = PACKS) {
    return db.transaction('rw', [db.exercises, db.groups, db.meta, db.sets, db.activities], async () => {
      const applied = new Set((await db.meta.get('packs'))?.applied ?? [])
      const now = []
      for (const pack of packs.filter(p => !applied.has(p.id))) {
        const exercises = await db.exercises.toArray(), groups = await db.groups.orderBy('order').toArray()
        if (pack.kind === 'curate') {
          const setCounts = {}
          for (const m of pack.merges ?? []) setCounts[m.from] = await db.sets.where('exerciseId').equals(m.from).count()
          const plan = planCuration(pack, { exercises, groups, setCounts })
          for (const { id, changes } of plan.exerciseUpdates) await db.exercises.update(id, changes)
          for (const { id, changes } of plan.groupUpdates) await db.groups.update(id, changes)
          for (const { id, exerciseIds } of plan.regroup) await db.groups.update(id, { exerciseIds })
          for (const id of plan.archive) await db.exercises.update(id, { archived: true })
        } else {
          const { addExercises, addGroups } = planPack(pack, { exercises, groups })
          await db.exercises.bulkAdd(addExercises)
          await db.groups.bulkAdd(addGroups)
        }
        applied.add(pack.id)
        now.push(pack.id)
      }
      // fill-only: muscles and Spanish names where missing, never replacing what is there
      for (const { id, muscles } of missingMuscles(await db.exercises.toArray(), CATALOG_MUSCLES)) await db.exercises.update(id, { muscles })
      for (const { id, names } of missingNames(await db.exercises.toArray(), ES_EXERCISES)) await db.exercises.update(id, { names })
      for (const { id, names } of missingNames(await db.groups.toArray(), ES_GROUPS)) await db.groups.update(id, { names })
      for (const { id, names } of missingNames(await db.activities.toArray(), ES_ACTIVITIES)) await db.activities.update(id, { names })
      await db.meta.put({ key: 'packs', applied: [...applied] })
      return now
    })
  }
  const seedIfEmpty = async () => (await applyPacks()).includes('base-1')

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
    const [sets, rests, exercises, activityLogs, activities] = await Promise.all([
      db.sets.where('sessionId').equals(session.id).toArray(),
      db.rests.where('sessionId').equals(session.id).toArray(),
      db.exercises.toArray(),
      db.activityLogs.where('sessionId').equals(session.id).toArray(),
      db.activities.toArray(),
    ])
    const done = rests.filter(r => r.end)
    // rests are dropped below; their count and time survive here for the recap image
    const closed = { ...session, end, auto, stats: { rests: done.length, restMs: done.reduce((a, r) => a + r.end - r.start, 0) } }
    closed.summary = buildSummary({
      session: closed, sets, rests, L, activityLogs,
      exercisesById: Object.fromEntries(exercises.map(e => [e.id, e])),
      activitiesById: Object.fromEntries(activities.map(a => [a.id, a])),
    })
    await db.transaction('rw', db.sessions, db.rests, async () => {
      await db.sessions.put(closed)
      await db.rests.where('sessionId').equals(session.id).delete()
    })
    return closed
  }

  /** Sets, activities and notes logged outside any session: what "Complete" files into its day's untimed session. */
  async function pendingAdHoc() {
    const loose = t => t.filter(r => !r.sessionId).toArray()
    const [sets, activityLogs, notes] = await Promise.all([loose(db.sets), loose(db.activityLogs), loose(db.notes)])
    return { sets, activityLogs, notes, days: [...new Set([...sets, ...activityLogs].map(r => r.date))].sort() }
  }

  /**
   * Untimed sessions are one per day and live alongside any timed session that day. Each loose
   * row joins the untimed session of its own day (created when missing, extended when there is
   * one already), whose summary is then rebuilt from everything in it. Rows are only linked,
   * never copied or changed otherwise. Returns the sessions touched, oldest day first.
   */
  async function completeAdHoc(L, { before } = {}) {
    const pending = await pendingAdHoc()
    const { sets, activityLogs, notes } = pending
    const days = before ? pending.days.filter(d => d < before) : pending.days
    if (!days.length) return []
    const [exercises, activities, sessions] = await Promise.all([db.exercises.toArray(), db.activities.toArray(), db.sessions.toArray()])
    const exercisesById = Object.fromEntries(exercises.map(e => [e.id, e]))
    const activitiesById = Object.fromEntries(activities.map(a => [a.id, a]))
    const touched = []
    await db.transaction('rw', db.sessions, db.sets, db.activityLogs, db.notes, async () => {
      for (const day of days) {
        let session = sessions.find(x => x.untimed && dateKey(x.start) === day)
        if (!session) {
          session = { id: uid(), start: null, end: null, auto: false, untimed: true, stats: { rests: 0, restMs: 0 } }
          await db.sessions.add(session)
        }
        const link = (t, rows) => Promise.all(rows.filter(r => r.date === day).map(r => t.update(r.id, { sessionId: session.id })))
        await link(db.sets, sets)
        await link(db.activityLogs, activityLogs)
        await link(db.notes, notes)
        const [mySets, myLogs] = await Promise.all([
          db.sets.where('sessionId').equals(session.id).toArray(), db.activityLogs.where('sessionId').equals(session.id).toArray(),
        ])
        const ts = [...mySets, ...myLogs].map(r => r.ts)
        const updated = { ...session, start: Math.min(...ts), end: Math.max(...ts) }
        updated.summary = buildSummary({ session: updated, sets: mySets, rests: [], L, activityLogs: myLogs, exercisesById, activitiesById })
        await db.sessions.put(updated)
        touched.push(updated)
      }
    })
    return touched
  }

  /** A session left running is closed at its last activity once it has been idle for two hours. */
  async function autoCloseStale(L, idle = IDLE_CLOSE_MS) {
    const session = await activeSession()
    if (!session) return null
    const lastSet = await db.sets.where('sessionId').equals(session.id).reverse().sortBy('ts').then(a => a[0])
    const lastRest = await activeRest()
    const lastActivity = await db.activityLogs.where('sessionId').equals(session.id).reverse().sortBy('ts').then(a => a[0])
    const last = Math.max(session.start, lastSet?.ts ?? 0, lastActivity?.ts ?? 0, lastRest?.end ?? lastRest?.start ?? 0)
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

  /** An activity by name: the existing one (case-insensitive, un-archived if needed) or a new one. */
  async function ensureActivity(name) {
    const clean = name.trim()
    const all = await db.activities.toArray()
    const hit = all.find(a => a.name.toLowerCase() === clean.toLowerCase())
    if (hit) { if (hit.archived) await db.activities.update(hit.id, { archived: false }); return { ...hit, archived: false } }
    const taken = new Set(all.map(a => a.id))
    let id = slugify(clean), n = 2
    while (taken.has(id)) id = `${slugify(clean)}-${n++}`
    const activity = { id, name: clean, archived: false }
    await db.activities.add(activity)
    return activity
  }

  /** Any two of minutes / km / pace; the third is derived. Returns the new log's id, or null when nothing was measured. */
  async function logActivity({ activityId, minutes, km, pace, notes = '' }) {
    const values = resolve({ minutes, km, pace })
    if (values.minutes == null && values.km == null) return null
    const ts = clock()
    const session = await activeSession()
    return db.activityLogs.add({ ts, date: dateKey(ts), activityId, sessionId: session?.id ?? null, ...values, notes: notes.trim() })
  }
  const updateActivityLog = (id, { minutes, km, pace, notes = '' }) => db.activityLogs.update(id, { ...resolve({ minutes, km, pace }), notes: notes.trim() })
  const deleteActivityLog = id => db.activityLogs.delete(id)
  const restoreActivityLog = row => db.activityLogs.put(row)
  const renameActivity = async (id, name, es) => {
    if (!name?.trim()) return
    const a = await db.activities.get(id)
    await db.activities.update(id, { name: name.trim(), ...(es === undefined ? {} : { names: { ...a?.names, es: es.trim() } }) })
  }

  /** Like exercises: archived when it has history, deleted otherwise. */
  async function deleteActivity(id) {
    const used = await db.activityLogs.where('activityId').equals(id).count()
    return used ? db.activities.update(id, { archived: true }) : db.activities.delete(id)
  }

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

  const everything = async () => {
    const [lib, sets, sessions, notes, activities, activityLogs] = await Promise.all([
      library(), db.sets.toArray(), db.sessions.toArray(), db.notes.toArray(), db.activities.toArray(), db.activityLogs.toArray(),
    ])
    const packs = (await db.meta.get('packs'))?.applied ?? []
    return { ...lib, sets, sessions, notes, activities, activityLogs, packs }
  }

  async function backup(settings = {}) {
    return { format: BACKUP_FORMAT, version: 2, exportedAt: new Date(clock()).toISOString(), settings, ...(await everything()) }
  }

  async function restore(json) {
    if (json?.format !== BACKUP_FORMAT) throw new Error('Not a full backup file')
    const tables = [db.exercises, db.groups, db.sets, db.sessions, db.rests, db.notes, db.activities, db.activityLogs, db.meta]
    await db.transaction('rw', tables, async () => {
      await Promise.all(tables.map(t => t.clear()))
      await db.exercises.bulkPut(json.exercises ?? [])
      await db.groups.bulkPut(json.groups ?? [])
      await db.sets.bulkPut(json.sets ?? [])
      await db.sessions.bulkPut(json.sessions ?? [])
      await db.notes.bulkPut(json.notes ?? [])
      // v1 backups predate activities: keep the defaults rather than an empty list
      await db.activities.bulkPut(json.activities ?? DEFAULT_ACTIVITIES)
      await db.activityLogs.bulkPut(json.activityLogs ?? [])
      // the backup is the user's library as they left it: no built-in pack is re-added on top
      // backups made before packs were tracked: only the packs of that time count as applied
      await db.meta.put({ key: 'packs', applied: json.packs ?? ['base-1', 'classic-1'] })
    })
    return json.settings ?? {}
  }

  const exportData = everything

  /** One session's raw data, self-contained (names resolved), for Drive or Files. */
  async function sessionExport(id) {
    const session = await db.sessions.get(id)
    if (!session) return null
    const [sets, activityLogs, notes, exercises, activities, groups] = await Promise.all([
      db.sets.where('sessionId').equals(id).sortBy('ts'), db.activityLogs.where('sessionId').equals(id).sortBy('ts'),
      db.notes.where('sessionId').equals(id).sortBy('ts'), db.exercises.toArray(), db.activities.toArray(), db.groups.toArray(),
    ])
    const name = (list, key) => Object.fromEntries(list.map(x => [x.id, x.name]))[key] ?? key
    const iso = ts => new Date(ts).toISOString()
    return {
      format: 'sets/session', version: 1, exportedAt: iso(clock()),
      session: {
        id: session.id, start: iso(session.start), end: session.end ? iso(session.end) : null,
        minutes: session.end && !session.untimed ? Math.round((session.end - session.start) / 60000) : null, untimed: !!session.untimed,
        auto: !!session.auto, stats: session.stats ?? null, summary: session.summary,
      },
      sets: sets.map(s => ({ time: iso(s.ts), exerciseId: s.exerciseId, exercise: name(exercises, s.exerciseId),
        group: s.groupId ? name(groups, s.groupId) : null, reps: s.reps, seconds: s.seconds, kg: s.kg })),
      activities: activityLogs.map(l => ({ time: iso(l.ts), activity: name(activities, l.activityId), minutes: l.minutes, km: l.km, notes: l.notes })),
      notes: notes.map(n => ({ time: iso(n.ts), text: n.text })),
    }
  }

  return {
    db, library, seedIfEmpty, applyPacks, logSet, updateSet, deleteSet, restoreSet,
    activeSession, startSession, stopSession, autoCloseStale,
    activeRest, startRest, stopRest, addNote, updateNote, deleteNote,
    saveExercise, deleteExercise, saveGroup, deleteGroup, moveGroup,
    importConfig, configFile, backup, restore, exportData,
    sessionExport, pendingAdHoc, completeAdHoc, ensureActivity, logActivity, updateActivityLog, deleteActivityLog, restoreActivityLog, renameActivity, deleteActivity,
  }
}
