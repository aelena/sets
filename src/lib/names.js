/** An exercise, group or activity's name in the UI language, falling back to its main (English) name. */
export const nameOf = (x, lang) => (lang && x?.names?.[lang]) || x?.name || ''

/** Lookup by id, for rows that only carry an id (sets, logs). */
export const nameById = (byId, id, lang) => (byId[id] ? nameOf(byId[id], lang) : id)
