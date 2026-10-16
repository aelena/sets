/** A YouTube search for good form: always resolves, and lets the user pick the video they like. */
const yt = name => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form`).replace(/%20/g, '+')}`

/** Bilingual description; the app shows the line for the current language (see localDesc). */
const both = (en, es) => `EN: ${en}\nES: ${es}`

const ex = (name, target, en, es) => ({ name, ...target, desc: both(en, es), link: yt(name) })

/**
 * Classic body-part groups, added in v3. Starting weights are placeholders to edit.
 * Kept separate so phones that already have data receive them once on upgrade.
 */
export const CLASSIC_GROUPS = [
  {
    name: 'Biceps',
    exercises: [
      ex('Barbell Curl', { sets: 3, reps: 10, kg: 25 },
        'Elbows pinned to your sides, curl the bar up without swinging, lower it slowly.',
        'Codos pegados al cuerpo, sube la barra sin balancearte y bájala despacio.'),
      ex('Dumbbell Curl', { sets: 3, reps: 12, kg: 10 },
        'Palms up, curl both dumbbells or alternate; turn the wrist out slightly at the top.',
        'Palmas hacia arriba, a la vez o alternando; gira un poco la muñeca hacia fuera arriba.'),
      ex('Hammer Curl', { sets: 3, reps: 12, kg: 10 },
        'Neutral grip, thumbs up; works the brachialis and forearm. No swinging.',
        'Agarre neutro, pulgares arriba; trabaja braquial y antebrazo. Sin balanceo.'),
      ex('Preacher Curl', { sets: 3, reps: 10, kg: 20 },
        'Upper arm flat on the pad; do not lock out hard at the bottom.',
        'Brazo apoyado en el banco Scott; no bloquees el codo de golpe abajo.'),
      ex('Concentration Curl', { sets: 3, reps: 10, kg: 8, perSide: true },
        'Seated, elbow braced on the inner thigh, one arm at a time, squeeze at the top.',
        'Sentado, codo apoyado en la cara interna del muslo, un brazo cada vez, aprieta arriba.'),
      ex('Chin ups', { sets: 3, reps: 8 },
        'Palms facing you, pull until the chin clears the bar, lower all the way.',
        'Palmas hacia ti, sube hasta pasar la barbilla de la barra y baja del todo.'),
    ],
  },
  {
    name: 'Triceps',
    exercises: [
      ex('Dips', { sets: 3, reps: 10 },
        'Upright torso for triceps, lower until elbows reach about 90°, press back up.',
        'Torso erguido para tríceps, baja hasta unos 90° de codo y empuja hacia arriba.'),
      ex('Close-grip Bench Press', { sets: 3, reps: 8, kg: 50 },
        'Hands shoulder-width, elbows tucked, touch the lower chest.',
        'Manos al ancho de hombros, codos pegados, toca la parte baja del pecho.'),
      ex('Skull Crushers', { sets: 3, reps: 10, kg: 20 },
        'Lying, lower the bar to the forehead by bending only the elbows.',
        'Tumbado, baja la barra hacia la frente doblando solo los codos.'),
      ex('Tricep Pushdown', { sets: 3, reps: 12, kg: 20 },
        'Cable, elbows fixed at your sides, push down to full extension.',
        'En polea, codos fijos a los lados, empuja hasta extender del todo.'),
      ex('Overhead Tricep Extension', { sets: 3, reps: 12, kg: 12 },
        'One dumbbell held with both hands overhead, lower behind the head, elbows pointing up.',
        'Mancuerna con las dos manos sobre la cabeza, baja por detrás, codos hacia arriba.'),
      ex('Diamond Push ups', { sets: 3, reps: 12 },
        'Hands together under the chest forming a diamond, elbows close to the body.',
        'Manos juntas bajo el pecho formando un rombo, codos cerca del cuerpo.'),
    ],
  },
  {
    name: 'Shoulders',
    exercises: [
      ex('Overhead Press', { sets: 4, reps: 6, kg: 40 },
        'Standing, glutes and core tight, press the bar straight up, head through at the top.',
        'De pie, glúteos y abdomen firmes, empuja la barra en vertical y mete la cabeza arriba.'),
      ex('Dumbbell Shoulder Press', { sets: 3, reps: 10, kg: 14 },
        'Seated or standing, from shoulder height press up without arching the back.',
        'Sentado o de pie, desde los hombros empuja arriba sin arquear la espalda.'),
      ex('Lateral Raise', { sets: 3, reps: 12, kg: 6 },
        'Slight bend in the elbows, raise to shoulder height, lead with the elbows.',
        'Codos algo flexionados, sube hasta la altura de los hombros guiando con los codos.'),
      ex('Front Raise', { sets: 3, reps: 12, kg: 6 },
        'Raise in front to eye level, controlled, no swinging.',
        'Sube por delante hasta la altura de los ojos, controlado y sin balanceo.'),
      ex('Rear Delt Fly', { sets: 3, reps: 12, kg: 6 },
        'Hinged forward, open the arms to the sides, squeeze the shoulder blades.',
        'Inclinado hacia delante, abre los brazos a los lados y junta las escápulas.'),
      ex('Face Pull', { sets: 3, reps: 15, kg: 15 },
        'Rope at face height, pull towards the eyes with elbows high, rotate outwards.',
        'Cuerda a la altura de la cara, tira hacia los ojos con codos altos y rota hacia fuera.'),
      ex('Shrugs', { sets: 3, reps: 12, kg: 30 },
        'Shoulders straight up to the ears, pause, lower; do not roll them.',
        'Hombros hacia las orejas, pausa y baja; sin hacer círculos.'),
    ],
  },
  {
    name: 'Leg Day',
    exercises: [
      ex('Back Squat', { sets: 5, reps: 5, kg: 80 },
        'Bar on the upper back, brace, sit down until thighs reach parallel, knees track the toes.',
        'Barra en la parte alta de la espalda, abdomen firme, baja hasta muslos paralelos, rodillas hacia las puntas.'),
      ex('Romanian Deadlift', { sets: 3, reps: 8, kg: 60 },
        'Soft knees, hips back, bar close to the legs; feel the hamstrings stretch.',
        'Rodillas algo flexionadas, cadera atrás, barra pegada a las piernas; nota el estiramiento femoral.'),
      ex('Leg Press', { sets: 3, reps: 10, kg: 100 },
        'Feet shoulder-width, lower until knees near 90°, do not lock the knees.',
        'Pies al ancho de hombros, baja hasta unos 90° de rodilla, sin bloquear las rodillas.'),
      ex('Walking Lunges', { sets: 3, reps: 12, kg: 10, perSide: true },
        'Long step, back knee near the floor, torso upright, alternate legs.',
        'Paso largo, rodilla de atrás cerca del suelo, torso recto, alterna piernas.'),
      ex('Leg Curl', { sets: 3, reps: 12, kg: 30 },
        'Machine, curl heels towards the glutes, lower under control.',
        'En máquina, lleva los talones hacia los glúteos y baja controlado.'),
      ex('Leg Extension', { sets: 3, reps: 12, kg: 30 },
        'Machine, extend fully, squeeze the quads, lower slowly.',
        'En máquina, extiende del todo, aprieta el cuádriceps y baja despacio.'),
      ex('Standing Calf Raise', { sets: 4, reps: 15, kg: 40 },
        'Full stretch at the bottom, rise onto the toes, pause at the top.',
        'Estira del todo abajo, sube de puntillas y haz una pausa arriba.'),
    ],
  },
  {
    name: 'Core',
    exercises: [
      ex('Plank', { type: 'time', sets: 3, seconds: 60 },
        'Forearms and toes, body in a straight line, glutes tight, breathe.',
        'Antebrazos y puntas de los pies, cuerpo en línea recta, glúteos firmes, respira.'),
      ex('Side Plank', { type: 'time', sets: 3, seconds: 30, perSide: true },
        'On one forearm, hips up in line with shoulders and feet.',
        'Sobre un antebrazo, cadera arriba en línea con hombros y pies.'),
      ex('Crunches', { sets: 3, reps: 20 },
        'Lower back on the floor, lift the shoulders, do not pull on the neck.',
        'Zona lumbar en el suelo, levanta los hombros sin tirar del cuello.'),
      ex('Hanging Leg Raise', { sets: 3, reps: 10 },
        'Hanging from a bar, raise the legs without swinging, curl the pelvis at the top.',
        'Colgado de una barra, sube las piernas sin balanceo y enrolla la pelvis arriba.'),
      ex('Russian Twists', { sets: 3, reps: 20, kg: 5 },
        'Seated, leaning back, feet up if you can, rotate the weight side to side.',
        'Sentado e inclinado atrás, pies en el aire si puedes, gira el peso de lado a lado.'),
      ex('Ab Wheel Rollout', { sets: 3, reps: 10 },
        'From the knees, roll out with a flat back, pull back with the abs.',
        'De rodillas, rueda hacia delante con la espalda recta y vuelve tirando del abdomen.'),
      ex('Dead Bug', { sets: 3, reps: 10, perSide: true },
        'On your back, lower opposite arm and leg slowly, lower back stays down.',
        'Boca arriba, baja brazo y pierna contrarios despacio sin despegar la zona lumbar.'),
      ex('Mountain Climbers', { type: 'time', sets: 3, seconds: 30 },
        'High plank, drive the knees to the chest fast, hips level.',
        'Plancha alta, lleva las rodillas al pecho rápido, cadera estable.'),
    ],
  },
]

/** Out-of-the-box groups, in the same shape as an importable config file. */
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
  ].concat(CLASSIC_GROUPS),
}

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
