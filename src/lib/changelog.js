/**
 * What changed, newest first: shown once after an update (WhatsNew.svelte). Each release adds its
 * entry here together with the version bump in package.json. Two or three short lines per language.
 */
export const CHANGELOG = [
  {
    version: '0.17.0',
    en: ['Cardio & more → Import a run (GPX): the run your watch or running app recorded, with its distance, moving time, pace, climb and route; it joins the day\'s session and the recap image draws the route.', 'Sets still tracks nothing itself: no GPS, no screen kept on.'],
    es: ['Cardio y más → Importar carrera (GPX): la carrera que grabó el reloj o la app de correr, con distancia, tiempo en movimiento, ritmo, desnivel y recorrido; se une a la sesión del día y la imagen resumen dibuja el recorrido.', 'Sets sigue sin registrar nada por sí mismo: ni GPS ni pantalla encendida.'],
  },
  {
    version: '0.16.0',
    en: ['Lifts per rep: compound moves (3-phase supercurl ×3, arm superseries ×3, disc routine ×10) now count every lift in the kg totals; set it on any exercise in Edit.', 'Zottman Curl in Biceps, Divergent Shoulder Press in Shoulders; your curl-to-overhead, hammer-twist curl and narrow-bar pulldown named; the two seated rows stay apart.'],
    es: ['Levantamientos por rep: los movimientos compuestos (supercurl en 3 fases ×3, superserie de brazos ×3, rutina con disco ×10) cuentan ya cada levantamiento en los totales de kg; ajústalo en cualquier ejercicio desde Editar.', 'Curl Zottman en Bíceps, press de hombros divergente en Hombros; tu curl con elevación vertical, el curl con giro a martillo y el jalón con barra estrecha tienen nombre; los dos remos sentados siguen separados.'],
  },
  {
    version: '0.15.1',
    en: ['Your overhand curl that ends pressing the bar overhead is "Reverse Curl and Press" (it was read as a shrug).'],
    es: ['Tu curl prono que acaba empujando la barra sobre la cabeza es "Curl inverso y press sobre la cabeza" (se había leído como encogimiento).'],
  },
  {
    version: '0.15.0',
    en: ['Two new groups before the Kegels: Bodyweight (the seven-column chart) and Military Calisthenics (the 28- and 30-day challenges).', 'Kegels · Men and · Women: the pelvic-floor posters, bird dog to child\'s pose.', 'Every target now has at least 4 sets; your hand-made exercises got names in both languages and cues.'],
    es: ['Dos grupos nuevos antes de los Kegel: Peso corporal (la tabla de siete columnas) y Calistenia militar (los retos de 28 y 30 días).', 'Kegel · Hombres y · Mujeres: los pósteres de suelo pélvico, del perro de caza a la postura del niño.', 'Todos los objetivos tienen ya al menos 4 series; tus ejercicios hechos a mano tienen nombre en los dos idiomas e indicaciones.'],
  },
  {
    version: '0.14.0',
    en: ['Settings → Body weight: pull-ups, push-ups and other bodyweight sets now count in the kg totals.', 'The ✓ view shows the kg done so far, per exercise and in all.', 'Train with a partner: each set is logged for one of you, the summary and the recap image come out for both.'],
    es: ['Ajustes → Peso corporal: dominadas, flexiones y demás series a peso corporal cuentan ya en los totales de kg.', 'La vista ✓ muestra los kg hechos hasta ahora, por ejercicio y en total.', 'Entrenar en pareja: cada serie se anota para uno de los dos, el resumen y la imagen salen para ambos.'],
  },
  {
    version: '0.13.0',
    en: ['Settings → Share Sets: a QR code and the link, to pass the app on.', 'Back from the gym and off for a run? "Add to today\'s session" joins it to the session and remakes the image.'],
    es: ['Ajustes → Compartir Sets: un código QR y el enlace, para pasar la app.', '¿Del gimnasio a correr? "Añadir a la sesión de hoy" la suma a la sesión y rehace la imagen.'],
  },
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
