import { ES_EXERCISES, ES_GROUPS, CURATE_1 } from './catalog.js'
import { PUSHUPS, HIP_THRUSTS, KEGEL_GROUPS, SPRINTS, CURATE_2 } from './catalog2.js'

/** A YouTube search for good form: always resolves, and lets the user pick the video they like. */
const yt = name => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form`).replace(/%20/g, '+')}`

/** Bilingual description; the app shows the line for the current language (see localDesc). */
const both = (en, es) => `EN: ${en}\nES: ${es}`

/** name, target, muscles worked (keys of MUSCLES), English cue, Spanish cue */
const ex = (name, target, muscles, en, es) => ({ name, ...target, muscles, desc: both(en, es), link: yt(name) })

/** Muscle groups an exercise can be tagged with; labels live in i18n as mu_<key>. */
export const MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'glutes', 'quads', 'hamstrings', 'calves', 'pelvicFloor', 'fullBody']

/**
 * Classic body-part groups, added in v3. Starting weights are placeholders to edit.
 * Kept separate so phones that already have data receive them once on upgrade.
 */
export const CLASSIC_GROUPS = [
  {
    name: 'Biceps',
    exercises: [
      ex('Barbell Curl', { sets: 3, reps: 10, kg: 25 }, ['biceps'],
        'Elbows pinned to your sides, curl the bar up without swinging, lower it slowly.',
        'Codos pegados al cuerpo, sube la barra sin balancearte y bájala despacio.'),
      ex('Dumbbell Curl', { sets: 3, reps: 12, kg: 10 }, ['biceps'],
        'Palms up, curl both dumbbells or alternate; turn the wrist out slightly at the top.',
        'Palmas hacia arriba, a la vez o alternando; gira un poco la muñeca hacia fuera arriba.'),
      ex('Hammer Curl', { sets: 3, reps: 12, kg: 10 }, ['biceps', 'forearms'],
        'Neutral grip, thumbs up; works the brachialis and forearm. No swinging.',
        'Agarre neutro, pulgares arriba; trabaja braquial y antebrazo. Sin balanceo.'),
      ex('Preacher Curl', { sets: 3, reps: 10, kg: 20 }, ['biceps'],
        'Upper arm flat on the pad; do not lock out hard at the bottom.',
        'Brazo apoyado en el banco Scott; no bloquees el codo de golpe abajo.'),
      ex('Concentration Curl', { sets: 3, reps: 10, kg: 8, perSide: true }, ['biceps'],
        'Seated, elbow braced on the inner thigh, one arm at a time, squeeze at the top.',
        'Sentado, codo apoyado en la cara interna del muslo, un brazo cada vez, aprieta arriba.'),
      ex('Chin ups', { sets: 3, reps: 8 }, ['back', 'biceps'],
        'Palms facing you, pull until the chin clears the bar, lower all the way.',
        'Palmas hacia ti, sube hasta pasar la barbilla de la barra y baja del todo.'),
    ],
  },
  {
    name: 'Triceps',
    exercises: [
      ex('Dips', { sets: 3, reps: 10 }, ['triceps', 'chest'],
        'Upright torso for triceps, lower until elbows reach about 90°, press back up.',
        'Torso erguido para tríceps, baja hasta unos 90° de codo y empuja hacia arriba.'),
      ex('Close-grip Bench Press', { sets: 3, reps: 8, kg: 50 }, ['triceps', 'chest'],
        'Hands shoulder-width, elbows tucked, touch the lower chest.',
        'Manos al ancho de hombros, codos pegados, toca la parte baja del pecho.'),
      ex('Skull Crushers', { sets: 3, reps: 10, kg: 20 }, ['triceps'],
        'Lying, lower the bar to the forehead by bending only the elbows.',
        'Tumbado, baja la barra hacia la frente doblando solo los codos.'),
      ex('Tricep Pushdown', { sets: 3, reps: 12, kg: 20 }, ['triceps'],
        'Cable, elbows fixed at your sides, push down to full extension.',
        'En polea, codos fijos a los lados, empuja hasta extender del todo.'),
      ex('Overhead Tricep Extension', { sets: 3, reps: 12, kg: 12 }, ['triceps'],
        'One dumbbell held with both hands overhead, lower behind the head, elbows pointing up.',
        'Mancuerna con las dos manos sobre la cabeza, baja por detrás, codos hacia arriba.'),
      ex('Diamond Push ups', { sets: 3, reps: 12 }, ['triceps', 'chest'],
        'Hands together under the chest forming a diamond, elbows close to the body.',
        'Manos juntas bajo el pecho formando un rombo, codos cerca del cuerpo.'),
    ],
  },
  {
    name: 'Shoulders',
    exercises: [
      ex('Overhead Press', { sets: 4, reps: 6, kg: 40 }, ['shoulders', 'triceps'],
        'Standing, glutes and core tight, press the bar straight up, head through at the top.',
        'De pie, glúteos y abdomen firmes, empuja la barra en vertical y mete la cabeza arriba.'),
      ex('Dumbbell Shoulder Press', { sets: 3, reps: 10, kg: 14 }, ['shoulders', 'triceps'],
        'Seated or standing, from shoulder height press up without arching the back.',
        'Sentado o de pie, desde los hombros empuja arriba sin arquear la espalda.'),
      ex('Lateral Raise', { sets: 3, reps: 12, kg: 6 }, ['shoulders'],
        'Slight bend in the elbows, raise to shoulder height, lead with the elbows.',
        'Codos algo flexionados, sube hasta la altura de los hombros guiando con los codos.'),
      ex('Front Raise', { sets: 3, reps: 12, kg: 6 }, ['shoulders'],
        'Raise in front to eye level, controlled, no swinging.',
        'Sube por delante hasta la altura de los ojos, controlado y sin balanceo.'),
      ex('Rear Delt Fly', { sets: 3, reps: 12, kg: 6 }, ['shoulders', 'back'],
        'Hinged forward, open the arms to the sides, squeeze the shoulder blades.',
        'Inclinado hacia delante, abre los brazos a los lados y junta las escápulas.'),
      ex('Face Pull', { sets: 3, reps: 15, kg: 15 }, ['shoulders', 'back'],
        'Rope at face height, pull towards the eyes with elbows high, rotate outwards.',
        'Cuerda a la altura de la cara, tira hacia los ojos con codos altos y rota hacia fuera.'),
      ex('Shrugs', { sets: 3, reps: 12, kg: 30 }, ['back'],
        'Shoulders straight up to the ears, pause, lower; do not roll them.',
        'Hombros hacia las orejas, pausa y baja; sin hacer círculos.'),
    ],
  },
  {
    name: 'Leg Day',
    exercises: [
      ex('Back Squat', { sets: 5, reps: 5, kg: 80 }, ['quads', 'glutes'],
        'Bar on the upper back, brace, sit down until thighs reach parallel, knees track the toes.',
        'Barra en la parte alta de la espalda, abdomen firme, baja hasta muslos paralelos, rodillas hacia las puntas.'),
      ex('Romanian Deadlift', { sets: 3, reps: 8, kg: 60 }, ['hamstrings', 'glutes'],
        'Soft knees, hips back, bar close to the legs; feel the hamstrings stretch.',
        'Rodillas algo flexionadas, cadera atrás, barra pegada a las piernas; nota el estiramiento femoral.'),
      ex('Leg Press', { sets: 3, reps: 10, kg: 100 }, ['quads', 'glutes'],
        'Feet shoulder-width, lower until knees near 90°, do not lock the knees.',
        'Pies al ancho de hombros, baja hasta unos 90° de rodilla, sin bloquear las rodillas.'),
      ex('Walking Lunges', { sets: 3, reps: 12, kg: 10, perSide: true }, ['quads', 'glutes'],
        'Long step, back knee near the floor, torso upright, alternate legs.',
        'Paso largo, rodilla de atrás cerca del suelo, torso recto, alterna piernas.'),
      ex('Leg Curl', { sets: 3, reps: 12, kg: 30 }, ['hamstrings'],
        'Machine, curl heels towards the glutes, lower under control.',
        'En máquina, lleva los talones hacia los glúteos y baja controlado.'),
      ex('Leg Extension', { sets: 3, reps: 12, kg: 30 }, ['quads'],
        'Machine, extend fully, squeeze the quads, lower slowly.',
        'En máquina, extiende del todo, aprieta el cuádriceps y baja despacio.'),
      ex('Standing Calf Raise', { sets: 4, reps: 15, kg: 40 }, ['calves'],
        'Full stretch at the bottom, rise onto the toes, pause at the top.',
        'Estira del todo abajo, sube de puntillas y haz una pausa arriba.'),
    ],
  },
  {
    name: 'Core',
    exercises: [
      ex('Plank', { type: 'time', sets: 3, seconds: 60 }, ['core'],
        'Forearms and toes, body in a straight line, glutes tight, breathe.',
        'Antebrazos y puntas de los pies, cuerpo en línea recta, glúteos firmes, respira.'),
      ex('Side Plank', { type: 'time', sets: 3, seconds: 30, perSide: true }, ['core'],
        'On one forearm, hips up in line with shoulders and feet.',
        'Sobre un antebrazo, cadera arriba en línea con hombros y pies.'),
      ex('Crunches', { sets: 3, reps: 20 }, ['core'],
        'Lower back on the floor, lift the shoulders, do not pull on the neck.',
        'Zona lumbar en el suelo, levanta los hombros sin tirar del cuello.'),
      ex('Hanging Leg Raise', { sets: 3, reps: 10 }, ['core'],
        'Hanging from a bar, raise the legs without swinging, curl the pelvis at the top.',
        'Colgado de una barra, sube las piernas sin balanceo y enrolla la pelvis arriba.'),
      ex('Russian Twists', { sets: 3, reps: 20, kg: 5 }, ['core'],
        'Seated, leaning back, feet up if you can, rotate the weight side to side.',
        'Sentado e inclinado atrás, pies en el aire si puedes, gira el peso de lado a lado.'),
      ex('Ab Wheel Rollout', { sets: 3, reps: 10 }, ['core'],
        'From the knees, roll out with a flat back, pull back with the abs.',
        'De rodillas, rueda hacia delante con la espalda recta y vuelve tirando del abdomen.'),
      ex('Dead Bug', { sets: 3, reps: 10, perSide: true }, ['core'],
        'On your back, lower opposite arm and leg slowly, lower back stays down.',
        'Boca arriba, baja brazo y pierna contrarios despacio sin despegar la zona lumbar.'),
      ex('Mountain Climbers', { type: 'time', sets: 3, seconds: 30 }, ['core', 'fullBody'],
        'High plank, drive the knees to the chest fast, hips level.',
        'Plancha alta, lleva las rodillas al pecho rápido, cadera estable.'),
    ],
  },
]

