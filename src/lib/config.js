import { slugify } from './time.js'

export const CONFIG_FORMAT = 'exercise-tracker/config'
export const BACKUP_FORMAT = 'exercise-tracker/backup'

const num = v => (v === '' || v == null || !Number.isFinite(+v) || +v < 0 ? null : +v)
const str = v => (v == null ? '' : String(v).trim())

/** One exercise, every field present and typed. `kg` null means bodyweight. */
export const cleanExercise = (raw, id = raw.id) => {
  const type = raw.type === 'time' || (raw.type == null && raw.seconds != null && raw.reps == null) ? 'time' : 'reps'
  return {
    id,
    name: str(raw.name),
    type,
    sets: Math.max(1, Math.round(num(raw.sets) ?? 1)),
    reps: type === 'reps' ? num(raw.reps) ?? 1 : null,
    seconds: type === 'time' ? num(raw.seconds) ?? 30 : null,
    kg: num(raw.kg),
    perSide: !!raw.perSide,
    desc: str(raw.desc),
    link: str(raw.link),
    archived: !!raw.archived,
    ...(Array.isArray(raw.muscles) ? { muscles: raw.muscles.filter(m => typeof m === 'string') } : {}),
  }
}

const uniqueId = (base, taken) => {
  let id = base, n = 2
  while (taken.has(id)) id = `${base}-${n++}`
  taken.add(id)
  return id
}

/**
 * Turn a hand-written config into a normalized library + groups.
 * Group entries may be an exercise id, an exercise name, or a full exercise object;
 * the same exercise named in two groups resolves to one exercise (one history).
 * `known` is the current library, so imports can reference exercises already on the phone.
 */
export function normalizeConfig(input, known = []) {
  if (!input || typeof input !== 'object') throw new Error('Not a config object')
  if (input.format && input.format !== CONFIG_FORMAT) throw new Error(`Unexpected format: ${input.format}`)
  if (!Array.isArray(input.groups)) throw new Error('Config needs a "groups" array')

  const warnings = []
  const byId = new Map(known.map(e => [e.id, e]))
  const lower = s => str(s).toLowerCase()
  const taken = new Set(byId.keys())
  const out = new Map()
  const findByName = name =>
    [...out.values()].find(e => lower(e.name) === lower(name)) ?? known.find(e => lower(e.name) === lower(name))

  const resolve = raw => {
    if (typeof raw === 'string') {
      const hit = out.get(raw) ?? byId.get(raw) ?? findByName(raw)
      if (!hit) { warnings.push(`Unknown exercise "${raw}" skipped`); return undefined }
      if (!out.has(hit.id)) out.set(hit.id, hit)
      return hit.id
    }
    if (!str(raw?.name) && !raw?.id) { warnings.push('Exercise without a name skipped'); return undefined }
    const prior = (raw.id && (out.get(raw.id) ?? byId.get(raw.id))) || findByName(raw.name)
    const id = prior?.id ?? uniqueId(raw.id ? str(raw.id) : slugify(raw.name), taken)
    out.set(id, cleanExercise({ ...prior, ...raw }, id))
    return id
  }

  ;(input.exercises ?? []).forEach(resolve)
  const groupTaken = new Set()
  const groups = input.groups.map((g, i) => ({
    id: uniqueId(str(g.id) || slugify(g.name || `group-${i + 1}`), groupTaken),
    name: str(g.name) || `Group ${i + 1}`,
    order: i,
    exerciseIds: [...new Set((g.exercises ?? []).map(resolve).filter(Boolean))],
  }))
  return { exercises: [...out.values()], groups, warnings }
}

/**
 * Combine current state with an imported config.
 * merge: upsert exercises and groups by id, keep everything else.
 * replace: groups become exactly the imported ones; exercises not imported are archived,
 * never deleted, because logged sets point at them.
 */
export function mergeConfig(current, incoming, mode = 'merge') {
  const exercises = new Map(current.exercises.map(e => [e.id, e]))
  incoming.exercises.forEach(e => exercises.set(e.id, { ...e, archived: false }))
  if (mode === 'replace') {
    const keep = new Set(incoming.exercises.map(e => e.id))
    exercises.forEach((e, id) => !keep.has(id) && exercises.set(id, { ...e, archived: true }))
    return { exercises: [...exercises.values()], groups: incoming.groups }
  }
  const groups = new Map(current.groups.map(g => [g.id, g]))
  const base = current.groups.length
  incoming.groups.forEach((g, i) => groups.set(g.id, { ...g, order: groups.get(g.id)?.order ?? base + i }))
  return { exercises: [...exercises.values()], groups: [...groups.values()].sort((a, b) => a.order - b.order) }
}

const compact = ({ archived, ...e }) =>
  Object.fromEntries(Object.entries(e).filter(([k, v]) => v !== null && v !== '' && !(k === 'perSide' && !v) && !(k === 'muscles' && !v.length)))

/** Config file for editing on a computer: library first, groups reference exercise ids. */
export const exportConfig = ({ exercises, groups }) => ({
  format: CONFIG_FORMAT,
  version: 1,
  exercises: exercises.filter(e => !e.archived).map(compact),
  groups: [...groups].sort((a, b) => a.order - b.order).map(g => ({ id: g.id, name: g.name, exercises: g.exerciseIds })),
})
