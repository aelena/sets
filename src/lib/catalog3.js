/**
 * curate-3 (2026-10-21): the user's hand-built Pecho group and new exercises from the gym, named
 * in EN/ES with cues, muscles and links, under the usual guard (original id + name). Runs before
 * chest-1, so the built-in Chest exercises find the user's ones by name and join their group.
 * If chest-1 already ran on the phone, its unused duplicates fold into the user's exercises and
 * its group becomes "Chest (classic)", next to the user's.
 */
const yt = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q).replace(/%20/g, '+')}`
const both = (en, es) => `EN: ${en}\nES: ${es}`
const fix = (id, from, name, es, muscles, en, esDesc, note, search = `${name} proper form`) => ({
  id, from, set: { name, names: { es }, muscles, link: yt(search), desc: both(en, esDesc) + (note ? `\n${note}` : '') },
})

export const CURATE_3 = {
  id: 'curate-3',
  kind: 'curate',
  exercises: [
    fix('bench-press', 'Bench Press', 'Bench Press', 'Press de banca', ['chest', 'triceps', 'shoulders'],
      'Eyes under the bar, shoulder blades pinched, bar to the lower chest, elbows at about 45°, press up.',
      'Ojos bajo la barra, escápulas juntas, barra a la parte baja del pecho, codos a unos 45° y empuja.',
      'Empezamos en 15 vamos subiendo hasta 25 bajando las repeticiones'),
    fix('press-banca-inclinado-hacia-abajo', 'Press banca inclinado hacia abajo', 'Decline Bench Press', 'Press declinado con barra', ['chest', 'triceps'],
      'Head lower than the hips, bar to the lower chest; more lower chest.',
      'Cabeza más baja que la cadera, barra a la parte baja del pecho; más pecho inferior.',
      'Empezar con un 10 kilos ir subiendo este es el ejercicio que es como un preso banca, pero que la cabeza está más baja que el cuerpo está alquilado hacia atrás hacia abajo'),
    fix('pectoral-fly', 'Pectoral fly', 'Pec Deck', 'Contractora (pec deck)', ['chest'],
      'Machine fly: elbows slightly bent, bring the handles together, squeeze, open under control.',
      'Aperturas en máquina: codos algo flexionados, junta los agarres, aprieta y abre controlando.'),
    fix('seated-press', 'Seated press', 'Seated Chest Press', 'Press de pecho sentado', ['chest', 'triceps'],
      'Seated machine, handles at mid-chest, press out without locking the elbows, back flat on the pad.',
      'Máquina sentado, agarres a media altura del pecho, empuja sin bloquear los codos, espalda pegada al respaldo.',
      'Empezar con 50 kilos, ir subiendo y ajustando repeticiones', 'seated chest press machine proper form'),
    fix('convergent-press', 'Convergent Press', 'Convergent Press', 'Press convergente', ['chest', 'triceps', 'shoulders'],
      'Machine whose arms move towards each other as you press: press out and in, squeeze the chest at the end.',
      'Máquina cuyos brazos se juntan al empujar: empuja hacia delante y hacia dentro y aprieta el pecho al final.',
      null, 'converging chest press machine proper form'),
    fix('military-press', 'Military Press', 'Military Press', 'Press militar', ['shoulders', 'triceps'],
      'Standing, feet together, glutes and core tight, press the weight straight overhead, head through at the top.',
      'De pie, pies juntos, glúteos y abdomen firmes, empuja el peso en vertical sobre la cabeza y mete la cabeza arriba.'),
    fix('shoulder-press', 'Shoulder Press', 'Shoulder Press', 'Press de hombros', ['shoulders', 'triceps'],
      'Seated machine, handles at shoulder height, press up without arching the lower back, lower under control.',
      'Máquina sentado, agarres a la altura de los hombros, empuja hacia arriba sin arquear la zona lumbar y baja controlando.',
      'De 27 en adelante', 'machine shoulder press proper form'),
    fix('wall-sit', 'Wall sit', 'Wall Sit', 'Sentadilla isométrica en pared', ['quads', 'glutes'],
      'Back flat against a wall, knees at 90° over the ankles, hold.',
      'Espalda pegada a la pared, rodillas a 90° sobre los tobillos, aguanta.'),
  ],
  groups: [
    { id: 'nuevo-grupo-4', from: 'Pecho', set: { name: 'Chest', names: { es: 'Pecho' } } },
    // only when chest-1 already made its own group on this phone: it stays, next to the user's
    { id: 'chest', from: 'Chest', requires: 'nuevo-grupo-4', set: { name: 'Chest (classic)', names: { es: 'Pecho (clásico)' } } },
  ],
  // only when chest-1 already ran: its never-used duplicates fold into the user's exercises
  merges: [
    { from: 'decline-bench-press', fromName: 'Decline Bench Press', into: 'press-banca-inclinado-hacia-abajo' },
    { from: 'pec-deck', fromName: 'Pec Deck', into: 'pectoral-fly' },
    { from: 'chest-press-machine', fromName: 'Chest Press Machine', into: 'seated-press' },
  ],
}
