import { liveQuery } from 'dexie'
import { readable, writable } from 'svelte/store'
import { createDb } from './db.js'
import { createRepo } from './repo.js'

export const db = createDb()
export const repo = createRepo(db)

/** Dexie live queries are Svelte-store compatible: they re-run whenever the tables they read change. */
export const exercises = liveQuery(() => db.exercises.toArray())
export const groups = liveQuery(() => db.groups.orderBy('order').toArray())
export const activeSession = liveQuery(() => repo.activeSession())
export const activeRest = liveQuery(() => repo.activeRest().then(r => (r && !r.end ? r : null)))
export const setCount = liveQuery(() => db.sets.count())
export const completedSessions = liveQuery(() => db.sessions.filter(s => !!s.end).count())
export const activities = liveQuery(() => db.activities.toArray().then(a => a.filter(x => !x.archived).sort((x, y) => x.name.localeCompare(y.name))))
export const activityLogs = liveQuery(() => db.activityLogs.toArray())

/** One clock for every running timer on screen. */
export const now = readable(Date.now(), set => {
  const id = setInterval(() => set(Date.now()), 1000)
  return () => clearInterval(id)
})

/** The session summary on screen after a stop (or an auto-close). */
export const shownSummary = writable(null)

/** Transient message at the bottom of the screen, optionally with an action (Undo). */
export const toast = writable(null)
let timer
export const notify = (text, action = null, ms = 4000) => {
  clearTimeout(timer)
  toast.set({ text, action })
  timer = setTimeout(() => toast.set(null), ms)
}
