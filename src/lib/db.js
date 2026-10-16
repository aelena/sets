import Dexie from 'dexie'

/**
 * Everything lives on the device, in IndexedDB.
 * Timestamps are epoch ms; `date` is the local YYYY-MM-DD the row belongs to.
 *   exercises  library; groups reference them by id, logs never lose them (archived, not deleted)
 *   groups     { id, name, order, exerciseIds[] }
 *   sets       one row per logged set { ts, date, exerciseId, groupId, sessionId, reps|seconds, kg }
 *   sessions   { id, start, end, auto, summary }; end null while running
 *   rests      transient: kept only while their session runs, folded into its summary on stop
 *   notes      { ts, date, sessionId, text }
 */
export const createDb = (name = 'exercise-tracker') => {
  const db = new Dexie(name)
  db.version(1).stores({
    exercises: 'id, name',
    groups: 'id, order',
    sets: '++id, ts, date, exerciseId, sessionId, [exerciseId+date]',
    sessions: 'id, start',
    rests: '++id, sessionId, start',
    notes: '++id, ts, date, sessionId',
  })
  return db
}
