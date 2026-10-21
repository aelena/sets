/**
 * 2026-10-21 (0.11.0): a review of the main groups (missing staples appended to each), the user's
 * push-up superseries in their warm-up, and the Pec Deck renamed so it reads as the pectoral fly.
 * Add-only; the review packs only append to groups that exist (a deleted group is not recreated).
 */
const yt = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q).replace(/%20/g, '+')}`
const both = (en, es) => `EN: ${en}\nES: ${es}`
const ex = (name, es, target, muscles, en, esDesc, search = `${name} proper form`) =>
  ({ name, names: { es }, ...target, muscles, desc: both(en, esDesc), link: yt(search) })

export const REVIEW = {
  chest: [
    ex('Incline Dumbbell Fly', 'Aperturas inclinadas con mancuernas', { sets: 3, reps: 12, kg: 10 }, ['chest', 'shoulders'],
      'Bench at 30°, slight bend in the elbows, open wide until a stretch in the upper chest, hug back up.',
      'Banco a 30°, codos algo flexionados, abre hasta notar el estiramiento del pecho superior y cierra como un abrazo.'),
    ex('Low-to-High Cable Fly', 'Cruce de poleas de abajo arriba', { sets: 3, reps: 12, kg: 10 }, ['chest', 'shoulders'],
      'Cables low, sweep the hands up and together to chin height; works the upper chest.',
      'Poleas bajas, sube las manos en arco hasta juntarlas a la altura de la barbilla; trabaja el pecho superior.'),
    ex('Dumbbell Pullover', 'Pullover con mancuerna', { sets: 3, reps: 12, kg: 16 }, ['chest', 'back'],
      'Lying across a bench, one dumbbell held over the chest, lower it behind the head with slightly bent arms, pull back over.',
      'Tumbado sobre el banco, una mancuerna sobre el pecho, bájala por detrás de la cabeza con los brazos algo flexionados y vuelve.'),
  ],
  biceps: [
    ex('EZ-bar Curl', 'Curl con barra Z', { sets: 3, reps: 10, kg: 20 }, ['biceps', 'forearms'],
      'Angled grip on the EZ bar, elbows at your sides, curl up and lower slowly; easier on the wrists.',
      'Agarre en los ángulos de la barra Z, codos pegados, sube y baja despacio; más cómodo para las muñecas.'),
    ex('Incline Dumbbell Curl', 'Curl inclinado con mancuernas', { sets: 3, reps: 10, kg: 8 }, ['biceps'],
      'Seated on a bench at 45°, arms hanging behind the body, curl without moving the elbows; long stretch.',
      'Sentado en un banco a 45°, brazos colgando por detrás del cuerpo, sube sin mover los codos; gran estiramiento.'),
    ex('Cable Curl', 'Curl en polea', { sets: 3, reps: 12, kg: 15 }, ['biceps'],
      'Low cable with a bar or rope, elbows fixed, constant tension through the whole curl.',
      'Polea baja con barra o cuerda, codos fijos, tensión constante en todo el recorrido.'),
    ex('Spider Curl', 'Curl araña', { sets: 3, reps: 10, kg: 8 }, ['biceps'],
      'Chest on an incline bench, arms hanging straight down, curl up and squeeze at the top.',
      'Pecho apoyado en un banco inclinado, brazos colgando en vertical, sube y aprieta arriba.'),
  ],
  triceps: [
    ex('Tricep Kickback', 'Patada de tríceps', { sets: 3, reps: 12, kg: 6, perSide: true }, ['triceps'],
      'Hinged forward, upper arm along the body, extend the forearm back until straight, squeeze.',
      'Inclinado hacia delante, brazo pegado al cuerpo, extiende el antebrazo hacia atrás hasta estirarlo y aprieta.'),
    ex('Bench Dips', 'Fondos en banco', { sets: 3, reps: 12 }, ['triceps', 'chest'],
      'Hands on a bench behind you, legs out, lower until the elbows reach about 90°, press back up.',
      'Manos en un banco por detrás, piernas estiradas, baja hasta unos 90° de codo y empuja hacia arriba.'),
  ],
  shoulders: [
    ex('Arnold Press', 'Press Arnold', { sets: 3, reps: 10, kg: 12 }, ['shoulders', 'triceps'],
      'Dumbbells at the chest, palms facing you; rotate the palms out as you press overhead, reverse on the way down.',
      'Mancuernas al pecho con las palmas hacia ti; gíralas hacia fuera al empujar arriba y vuelve girando al bajar.'),
    ex('Cable Lateral Raise', 'Elevación lateral en polea', { sets: 3, reps: 12, kg: 5, perSide: true }, ['shoulders'],
      'Low cable across the body, raise the arm out to shoulder height, lower slowly; constant tension.',
      'Polea baja cruzando por delante, sube el brazo hasta la altura del hombro y baja despacio; tensión constante.'),
  ],
  legs: [
    ex('Goblet Squat', 'Sentadilla goblet', { sets: 3, reps: 12, kg: 16 }, ['quads', 'glutes'],
      'Kettlebell or dumbbell at the chest, sit down between the knees with the chest up, drive back up.',
      'Kettlebell o mancuerna al pecho, baja entre las rodillas con el pecho alto y sube empujando.'),
    ex('Front Squat', 'Sentadilla frontal', { sets: 4, reps: 6, kg: 50 }, ['quads', 'glutes', 'core'],
      'Bar on the front of the shoulders, elbows high, torso upright, squat to parallel or below.',
      'Barra delante sobre los hombros, codos altos, torso erguido, baja hasta paralelo o más.'),
    ex('Hack Squat', 'Sentadilla hack', { sets: 3, reps: 10, kg: 60 }, ['quads', 'glutes'],
      'Machine, back on the pad, feet shoulder-width, lower until the thighs are parallel, press up.',
      'En máquina, espalda en el respaldo, pies al ancho de hombros, baja hasta muslos paralelos y empuja.'),
    ex('Step-ups', 'Subidas al cajón', { sets: 3, reps: 10, kg: 10, perSide: true }, ['quads', 'glutes'],
      'Step onto a box with the whole foot, drive up through the heel, control the way down.',
      'Sube al cajón con todo el pie, empuja con el talón y baja controlando.'),
    ex('Seated Calf Raise', 'Elevación de gemelos sentado', { sets: 4, reps: 15, kg: 30 }, ['calves'],
      'Seated, pad on the knees, full stretch at the bottom, rise and pause at the top.',
      'Sentado, almohadilla sobre las rodillas, estira del todo abajo, sube y haz una pausa arriba.'),
  ],
  back: [
    ex('Bent-over Dumbbell Row', 'Remo inclinado con mancuernas', { sets: 3, reps: 10, kg: 16 }, ['back', 'biceps'],
      'Hinged over with a flat back, a dumbbell in each hand, pull them up along your sides by bending the elbows, lower slowly.',
      'Inclinado con la espalda recta, una mancuerna en cada mano, súbelas pegadas al costado doblando los codos y baja despacio.'),
    ex('Inverted Row', 'Remo invertido', { sets: 3, reps: 10 }, ['back', 'biceps'],
      'Under a bar at hip height, body straight, pull the chest to the bar, lower under control.',
      'Bajo una barra a la altura de la cadera, cuerpo recto, lleva el pecho a la barra y baja controlando.'),
    ex('Chest-supported Row', 'Remo con pecho apoyado', { sets: 3, reps: 10, kg: 16 }, ['back', 'biceps'],
      'Chest on an incline bench, row the dumbbells to the hips; no swinging possible.',
      'Pecho apoyado en un banco inclinado, rema las mancuernas hacia la cadera; sin balanceo posible.'),
  ],
  core: [
    ex('Hollow Hold', 'Hollow (barca hueca)', { type: 'time', sets: 3, seconds: 30 }, ['core'],
      'On your back, lower back pressed down, arms and legs straight and just off the floor, hold.',
      'Boca arriba, zona lumbar pegada al suelo, brazos y piernas estirados y despegados del suelo, aguanta.'),
    ex('Pallof Press', 'Press Pallof', { sets: 3, reps: 10, kg: 10, perSide: true }, ['core'],
      'Side-on to a cable at chest height, press the handle straight out and resist the twist.',
      'De lado a una polea a la altura del pecho, empuja el agarre al frente y resiste el giro.'),
    ex('Cable Crunch', 'Crunch en polea', { sets: 3, reps: 15, kg: 25 }, ['core'],
      'Kneeling, rope by the head, curl the ribs towards the hips; the hips do not move.',
      'De rodillas, cuerda junto a la cabeza, lleva las costillas hacia la cadera; la cadera no se mueve.'),
    ex('Bicycle Crunch', 'Abdominales bicicleta', { sets: 3, reps: 20 }, ['core'],
      'Alternate elbow to opposite knee while the other leg extends, slow and controlled.',
      'Alterna codo a rodilla contraria mientras la otra pierna se estira, lento y controlado.'),
  ],
}

/** The user's own superseries, in their warm-up: one round = one set. */
export const PUSHUP_SUPERSERIES = {
  name: 'Push-up Touch Superseries', names: { es: 'Superserie de flexiones y toques' },
  sets: 1, reps: 1, muscles: ['chest', 'triceps', 'shoulders', 'core'],
  desc: both(
    'One round, a push-up (PU) before each move: PU + touch left shoulder, PU + right shoulder, PU + left knee, PU + right knee, PU + left ankle, PU + right ankle, PU + left climber, PU + right climber, PU + left cross climber, PU + right cross climber, PU + left leg out to the side, knee towards the shoulder, PU + same with the right, PU + touch left foot, PU + touch right foot; then 10 Mike Tyson push-ups and 5 push-ups to finish (29 push-ups).',
    'Una ronda, una flexión (F) antes de cada movimiento: F + tocar hombro izquierdo, F + hombro derecho, F + rodilla izquierda, F + rodilla derecha, F + tobillo izquierdo, F + tobillo derecho, F + escalador izquierdo, F + escalador derecho, F + escalador cruzado izquierdo, F + escalador cruzado derecho, F + pierna izquierda por fuera con la rodilla hacia el hombro, F + igual con la derecha, F + tocar pie izquierdo, F + tocar pie derecho; después 10 flexiones Mike Tyson y 5 flexiones para terminar (29 flexiones).'),
  link: yt('push up shoulder tap mountain climber combo'),
}

/** curate-4: the Pec Deck reads as the pectoral fly it is. */
export const CURATE_4 = {
  id: 'curate-4',
  kind: 'curate',
  exercises: [
    { id: 'pectoral-fly', from: 'Pec Deck', set: { name: 'Pectoral Fly (Pec Deck)', names: { es: 'Contractora (aperturas en máquina)' } } },
    { id: 'pec-deck', from: 'Pec Deck', set: { name: 'Pectoral Fly (Pec Deck)', names: { es: 'Contractora (aperturas en máquina)' } } },
  ],
}
