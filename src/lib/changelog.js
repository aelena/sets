/**
 * What changed, newest first: shown once after an update (WhatsNew.svelte). Each release adds its
 * entry here together with the version bump in package.json. Two or three short lines per language.
 */
export const CHANGELOG = [
  {
    version: '0.12.1',
    en: ['Burpees in Functional.', 'Core: lateral crunch (elbow to the opposite knee), scissor kicks, cross scissors.'],
    es: ['Burpees en Funcional.', 'Core: crunch lateral (codo a la rodilla contraria), tijeras, tijeras cruzadas.'],
  },
  {
    version: '0.12.0',
    en: ['This screen: after each update, what changed.'],
    es: ['Esta pantalla: tras cada actualización, qué ha cambiado.'],
  },
  {
    version: '0.11.0',
    en: ['Missing staples added to every main group (incline flyes, EZ curls, Arnold press, rows, hollow hold...).', 'Your Push-up Touch Superseries in the warm-up.', 'Pec Deck now reads "Pectoral Fly (Pec Deck)".'],
    es: ['Básicos que faltaban en cada grupo (aperturas inclinadas, curl con barra Z, press Arnold, remos, hollow...).', 'Tu superserie de flexiones y toques en el calentamiento.', 'La contractora se llama "Pectoral Fly (Pec Deck)".'],
  },
  {
    version: '0.10.1',
    en: ['A bundled run now counts towards the session\'s total time, also on the recap image.'],
    es: ['Una carrera añadida a la sesión cuenta ya en el tiempo total, también en la imagen.'],
  },
  {
    version: '0.10.0',
    en: ['Your Pecho group is the Chest group: built-in chest exercises join it.', 'Your gym additions got proper names, cues and links.'],
    es: ['Tu grupo Pecho es el de pecho: los ejercicios de pecho incluidos se suman a él.', 'Tus nuevos ejercicios del gimnasio tienen nombre, indicaciones y enlace.'],
  },
  {
    version: '0.9.0',
    en: ['Stopwatch in the top bar, digital or analog.', 'A title for the recap image ("Killer day").', 'Chest group; rest only during a session.'],
    es: ['Cronómetro en la barra superior, digital o analógico.', 'Un título para la imagen resumen ("Día bestial").', 'Grupo de pecho; descanso solo durante una sesión.'],
  },
]

/** -1, 0 or 1, comparing "major.minor.patch". */
export function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) < (pb[i] ?? 0) ? -1 : 1
  return 0
}

/** Entries newer than `seen` and not newer than `current`, newest first, at most `max`. */
export const newSince = (seen, current, max = 3) =>
  CHANGELOG.filter(e => compareVersions(e.version, current) <= 0 && (!seen || compareVersions(e.version, seen) > 0)).slice(0, max)
