import { compact, personalBests } from './history.js'
import { volume } from './summary.js'
import { activityLabel } from './activity.js'
import { nameById, nameOf } from './names.js'

export const FORMATS = { story: [1080, 1920], post: [1080, 1350] }
export const GRADIENTS = {
  ink: ['#111111', '#2b2b2b'],
  blue: ['#1f5fbf', '#0b1e3d'],
  ember: ['#3a1408', '#b4441c'],
}

/**
 * Everything the recap image shows, from one session.
 * `history` is all sets of the exercises involved, so personal bests are judged against the past.
 */
export function recapData({ session, sets, history = sets, exercisesById, activityLogs = [], activitiesById = {}, bestsFromDay, groupsById = {}, lang = 'en' }) {
  const mine = [...sets].sort((a, b) => a.ts - b.ts)
  const order = [...new Set(mine.map(s => s.exerciseId))]
  const bests = new Set(order.flatMap(id => [...personalBests(history.filter(s => s.exerciseId === id), bestsFromDay)]))
  // muscles trained, by number of sets; exercises without muscles count under the group they were logged from
  const tally = new Map()
  const bump = (k, v) => tally.set(k, (tally.get(k) ?? 0) + v)
  for (const s of mine) {
    const ms = exercisesById[s.exerciseId]?.muscles
    if (ms?.length) ms.forEach((m, i) => bump(`mu:${m}`, i === 0 ? 1 : 0.5))
    else if (groupsById[s.groupId]) bump(`group:${nameOf(groupsById[s.groupId], lang)}`, 1)
  }
  const muscles = [...tally].sort((a, b) => b[1] - a[1]).map(([k]) => k)

  return {
    start: session.start,
    end: session.end ?? session.start,
    untimed: !!session.untimed,
    title: session.recapTitle ?? '',
    muscles,
    durationMs: (session.end ?? Date.now()) - session.start,
    sets: mine.length,
    exercises: order.length,
    volume: Math.round(volume(mine)),
    rests: session.stats?.rests ?? 0,
    bests: mine.filter(s => bests.has(s.id)).length,
    lines: order.map(id => {
      const list = mine.filter(s => s.exerciseId === id)
      return { name: nameById(exercisesById, id, lang), detail: compact(list), best: list.some(s => bests.has(s.id)) }
    }).concat([...activityLogs].sort((a, b) => a.ts - b.ts).map(l => (
      { name: nameById(activitiesById, l.activityId, lang), detail: activityLabel(l), best: false }))),
  }
}

/** The flame used for personal bests, on screen and in the image (24×24 viewBox; Lucide "flame", ISC). */
export const FLAME = 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'
