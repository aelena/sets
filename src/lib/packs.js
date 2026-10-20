import { normalizeConfig } from './config.js'
import { slugify } from './time.js'
import { CLASH_LABEL } from './catalog.js'

/**
 * What applying a built-in pack adds to a library. Add-only, by design:
 * - an exercise the user already has (same id or same name) is reused and never changed;
 * - a pack group whose name the user already uses is added next to it as "Name (label)";
 * - nothing is ever deleted, renamed or overwritten.
 */
export function planPack(pack, { exercises, groups }) {
  const incoming = normalizeConfig({ groups: pack.groups }, exercises)
  const have = new Set(exercises.map(e => e.id))
  const addExercises = incoming.exercises.filter(e => !have.has(e.id))

  // `appendTo`: the pack's exercises go at the end of that group (missing ones only); without
  // that group on the phone, the pack's group is added as usual
  const target = pack.appendTo && groups.find(g => g.id === pack.appendTo)
  if (target) {
    const ids = incoming.groups.flatMap(g => g.exerciseIds).filter(id => !target.exerciseIds.includes(id))
    return { addExercises, addGroups: [], append: { id: target.id, exerciseIds: [...target.exerciseIds, ...new Set(ids)] } }
  }

  const takenIds = new Set(groups.map(g => g.id))
  const takenNames = new Set(groups.map(g => g.name.toLowerCase()))
  const addGroups = incoming.groups.map((g, i) => {
    const label = CLASH_LABEL[pack.label] ?? { en: pack.label, es: pack.label }
    let name = g.name, names = g.names, n = 1
    while (takenNames.has(name.toLowerCase())) {
      const k = n === 1 ? '' : ` ${n}`
      n++
      name = `${g.name} (${label.en}${k})`
      if (g.names?.es) names = { ...g.names, es: `${g.names.es} (${label.es}${k})` }
    }
    let n2 = 2
    let id = takenIds.has(g.id) ? slugify(name) : g.id
    while (takenIds.has(id)) id = `${slugify(name)}-${n2++}`
    takenIds.add(id)
    takenNames.add(name.toLowerCase())
    return { ...g, id, name, ...(names ? { names } : {}), order: groups.length + i }
  })
  // `before`: slot the new groups in front of those (e.g. keep Kegels last); later groups move down
  const anchor = pack.before && groups.filter(g => pack.before.includes(g.id)).map(g => g.order)
  if (anchor?.length) {
    const at = Math.min(...anchor)
    addGroups.forEach((g, i) => (g.order = at + i))
    const shift = groups.filter(g => g.order >= at).map(g => ({ id: g.id, order: g.order + addGroups.length }))
    return { addExercises, addGroups, append: null, shift }
  }
  return { addExercises, addGroups, append: null }
}

/**
 * Muscles for exercises that have none yet, matched by name against the built-in catalog.
 * `muscles: []` means the user cleared them on purpose and is left alone.
 */
export const missingMuscles = (exercises, catalog) =>
  exercises.filter(e => e.muscles === undefined && catalog[e.name.toLowerCase()]).map(e => ({ id: e.id, muscles: catalog[e.name.toLowerCase()] }))

const norm = s => String(s ?? '').normalize('NFC').trim().toLowerCase()

/**
 * Spanish names for exercises, groups or activities that have none, by exact English name.
 * Never replaces a name the user wrote.
 */
export const missingNames = (items, es) =>
  items.filter(x => !x.names?.es && es[x.name]).map(x => ({ id: x.id, names: { ...x.names, es: es[x.name] } }))

/**
 * What a curation pack changes: each entry applies only while the item still has its original
 * id and name, so it is a no-op elsewhere and never overrides a later edit. A merge folds a
 * never-used duplicate into the exercise that carries history: group references move, the
 * duplicate is archived. A duplicate with any sets of its own is left alone.
 */
export function planCuration(pack, { exercises, groups, setCounts = {} }) {
  const exById = new Map(exercises.map(e => [e.id, e]))
  const grById = new Map(groups.map(g => [g.id, g]))
  // `exercises`: renames under guard; `fill`: only fields the exercise does not have yet
  const exerciseUpdates = (pack.exercises ?? [])
    .filter(u => exById.has(u.id) && norm(exById.get(u.id).name) === norm(u.from))
    .map(u => ({ id: u.id, changes: u.set }))
  for (const u of pack.fill ?? []) {
    const e = exById.get(u.id)
    if (!e || norm(e.name) !== norm(u.from)) continue
    const changes = Object.fromEntries(Object.entries(u.set).filter(([k]) => !e[k]))
    if (Object.keys(changes).length) exerciseUpdates.push({ id: u.id, changes })
  }
  const groupUpdates = (pack.groups ?? [])
    .filter(u => grById.has(u.id) && norm(grById.get(u.id).name) === norm(u.from))
    .map(u => ({ id: u.id, changes: u.set }))
  const merges = (pack.merges ?? []).filter(m => {
    const from = exById.get(m.from), into = exById.get(m.into)
    return from && into && !from.archived && norm(from.name) === norm(m.fromName) && !(setCounts[m.from] > 0)
  })
  const archive = merges.map(m => m.from)
  const regroup = groups
    .filter(g => merges.some(m => g.exerciseIds.includes(m.from)))
    .map(g => {
      let ids = g.exerciseIds
      for (const m of merges) ids = ids.map(x => (x === m.from ? m.into : x))
      return { id: g.id, exerciseIds: [...new Set(ids)] }
    })
  return { exerciseUpdates, groupUpdates, archive, regroup }
}
