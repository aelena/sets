/**
 * Translations and one-off curation of the library. Everything here only ever fills in or renames
 * under a guard; ids (and therefore history) never change.
 */

const yt = name => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form`).replace(/%20/g, '+')}`
const both = (en, es) => `EN: ${en}\nES: ${es}`

/** Spanish names of built-in exercises, by English name. */
export const ES_EXERCISES = {
  'Barbell Curl': 'Curl con barra', 'Dumbbell Curl': 'Curl con mancuernas', 'Hammer Curl': 'Curl martillo',
  'Preacher Curl': 'Curl en banco Scott', 'Concentration Curl': 'Curl concentrado', 'Chin ups': 'Dominadas supinas',
  'Dips': 'Fondos', 'Close-grip Bench Press': 'Press de banca agarre estrecho', 'Skull Crushers': 'Press francés',
  'Tricep Pushdown': 'Extensión de tríceps en polea', 'Overhead Tricep Extension': 'Extensión de tríceps sobre la cabeza',
  'Diamond Push ups': 'Flexiones diamante',
  'Overhead Press': 'Press militar', 'Dumbbell Shoulder Press': 'Press de hombros con mancuernas', 'Lateral Raise': 'Elevaciones laterales',
  'Front Raise': 'Elevaciones frontales', 'Rear Delt Fly': 'Pájaros (deltoides posterior)', 'Face Pull': 'Face pull (tirón a la cara)',
  'Shrugs': 'Encogimientos de hombros',
  'Back Squat': 'Sentadilla trasera', 'Romanian Deadlift': 'Peso muerto rumano', 'Leg Press': 'Prensa de piernas',
  'Walking Lunges': 'Zancadas caminando', 'Leg Curl': 'Curl femoral', 'Leg Extension': 'Extensión de cuádriceps',
  'Standing Calf Raise': 'Elevación de gemelos de pie',
  'Plank': 'Plancha', 'Side Plank': 'Plancha lateral', 'Crunches': 'Abdominales (crunch)', 'Hanging Leg Raise': 'Elevación de piernas colgado',
  'Russian Twists': 'Giros rusos', 'Ab Wheel Rollout': 'Rueda abdominal', 'Dead Bug': 'Dead bug (bicho muerto)', 'Mountain Climbers': 'Escaladores',
  'Deadlift': 'Peso muerto', 'Pull ups': 'Dominadas', 'Lat Pulldown': 'Jalón al pecho', 'Barbell Row': 'Remo con barra',
  'Seated Cable Row': 'Remo sentado en polea', 'One-arm Dumbbell Row': 'Remo con mancuerna a una mano', 'T-bar Row': 'Remo en T',
  'Straight-arm Pulldown': 'Jalón con brazos rectos', 'Back Extension': 'Hiperextensiones',
  'Arm superseries': 'Superserie de brazos', 'Disc routine': 'Rutina con disco',
}

/** Spanish names of built-in groups and activities, by English name. */
export const ES_GROUPS = {
  'Kettlebell Supergroup': 'Superserie de kettlebell', 'My Warm up Routine': 'Mi calentamiento',
  'Biceps': 'Bíceps', 'Triceps': 'Tríceps', 'Shoulders': 'Hombros', 'Leg Day': 'Día de pierna', 'Core': 'Core', 'Back': 'Espalda',
}
export const ES_ACTIVITIES = { 'Running': 'Correr', 'Rowing': 'Remo', 'Gym Bike': 'Bici estática' }

/** A clashing pack group is added as "Back (classic)"; the label, per language. */
export const CLASH_LABEL = { classic: { en: 'classic', es: 'clásico' }, starter: { en: 'starter', es: 'inicial' } }

/**
 * curate-1 (2026-10-16): the first hand-built library, named properly in English and Spanish.
 * Each change applies only while the exercise still has the id and the name it was created with,
 * so it is a no-op on any other phone and never overrides a later edit. The user's own notes
 * (`note`) are kept as an extra line under the new description.
 */