/** The user's own starting groups, in the same shape as an importable config file. */
export const seedConfig = {
  format: 'exercise-tracker/config',
  version: 1,
  groups: [
    {
      name: 'Kettlebell Supergroup',
      exercises: [
        { name: 'Chest Thrusts', sets: 2, reps: 50, kg: 16 },
        { name: 'Round the Worlds', sets: 2, reps: 50, kg: 16 },
        { name: 'Halos', sets: 5, reps: 10, kg: 16 },
        { name: 'Lateral Swing', sets: 2, reps: 50, kg: 20 },
        { name: 'Forward Swing', sets: 2, reps: 50, kg: 20 },
        { name: 'Chest to Sky', sets: 3, reps: 15, kg: 16 },
        { name: 'Over the Shoulder', sets: 5, reps: 10, kg: 16 },
        { name: '3-phase supercurl', sets: 3, reps: 10, kg: 16 },
        { name: 'Overhead March', sets: 2, reps: 25, kg: 16 },
        { name: 'Overhand Row', sets: 2, reps: 25, kg: 16 },
        { name: 'Upright Row', sets: 2, reps: 25, kg: 16 },
        { name: 'Torso Twists', sets: 4, reps: 25, kg: 16 },
      ],
    },
    {
      name: 'My Warm up Routine',
      exercises: [
        { name: 'Arm superseries', sets: 3, reps: 5, kg: 10, desc: 'La superserie de curls, antebrazos y hombro.' },
        { name: 'Disc routine', sets: 2, reps: 1, kg: 10, desc: 'Superserie con disco a frente, lateral y halos: 1, 1, 1, 2, 2, 3.' },
      ],
    },
  ],
}

