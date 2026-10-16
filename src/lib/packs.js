import { normalizeConfig } from './config.js'
import { slugify } from './time.js'

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

  const takenIds = new Set(groups.map(g => g.id))
  const takenNames = new Set(groups.map(g => g.name.toLowerCase()))
  const addGroups = incoming.groups.map((g, i) => {
    let name = g.name
    if (takenNames.has(name.toLowerCase())) name = `${g.name} (${pack.label})`
    let n = 2
    while (takenNames.has(name.toLowerCase())) name = `${g.name} (${pack.label} ${n++})`
    let id = takenIds.has(g.id) ? slugify(name) : g.id
    n = 2
    while (takenIds.has(id)) id = `${slugify(name)}-${n++}`
    takenIds.add(id)
    takenNames.add(name.toLowerCase())
    return { ...g, id, name, order: groups.length + i }
  })
  return { addExercises, addGroups }
}

/**
 * Muscles for exercises that have none yet, matched by name against the built-in catalog.
 * `muscles: []` means the user cleared them on purpose and is left alone.
 */
export const missingMuscles = (exercises, catalog) =>
  exercises.filter(e => e.muscles === undefined && catalog[e.name.toLowerCase()]).map(e => ({ id: e.id, muscles: catalog[e.name.toLowerCase()] }))