const fix = (id, from, name, es, muscles, en, esDesc, note) => ({
  id, from, set: { name, names: { es }, muscles, link: yt(name), desc: both(en, esDesc) + (note ? `\n${note}` : '') },
})

export const CURATE_1 = {
  id: 'curate-1',
  kind: 'curate',
  exercises: [
    fix('polea-alta-al-pecho', 'Polea alta al pecho', 'Lat Pulldown', 'Jalón al pecho', ['back', 'biceps'],
      'Pull the bar to the upper chest, elbows down and back, no leaning far back.',
      'Lleva la barra a la parte alta del pecho, codos abajo y atrás, sin echarte muy atrás.', 'De 52 en adelante.'),
    fix('polea-alta-divergente', 'Polea alta divergente', 'Iso-lateral Lat Pulldown', 'Jalón al pecho divergente', ['back', 'biceps'],
      'Machine with independent handles: pull each one down to the upper chest, elbows down and back.',
      'Máquina con agarres independientes: lleva cada uno a la parte alta del pecho, codos abajo y atrás.', 'Empezar en 52 y luego 59.'),
    fix('polea-alta-agarre-entrecho', 'Polea alta agarre entrecho', 'Close-grip Lat Pulldown', 'Jalón al pecho agarre estrecho', ['back', 'biceps'],
      'Close or neutral grip, pull to the upper chest, keep the torso still.',
      'Agarre estrecho o neutro, lleva la barra a la parte alta del pecho sin balancear el torso.', '52 52 59'),
    fix('remo-sentado', 'Remo Sentado', 'Seated Cable Row', 'Remo sentado en polea', ['back', 'biceps'],
      'Chest up, pull the handle to the stomach, squeeze the shoulder blades.',
      'Pecho arriba, lleva el agarre al abdomen y junta las escápulas.'),
    fix('remo-sentado-divergente', 'Remo Sentado Divergente', 'Iso-lateral Seated Row', 'Remo sentado divergente', ['back', 'biceps'],
      'Machine with independent handles, chest on the pad, row each handle back and squeeze the shoulder blades.',
      'Máquina con agarres independientes, pecho apoyado, tira de cada agarre hacia atrás y junta las escápulas.'),
    fix('rear-deltoids', 'Rear deltoids', 'Reverse Pec Deck', 'Contractora inversa (deltoides posterior)', ['shoulders', 'back'],
      'On the pec deck facing the pad, arms almost straight, open them back to shoulder height.',
      'En la contractora mirando al respaldo, brazos casi rectos, ábrelos hacia atrás a la altura de los hombros.',
      'La misma máquina que fly pectorales pero hacia atrás.'),
    fix('extension-espalda', 'Extensión espalda', 'Back Extension Machine', 'Extensión lumbar en máquina', ['back', 'glutes'],
      'Seated, pad on the upper back, extend from the hips under control, do not overarch.',
      'Sentado, rodillo en la parte alta de la espalda, extiende desde la cadera de forma controlada sin hiperextender.', '70 kilos en adelante.'),
    fix('polea-ajustable-hacia-delante', 'Polea ajustable hacia delante', 'Overhead Cable Tricep Extension', 'Extensión de tríceps sobre la cabeza en polea', ['triceps'],
      'Facing away from the cable, rope behind the head, extend the arms forward; the elbows stay high.',
      'De espaldas a la polea, cuerda detrás de la cabeza, extiende los brazos hacia delante; los codos se quedan arriba.',
      'La polea queda a nuestra espalda: tirar del agarre de cuerdas desde la posición de tríceps contraído hasta extender el brazo por delante.'),
    fix('polea-ajustable-hacia-la-cabeza', 'Polea Ajustable hacia la cabeza', 'Face Pull', 'Face pull (tirón a la cara)', ['shoulders', 'back'],
      'Rope at face height, pull towards the eyes with elbows high, rotate outwards.',
      'Cuerda a la altura de la cara, tira hacia los ojos con codos altos y rota hacia fuera.',
      'Frente a la polea, que está arriba: con las cuerdas tiramos hacia la cara, abriendo las cuerdas.'),
    fix('dominadas', 'Dominadas', 'Pull ups', 'Dominadas', ['back', 'biceps'],
      'Palms away, pull the chest towards the bar, full hang at the bottom.',
      'Palmas hacia fuera, lleva el pecho hacia la barra, cuelga del todo abajo.'),
    fix('curl-biceps-caida-hacia-dentro', 'Curl bíceps caída hacia dentro', 'Cross-body Hammer Curl', 'Curl martillo cruzado', ['biceps', 'forearms'],
      'Neutral grip, curl the dumbbell across the body towards the opposite shoulder.',
      'Agarre neutro, sube la mancuerna cruzando hacia el hombro contrario.', 'Ejercicio 3 de la superserie de brazos.'),
    fix('curl-muneca-sentado', 'Curl muñeca sentado', 'Seated Barbell Wrist Curl', 'Curl de muñeca sentado con barra', ['forearms'],
      'Forearms on the thighs, palms up, curl the bar with the wrists only.',
      'Antebrazos sobre los muslos, palmas arriba, sube la barra solo con las muñecas.'),
    fix('giro-munecas-media-altura', 'Giro muñecas media altura', 'Wrist Roller', 'Rodillo de muñecas', ['forearms'],
      'Arms out at shoulder height, roll the weight up by twisting the wrists, then down slowly.',
      'Brazos al frente a la altura de los hombros, enrolla el peso girando las muñecas y desenróllalo despacio.', 'Dos brazos a la vez.'),
    fix('peso-libre-vertical-codo-atras', 'Peso libre vertical codo atras', 'Dumbbell Curl, top half (21s)', 'Curl con mancuerna, mitad superior (21)', ['biceps'],
      'Upper arm held level in front, curl only from 90° up to the shoulder; the elbow does not move.',
      'Brazo en horizontal delante, sube solo desde 90° hasta el hombro; el codo no se mueve.',
      'Mancuerna con el brazo en horizontal hacia delante, a la altura del hombro; el codo no se mueve.'),
    fix('peso-libre-mancuerna-hacia-abajo-hasta-la-mitad', 'Peso libre mancuerna desde abajo hasta la mitad', 'Dumbbell Curl, bottom half (21s)', 'Curl con mancuerna, mitad inferior (21)', ['biceps'],
      'Arm hanging, curl from the bottom only up to 90° (forearm level), lower slowly.',
      'Brazo estirado, sube desde abajo solo hasta 90° (antebrazo en horizontal) y baja despacio.',
      'Como el anterior, pero de abajo al medio en lugar de arriba.'),
    { id: 'arm-superseries', from: 'Arm superseries', set: { names: { es: 'Superserie de brazos' }, muscles: ['biceps', 'forearms', 'shoulders'],
      desc: both('The superseries of curls, forearms and shoulders.', 'La superserie de curls, antebrazos y hombro.') } },
    { id: 'disc-routine', from: 'Disc routine', set: { names: { es: 'Rutina con disco' }, muscles: ['shoulders'],
      desc: both('Plate superseries: front, lateral and halos, 1, 1, 1, 2, 2, 3.', 'Superserie con disco a frente, lateral y halos: 1, 1, 1, 2, 2, 3.') } },
  ],
  groups: [
    { id: 'nuevo-grupo', from: 'Espalda', set: { name: 'Back', names: { es: 'Espalda' } } },
    { id: 'nuevo-grupo-2', from: 'Funcional', set: { name: 'Functional', names: { es: 'Funcional' } } },
    { id: 'nuevo-grupo-3', from: 'Amtebrazos', set: { name: 'Forearms', names: { es: 'Antebrazos' } } },
  ],
  /** Same exercise twice: `from` (built-in, never used) folds into `into` (the user's, with history). */
  merges: [{ from: 'face-pull', fromName: 'Face Pull', into: 'polea-ajustable-hacia-la-cabeza' }],
}