/** Back day, added in pack back-1. */
export const BACK_GROUPS = [
  {
    name: 'Back',
    exercises: [
      ex('Deadlift', { sets: 3, reps: 5, kg: 100 }, ['back', 'hamstrings', 'glutes'],
        'Bar over mid-foot, flat back, push the floor away, lock out with the hips.',
        'Barra sobre el medio del pie, espalda recta, empuja el suelo y bloquea con la cadera.'),
      ex('Pull ups', { sets: 3, reps: 8 }, ['back', 'biceps'],
        'Palms away, pull the chest towards the bar, full hang at the bottom.',
        'Palmas hacia fuera, lleva el pecho hacia la barra, cuelga del todo abajo.'),
      ex('Lat Pulldown', { sets: 3, reps: 10, kg: 45 }, ['back', 'biceps'],
        'Pull the bar to the upper chest, elbows down and back, no leaning far back.',
        'Lleva la barra a la parte alta del pecho, codos abajo y atrás, sin echarte muy atrás.'),
      ex('Barbell Row', { sets: 4, reps: 8, kg: 50 }, ['back', 'biceps'],
        'Hinged at about 45°, flat back, row the bar to the belly button.',
        'Inclinado unos 45°, espalda recta, lleva la barra hacia el ombligo.'),
      ex('Seated Cable Row', { sets: 3, reps: 10, kg: 45 }, ['back', 'biceps'],
        'Chest up, pull the handle to the stomach, squeeze the shoulder blades.',
        'Pecho arriba, lleva el agarre al abdomen y junta las escápulas.'),
      ex('One-arm Dumbbell Row', { sets: 3, reps: 10, kg: 22, perSide: true }, ['back', 'biceps'],
        'Hand and knee on a bench, pull the dumbbell to the hip, no twisting.',
        'Mano y rodilla en el banco, lleva la mancuerna a la cadera sin girar el tronco.'),
      ex('T-bar Row', { sets: 3, reps: 10, kg: 30 }, ['back'],
        'Chest over the bar, flat back, pull the handles to the chest.',
        'Pecho sobre la barra, espalda recta, lleva los agarres al pecho.'),
      ex('Straight-arm Pulldown', { sets: 3, reps: 12, kg: 20 }, ['back'],
        'Cable, arms almost straight, sweep the bar down to the thighs.',
        'En polea, brazos casi rectos, baja la barra en arco hasta los muslos.'),
      ex('Back Extension', { sets: 3, reps: 12 }, ['back', 'glutes', 'hamstrings'],
        'On the bench, lower with a flat back, rise to a straight line, do not overarch.',
        'En el banco, baja con la espalda recta y sube hasta la línea recta sin hiperextender.'),
      'Face Pull',
    ],
  },
]

