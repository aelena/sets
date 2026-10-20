/**
 * Library additions of 2026-10-20: push-up variations, hip thrust, Kegels for men and for women,
 * Sprints, and curate-2 for the exercises the user built on the phone after curate-1.
 * Same rules as catalog.js: add-only, curation guarded by original id and name.
 */

const yt = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q).replace(/%20/g, '+')}`
const both = (en, es) => `EN: ${en}\nES: ${es}`
const ex = (name, es, target, muscles, en, esDesc, search = `${name} proper form`) =>
  ({ name, names: { es }, ...target, muscles, desc: both(en, esDesc), link: yt(search) })

/** Appended to the user's Functional group; a phone without it gets them as a "Push ups" group. */
export const PUSHUPS = {
  name: 'Push ups', names: { es: 'Flexiones' },
  exercises: [
    ex('Push ups', 'Flexiones', { sets: 3, reps: 15 }, ['chest', 'triceps', 'shoulders'],
      'Hands under the shoulders, body in one line from head to heels, chest to a fist from the floor, press back up.',
      'Manos bajo los hombros, cuerpo en línea de la cabeza a los talones, baja el pecho hasta un puño del suelo y empuja.'),
    'Diamond Push ups',
    ex('Wide Push ups', 'Flexiones abiertas', { sets: 3, reps: 12 }, ['chest', 'shoulders'],
      'Hands wider than the shoulders, elbows out at about 45°, more chest than triceps.',
      'Manos más abiertas que los hombros, codos a unos 45°, más pecho que tríceps.'),
    ex('Incline Push ups', 'Flexiones inclinadas', { sets: 3, reps: 15 }, ['chest', 'triceps'],
      'Hands on a bench or box, body straight; the easier version, good for volume.',
      'Manos en un banco o cajón, cuerpo recto; la versión fácil, buena para sumar volumen.'),
    ex('Decline Push ups', 'Flexiones declinadas', { sets: 3, reps: 12 }, ['chest', 'shoulders', 'triceps'],
      'Feet on a bench, hands on the floor; shifts the work to the upper chest and shoulders.',
      'Pies en un banco, manos en el suelo; lleva el trabajo a la parte alta del pecho y a los hombros.'),
    ex('Archer Push ups', 'Flexiones arquero', { sets: 3, reps: 6, perSide: true }, ['chest', 'triceps', 'shoulders'],
      'Very wide hands; lower towards one hand while the other arm stays straight, then switch sides.',
      'Manos muy abiertas; baja hacia una mano mientras el otro brazo queda estirado y alterna.'),
    ex('Pike Push ups', 'Flexiones en pica', { sets: 3, reps: 10 }, ['shoulders', 'triceps'],
      'Hips high in an inverted V, lower the head between the hands; a shoulder press with bodyweight.',
      'Cadera alta en V invertida, baja la cabeza entre las manos; un press de hombros con el peso corporal.'),
    ex('Clap Push ups', 'Flexiones con palmada', { sets: 3, reps: 8 }, ['chest', 'triceps', 'fullBody'],
      'Explosive press so the hands leave the floor, clap, land with soft elbows.',
      'Empuje explosivo para despegar las manos, palmada y aterriza con los codos suaves.'),
    ex('Hindu Push ups', 'Flexiones hindúes', { sets: 3, reps: 10 }, ['chest', 'shoulders', 'triceps', 'core'],
      'From downward dog, swoop the chest low and forward into upward dog, then push back.',
      'Desde perro boca abajo, baja el pecho rozando el suelo hacia delante hasta perro boca arriba y vuelve.'),
    ex('Spiderman Push ups', 'Flexiones Spiderman', { sets: 3, reps: 8, perSide: true }, ['chest', 'core', 'triceps'],
      'As you lower, bring one knee to the elbow on the same side; alternate sides each rep.',
      'Al bajar, lleva una rodilla al codo del mismo lado; alterna en cada repetición.'),
  ],
}

/** Chest, a classic group placed before the Kegels groups. */
export const CHEST = {
  name: 'Chest', names: { es: 'Pecho' },
  exercises: [
    ex('Bench Press', 'Press de banca', { sets: 4, reps: 8, kg: 60 }, ['chest', 'triceps', 'shoulders'],
      'Eyes under the bar, shoulder blades pinched, bar to the lower chest, elbows at about 45°, press up.',
      'Ojos bajo la barra, escápulas juntas, barra a la parte baja del pecho, codos a unos 45° y empuja.'),
    ex('Incline Bench Press', 'Press inclinado con barra', { sets: 4, reps: 8, kg: 50 }, ['chest', 'shoulders', 'triceps'],
      'Bench at 30 to 45°, bar to the upper chest; more upper chest and front shoulder.',
      'Banco a 30-45°, barra a la parte alta del pecho; más pecho superior y hombro anterior.'),
    ex('Decline Bench Press', 'Press declinado con barra', { sets: 3, reps: 10, kg: 50 }, ['chest', 'triceps'],
      'Head lower than the hips, bar to the lower chest; more lower chest.',
      'Cabeza más baja que la cadera, barra a la parte baja del pecho; más pecho inferior.'),
    ex('Dumbbell Bench Press', 'Press de banca con mancuernas', { sets: 3, reps: 10, kg: 22 }, ['chest', 'triceps', 'shoulders'],
      'Dumbbells at chest level, press up and slightly in, lower with a full stretch.',
      'Mancuernas a la altura del pecho, empuja hacia arriba y un poco hacia dentro, baja con estiramiento completo.'),
    ex('Incline Dumbbell Press', 'Press inclinado con mancuernas', { sets: 3, reps: 10, kg: 20 }, ['chest', 'shoulders', 'triceps'],
      'Bench at 30 to 45°, press the dumbbells over the upper chest.',
      'Banco a 30-45°, empuja las mancuernas sobre la parte alta del pecho.'),
    ex('Dumbbell Fly', 'Aperturas con mancuernas', { sets: 3, reps: 12, kg: 12 }, ['chest'],
      'Slight bend in the elbows, open the arms wide until a chest stretch, hug back up.',
      'Codos algo flexionados, abre los brazos hasta notar el estiramiento del pecho y cierra como un abrazo.'),
    ex('Cable Crossover', 'Cruce de poleas', { sets: 3, reps: 12, kg: 15 }, ['chest'],
      'Cables high, step forward, bring the hands together in front of the hips, slow return.',
      'Poleas altas, un paso adelante, junta las manos delante de la cadera y vuelve despacio.'),
    ex('Pec Deck', 'Contractora (pec deck)', { sets: 3, reps: 12, kg: 40 }, ['chest'],
      'Machine fly: elbows slightly bent, bring the handles together, squeeze, open under control.',
      'Aperturas en máquina: codos algo flexionados, junta los agarres, aprieta y abre controlando.'),
    ex('Chest Press Machine', 'Press de pecho en máquina', { sets: 3, reps: 10, kg: 50 }, ['chest', 'triceps'],
      'Handles at mid-chest, press out without locking the elbows, back flat on the pad.',
      'Agarres a media altura del pecho, empuja sin bloquear los codos, espalda pegada al respaldo.'),
    ex('Chest Dips', 'Fondos para pecho', { sets: 3, reps: 10 }, ['chest', 'triceps'],
      'Lean the torso forward and let the elbows flare a little: more chest than the upright dip.',
      'Inclina el torso hacia delante y abre un poco los codos: más pecho que en los fondos rectos.'),
    'Push ups',
  ],
}

/** Appended to Leg Day. */
export const HIP_THRUSTS = [
  ex('Barbell Hip Thrust', 'Hip thrust con barra', { sets: 4, reps: 10, kg: 60 }, ['glutes', 'hamstrings'],
    'Upper back on a bench, bar over the hips, drive up to a straight line from knees to shoulders, squeeze at the top.',
    'Parte alta de la espalda en un banco, barra sobre la cadera, sube hasta la línea rodillas-hombros y aprieta arriba.'),
  ex('Glute Bridge', 'Puente de glúteos', { sets: 3, reps: 15 }, ['glutes', 'hamstrings', 'core'],
    'On your back, feet flat near the hips, lift the hips by squeezing the glutes, lower slowly.',
    'Boca arriba, pies apoyados cerca de la cadera, sube la cadera apretando los glúteos y baja despacio.'),
]

/**
 * Kegels, the last groups. The same core exercises, cued for each body; separate exercises
 * (and history) for men and for women. "(men)" / "(women)" in the name keeps them apart.
 */
const KEGEL_CUES = {
  men: {
    find: { en: 'Squeeze as if stopping urine and holding in gas: the base of the penis draws in and the testicles lift.', es: 'Aprieta como para cortar la orina y retener un gas: la base del pene se retrae y los testículos suben.' },
    who: { en: 'men', es: 'hombre' },
    search: 'male kegel exercises',
  },
  women: {
    find: { en: 'Squeeze and lift as if stopping urine and holding in gas: the vagina and anus draw up and in.', es: 'Aprieta y eleva como para cortar la orina y retener un gas: vagina y ano suben y hacia dentro.' },
    who: { en: 'women', es: 'mujer' },
    search: 'female kegel exercises',
  },
}
const KEGELS = [
  ['Quick Kegels', 'Kegel rápidos', { sets: 3, reps: 10 },
    'Squeeze hard for one second, let go fully for one second.', 'Aprieta fuerte un segundo y suelta del todo otro segundo.'],
  ['Kegel Holds', 'Kegel mantenidos', { sets: 3, reps: 10 },
    'Squeeze and hold 5 to 10 seconds, then rest as long as you held.', 'Aprieta y mantén de 5 a 10 segundos, luego descansa lo mismo que mantuviste.'],
  ['Elevator Kegels', 'Kegel en ascensor', { sets: 3, reps: 5 },
    'Squeeze in three steps, floor by floor up to full, then release step by step.', 'Aprieta en tres pasos, piso a piso hasta el máximo, y suelta también por pasos.'],
  ['Reverse Kegels', 'Kegel inversos', { sets: 2, reps: 10 },
    'The opposite: breathe in and gently let the pelvic floor drop and open, as when starting to urinate. Builds relaxation, not strength.',
    'Lo contrario: inspira y deja que el suelo pélvico baje y se abra con suavidad, como al empezar a orinar. Entrena la relajación, no la fuerza.'],
  ['Bridge with Kegel', 'Puente con Kegel', { sets: 3, reps: 10 },
    'Glute bridge, and squeeze the pelvic floor at the top before lowering.', 'Puente de glúteos y aprieta el suelo pélvico arriba antes de bajar.'],
]
const kegelGroup = who => {
  const c = KEGEL_CUES[who]
  return {
    name: `Kegels · ${who === 'men' ? 'Men' : 'Women'}`, names: { es: `Kegel · ${who === 'men' ? 'Hombres' : 'Mujeres'}` },
    exercises: KEGELS.map(([name, es, target, en, esDesc]) => ({
      name: `${name} (${c.who.en})`, names: { es: `${es} (${c.who.es})` }, ...target,
      muscles: name.startsWith('Bridge') ? ['pelvicFloor', 'glutes'] : ['pelvicFloor'],
      desc: both(`${en} ${c.find.en} Breathe normally; glutes, thighs and belly stay relaxed.`, `${esDesc} ${c.find.es} Respira con normalidad; glúteos, muslos y abdomen relajados.`),
      link: yt(`${c.search} ${name}`),
    })),
  }
}
export const KEGEL_GROUPS = [kegelGroup('men'), kegelGroup('women')]

/** Sprints: logged in seconds or metres, no defaults, left out of the staleness list. */
export const SPRINTS = { id: 'sprints', name: 'Sprints', names: { es: 'Sprints' }, kind: 'sprint', archived: false }

/** curate-2: the exercises built on the phone between 2026-10-16 and 2026-10-20. */
const fix = (id, from, name, es, set, en, esDesc, search = `${name} proper form`) => ({
  id, from, set: { name, names: { es }, ...set, link: yt(search), desc: both(en, esDesc) },
})
export const CURATE_2 = {
  id: 'curate-2',
  kind: 'curate',
  exercises: [
    fix('push-ups', 'Push ups', 'Push ups', 'Flexiones', { muscles: ['chest', 'triceps', 'shoulders'] },
      'Hands under the shoulders, body in one line from head to heels, chest to a fist from the floor, press back up.',
      'Manos bajo los hombros, cuerpo en línea de la cabeza a los talones, baja el pecho hasta un puño del suelo y empuja.'),
    fix('diamond-push-ups-2', 'Diamond push ups', 'Diamond Push ups', 'Flexiones en diamante', { muscles: ['triceps', 'chest'] },
      'Hands together under the chest forming a diamond, elbows close to the body.',
      'Manos juntas bajo el pecho formando un rombo, codos cerca del cuerpo.'),
    fix('mike-tyson-push-ups', 'Mike Tyson push ups', 'Mike Tyson Push ups', 'Flexiones Mike Tyson', { muscles: ['chest', 'shoulders', 'triceps', 'core'] },
      'From a high plank with hips raised, dive down and forward into a push-up, then press back up to the start.',
      'Desde plancha alta con la cadera elevada, baja en picado hacia delante a una flexión y vuelve empujando al inicio.'),
    fix('bulgara', 'Búlgara', 'Bulgarian Split Squat', 'Sentadilla búlgara', { muscles: ['quads', 'glutes'] },
      'Rear foot on a bench, front shin near vertical, lower straight down until the back knee nears the floor.',
      'Pie de atrás en un banco, tibia delantera casi vertical, baja en vertical hasta que la rodilla de atrás casi toque el suelo.'),
    fix('brazo-por-encima-cabeza', 'Brazo por encima cabeza', 'One-arm Overhead Tricep Extension', 'Extensión de tríceps a una mano sobre la cabeza', { muscles: ['triceps'] },
      'Dumbbell overhead in one hand, upper arm by the ear, lower behind the head bending only the elbow, extend back up.',
      'Mancuerna sobre la cabeza con una mano, brazo junto a la oreja, baja por detrás doblando solo el codo y extiende.'),
    fix('kettlebell-delt-raise', 'Kettlebell delt raise', 'Kettlebell Delt Raise', 'Elevación de deltoides con kettlebell', {},
      'Kettlebell in one hand, raise it out to shoulder height with a soft elbow, lower under control.',
      'Kettlebell en una mano, elévala hasta la altura del hombro con el codo suave y baja controlando.'),
    fix('extension-completa-en-polea', 'Extensión completa en polea', 'One-arm Cable Full Extension', 'Extensión completa en polea a una mano', { muscles: ['forearms', 'triceps'] },
      'Standing at a cable with a single handle, arm by your side, elbow bent and hand up as if saluting; extend through about 180° until the whole arm hangs by your body. Like a tricep pushdown, but felt in the forearm.',
      'De pie frente a la polea con un agarre, brazo pegado al costado, codo flexionado y la mano arriba como en un saludo; extiende unos 180° hasta que todo el brazo quede junto al cuerpo. Como un tríceps en polea, pero se nota en el antebrazo.',
      'one arm cable pushdown full range'),
  ],
  // kettlebell group: links for all; descriptions only for the standard moves (the rest are the user's own)
  fill: [
    ['chest-thrusts', 'Chest Thrusts'], ['chest-to-sky', 'Chest to Sky'], ['over-the-shoulder', 'Over the Shoulder'],
    ['3-phase-supercurl', '3-phase supercurl'], ['lateral-swing', 'Lateral Swing'],
  ].map(([id, from]) => ({ id, from, set: { link: yt(`kettlebell ${from}`) } })).concat([
    ['halos', 'Halos', 'Kettlebell upside down by the horns, circle it around the head close to the neck, both directions; ribs down.',
      'Kettlebell boca abajo por los cuernos, rodéala alrededor de la cabeza cerca del cuello, en ambos sentidos; costillas abajo.'],
    ['round-the-worlds', 'Round the Worlds', 'Pass the kettlebell around the waist from hand to hand, hips still, both directions.',
      'Pasa la kettlebell alrededor de la cintura de una mano a otra, cadera quieta, en ambos sentidos.'],
    ['forward-swing', 'Forward Swing', 'Hinge, hike the bell back between the legs, snap the hips to float it to chest height; arms only guide.',
      'Bisagra de cadera, lleva la kettlebell atrás entre las piernas y empuja la cadera para subirla a la altura del pecho; los brazos solo guían.'],
    ['upright-row', 'Upright Row', 'Kettlebell by the horns, pull it up along the body to chest height, elbows leading and above the hands.',
      'Kettlebell por los cuernos, súbela pegada al cuerpo hasta el pecho, guiando con los codos por encima de las manos.'],
    ['torso-twists', 'Torso Twists', 'Kettlebell at the chest, rotate the torso side to side with the hips facing forward.',
      'Kettlebell al pecho, gira el tronco de lado a lado con la cadera mirando al frente.'],
    ['overhead-march', 'Overhead March', 'Kettlebell locked out overhead, march on the spot lifting the knees, core braced, no leaning.',
      'Kettlebell bloqueada sobre la cabeza, marcha en el sitio subiendo las rodillas, abdomen firme, sin inclinarte.'],
    ['overhand-row', 'Overhand Row', 'Hinged forward, flat back, row the kettlebell to the hip with an overhand grip, squeeze the shoulder blade.',
      'Inclinado hacia delante, espalda recta, rema la kettlebell hacia la cadera con agarre prono y junta la escápula.'],
  ].map(([id, from, en, esDesc]) => ({ id, from, set: { desc: both(en, esDesc), link: yt(`kettlebell ${from}`) } }))),
  // the built-in diamond push-up folds into the user's one, which carries their settings (only if it has no sets)
  merges: [{ from: 'diamond-push-ups', fromName: 'Diamond Push ups', into: 'diamond-push-ups-2' }],
}