/** A pack group with Spanish names attached, for groups and their exercise objects. */
function withEs(g) {
  return {
    ...g,
    ...(ES_GROUPS[g.name] ? { names: { es: ES_GROUPS[g.name] } } : {}),
    exercises: g.exercises.map(e => (typeof e === 'object' && ES_EXERCISES[e.name] ? { ...e, names: { es: ES_EXERCISES[e.name] } } : e)),
  }
}

/**
 * Built-in content, applied once per phone and only ever added (see planPack).
 * A new batch of groups gets a new pack id; existing packs are never re-applied.
 * `label` names a group that clashes with one the user already has: "Back (classic)".
 */
export const PACKS = [
  { id: 'base-1', label: 'starter', groups: seedConfig.groups.map(withEs) },
  { id: 'classic-1', label: 'classic', groups: CLASSIC_GROUPS.map(withEs) },
  CURATE_1, // before back-1, so the Back pack finds the user's renamed exercises by name
  { id: 'back-1', label: 'classic', groups: BACK_GROUPS.map(withEs) },
  // 2026-10-20: the user's newest exercises named properly, then push-ups, hip thrust, Kegels, Sprints
  CURATE_2,
  { id: 'pushups-1', label: 'classic', appendTo: 'nuevo-grupo-2', groups: [PUSHUPS] },
  { id: 'hipthrust-1', label: 'classic', appendTo: 'leg-day', groups: [{ name: 'Hip thrust', names: { es: 'Hip thrust' }, exercises: HIP_THRUSTS }] },
  { id: 'kegels-1', label: 'classic', groups: KEGEL_GROUPS }, // last among the groups
  { id: 'sprints-1', kind: 'activities', activities: [SPRINTS] },
]

/** Muscles of every built-in exercise by name, to fill in exercises that have none (never overwriting). */
export const CATALOG_MUSCLES = Object.fromEntries(
  [...CLASSIC_GROUPS, ...BACK_GROUPS].flatMap(g => g.exercises).filter(e => typeof e === 'object').map(e => [e.name.toLowerCase(), e.muscles]))

/**
 * The part of a description for the UI language. A description written as
 * "EN: ...\nES: ..." shows only its own line; any other text shows as written.
 */
export function localDesc(desc, lang) {
  const lines = String(desc ?? '').split('\n')
  const tagged = lines.map(l => l.match(/^(EN|ES):\s*(.*)$/i)).filter(Boolean)
  if (!tagged.length) return desc ?? ''
  const mine = tagged.filter(m => m[1].toLowerCase() === lang).map(m => m[2])
  const untagged = lines.filter(l => !/^(EN|ES):/i.test(l))
  return [...(mine.length ? mine : tagged.filter(m => m[1].toLowerCase() === 'en').map(m => m[2])), ...untagged].join('\n').trim()
}
