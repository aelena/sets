/**
 * 2026-11-04 (0.15.0): from the user's posters. More pelvic-floor work for the Kegels groups (men
 * and women), a Military Calisthenics group (28-day + 30-day challenges), a Bodyweight group (the
 * seven-column chart), two gym staples the weekly plan had and the library did not, and a curation
 * pass over the hand-made exercises still without proper names. Add-only; every target is 4 sets.
 */
const yt = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q).replace(/%20/g, '+')}`
const both = (en, es) => `EN: ${en}\nES: ${es}`
const ex = (name, es, target, muscles, en, esDesc, search = `${name} proper form`) =>
  ({ name, names: { es }, ...target, muscles, desc: both(en, esDesc), link: yt(search) })
const reps = (n, extra = {}) => ({ sets: 4, reps: n, ...extra })
const secs = (n, extra = {}) => ({ type: 'time', sets: 4, seconds: n, ...extra })
const side = { perSide: true }

// Moves shared by several groups below: the same object in each pack, so every pack resolves it
// to the one exercise (by name) whatever order the packs arrive in.
const AIR_SQUATS = ex('Air Squats', 'Sentadillas sin peso', reps(20), ['quads', 'glutes'],
  'Feet shoulder-width, sit the hips back and down to parallel with the chest up, drive through the heels to stand.',
  'Pies al ancho de hombros, lleva la cadera atrás y abajo hasta paralelo con el pecho alto, empuja con los talones para subir.',
  'bodyweight squat proper form')
const LUNGES = ex('Lunges', 'Zancadas', reps(10, side), ['quads', 'glutes'],
  'Step forward, lower the back knee to just off the floor, push back to standing; alternate legs.',
  'Da un paso adelante, baja la rodilla de atrás hasta casi tocar el suelo y vuelve empujando; alterna piernas.',
  'forward lunge proper form')
const LYING_LEG_RAISES = ex('Lying Leg Raises', 'Elevación de piernas tumbado', reps(15), ['core'],
  'On your back, hands under the hips, raise straight legs to vertical and lower slowly without the lower back arching.',
  'Boca arriba, manos bajo la cadera, sube las piernas rectas hasta la vertical y baja despacio sin arquear la lumbar.')
const FLUTTER_KICKS = ex('Flutter Kicks', 'Patadas de tijera (flutter)', secs(30), ['core'],
  'On your back, legs straight and low, kick up and down fast and small, lower back on the floor.',
  'Boca arriba, piernas rectas y bajas, patea arriba y abajo rápido y corto, lumbar pegada al suelo.')
const HIGH_KNEES = ex('High Knees', 'Rodillas arriba', secs(30), ['quads', 'fullBody'],
  'Run on the spot driving the knees to hip height, fast, arms pumping.',
  'Corre en el sitio llevando las rodillas a la altura de la cadera, rápido, brazos en movimiento.')
const SHOULDER_TAPS = ex('Shoulder Taps', 'Toques de hombro', reps(20), ['core', 'shoulders'],
  'High plank, tap the opposite shoulder with one hand without the hips rocking; alternate.',
  'Plancha alta, toca el hombro contrario con una mano sin que la cadera se balancee; alterna.',
  'plank shoulder taps proper form')
const SIT_UPS = ex('Sit-ups', 'Abdominales completos', reps(20), ['core'],
  'On your back, knees bent, come all the way up to sitting and lower slowly; hands at the temples, not pulling.',
  'Boca arriba, rodillas flexionadas, sube hasta sentarte y baja despacio; manos en las sienes, sin tirar.')
const REVERSE_CRUNCHES = ex('Reverse Crunches', 'Crunch inverso', reps(15), ['core'],
  'On your back, knees bent over the hips, curl the pelvis up and bring the knees towards the chest; lower without dropping.',
  'Boca arriba, rodillas sobre la cadera, enrolla la pelvis y lleva las rodillas hacia el pecho; baja sin dejar caer.')
const V_UPS = ex('V-ups', 'Abdominales en V', reps(15), ['core'],
  'Lying flat, lift legs and torso together to touch the toes, forming a V; lower under control.',
  'Tumbado, sube piernas y tronco a la vez hasta tocar los pies formando una V; baja controlado.',
  'v-ups abs proper form')
const WALL_SIT = ex('Wall Sit', 'Sentadilla isométrica en pared', secs(60), ['quads', 'glutes'],
  'Back flat on the wall, slide down until the thighs are parallel, knees over the ankles; hold.',
  'Espalda pegada a la pared, baja hasta muslos paralelos, rodillas sobre los tobillos; mantén.')

/* ---------- Kegels: shared pelvic-floor moves, then each body's own ---------- */

const KEGEL_SHARED = [
  ex('Pelvic Tilts', 'Basculación pélvica', reps(12), ['pelvicFloor', 'core'],
    'On your back, knees bent: flatten the lower back into the floor by tilting the pelvis and tightening belly and pelvic floor, then release.',
    'Boca arriba, rodillas flexionadas: pega la zona lumbar al suelo basculando la pelvis y apretando abdomen y suelo pélvico, luego suelta.',
    'pelvic tilt exercise proper form'),
  ex('Bird Dog', 'Perro de caza', reps(10, side), ['core', 'glutes', 'pelvicFloor'],
    'On hands and knees, extend one arm and the opposite leg until level with the back, pelvic floor lightly engaged; hold a second and switch.',
    'A cuatro patas, extiende un brazo y la pierna contraria hasta la altura de la espalda, suelo pélvico ligeramente activo; mantén un segundo y cambia.'),
  ex('Clamshells', 'Almejas', reps(15, side), ['glutes', 'pelvicFloor'],
    'On your side, knees bent and feet together: open the top knee like a shell without rolling the hips, squeeze the pelvic floor as it opens.',
    'De lado, rodillas flexionadas y pies juntos: abre la rodilla de arriba como una almeja sin girar la cadera, aprieta el suelo pélvico al abrir.',
    'clamshell exercise proper form'),
  ex('Side-lying Leg Lifts', 'Elevación lateral de pierna tumbado', reps(12, side), ['glutes'],
    'On your side, lift the straight top leg to hip height and lower slowly; keep the hips stacked.',
    'De lado, sube la pierna de arriba estirada hasta la altura de la cadera y baja despacio; cadera alineada.',
    'side lying leg raise proper form'),
  AIR_SQUATS,
]

export const KEGELS_MEN_2 = [
  ...KEGEL_SHARED,
  LUNGES,
  ex('Knee to Chest', 'Rodilla al pecho', reps(10, side), ['pelvicFloor', 'glutes'],
    'On your back, pull one knee to the chest with both hands, hold a few breaths while the pelvic floor relaxes, switch.',
    'Boca arriba, lleva una rodilla al pecho con las dos manos, mantén unas respiraciones relajando el suelo pélvico, cambia.',
    'knee to chest stretch'),
  ex('Leg Lifts', 'Elevación de pierna tumbado', reps(10, side), ['core', 'pelvicFloor'],
    'On your back, one knee bent, lift the other leg straight up to 45° and lower without arching; tighten the pelvic floor as it rises.',
    'Boca arriba, una rodilla flexionada, sube la otra pierna estirada hasta 45° y baja sin arquear; aprieta el suelo pélvico al subir.',
    'single leg lift lying proper form'),
  ex('Seated Marches', 'Marcha sentado', reps(20), ['pelvicFloor', 'core'],
    'Sitting tall on a chair, lift one knee a few centimetres then the other, pelvic floor gently engaged, no leaning back.',
    'Sentado erguido en una silla, levanta una rodilla unos centímetros y luego la otra, suelo pélvico suavemente activo, sin echarte atrás.',
    'seated march exercise'),
  ex('Ball Squeeze', 'Apretar la pelota entre las rodillas', reps(12), ['pelvicFloor'],
    'Seated, a ball or cushion between the knees: squeeze for 5 seconds together with the pelvic floor, release.',
    'Sentado, una pelota o cojín entre las rodillas: aprieta 5 segundos a la vez que el suelo pélvico y suelta.',
    'ball squeeze between knees pelvic floor'),
  ex('Standing Leg Lifts', 'Elevación de pierna de pie', reps(12, side), ['glutes', 'pelvicFloor'],
    'Standing, hand on a wall, lift one straight leg to the side and lower slowly; stay tall.',
    'De pie, mano en la pared, sube una pierna estirada hacia el lado y baja despacio; mantente erguido.',
    'standing side leg lift proper form'),
  ex('Fire Hydrants', 'Patada lateral a cuatro patas', reps(15, side), ['glutes'],
    'On hands and knees, lift one bent knee out to the side to hip height, lower under control.',
    'A cuatro patas, sube una rodilla flexionada hacia el lado hasta la altura de la cadera y baja controlado.',
    'fire hydrant exercise proper form'),
  ex('Cat-Cow', 'Gato-vaca', reps(10), ['core', 'pelvicFloor'],
    'On hands and knees, round the back up as you exhale and lift the pelvic floor, then let the belly drop and the pelvic floor relax as you inhale.',
    'A cuatro patas, redondea la espalda al exhalar subiendo el suelo pélvico, luego deja caer el vientre y relaja el suelo pélvico al inhalar.',
    'cat cow stretch'),
  ex('Reverse Plank', 'Plancha inversa', secs(20), ['glutes', 'core'],
    'Sitting with legs straight and hands behind you, lift the hips until the body is a straight line, squeeze glutes and pelvic floor.',
    'Sentado con las piernas estiradas y las manos detrás, sube la cadera hasta formar una línea recta, aprieta glúteos y suelo pélvico.'),
  ex('Butterfly Stretch', 'Mariposa', secs(30), ['pelvicFloor'],
    'Seated, soles of the feet together, let the knees drop; lean forward slightly and breathe into the pelvic floor.',
    'Sentado, plantas de los pies juntas, deja caer las rodillas; inclínate un poco hacia delante y respira hacia el suelo pélvico.',
    'butterfly stretch'),
  ex('Hip Flexor Stretch', 'Estiramiento del flexor de cadera', secs(30, side), ['pelvicFloor'],
    'Half-kneeling, push the hips forward until the front of the back hip stretches; breathe and let the pelvic floor relax.',
    'Con una rodilla en el suelo, empuja la cadera hacia delante hasta notar el estiramiento delante de la cadera de atrás; respira y relaja el suelo pélvico.',
    'kneeling hip flexor stretch'),
  ex('Relaxation Breathing', 'Respiración de relajación', secs(60), ['pelvicFloor'],
    'Lying flat, breathe slowly into the belly; on each breath in let the pelvic floor soften and drop, on each breath out let it return. Ends the session.',
    'Tumbado, respira despacio hacia el vientre; al inspirar deja que el suelo pélvico se ablande y baje, al espirar que vuelva. Cierra la sesión.',
    'pelvic floor relaxation breathing men'),
]

export const KEGELS_WOMEN_2 = [
  ...KEGEL_SHARED,
  WALL_SIT,
  ex('Heel Slides', 'Deslizamiento de talón', reps(10, side), ['core', 'pelvicFloor'],
    'On your back, knees bent: slide one heel away until the leg is straight and back, pelvic floor and lower belly lightly engaged, back still.',
    'Boca arriba, rodillas flexionadas: desliza un talón hasta estirar la pierna y vuelve, suelo pélvico y bajo vientre ligeramente activos, espalda quieta.',
    'heel slides pelvic floor'),
  ex('Seated Pelvic Floor Contractions', 'Contracciones del suelo pélvico sentada', reps(10), ['pelvicFloor'],
    'Sit tall on a chair, feet flat: squeeze and lift the pelvic floor for 5 seconds, relax fully for 5.',
    'Sentada erguida en una silla, pies apoyados: aprieta y eleva el suelo pélvico 5 segundos, relaja del todo otros 5.',
    'seated pelvic floor contraction women'),
  ex('Standing Pelvic Floor Contractions', 'Contracciones del suelo pélvico de pie', reps(10), ['pelvicFloor'],
    'Standing tall and calm, squeeze and lift for 5 seconds, release fully; gravity makes it harder than lying down.',
    'De pie, erguida y tranquila, aprieta y eleva 5 segundos y suelta del todo; la gravedad lo hace más difícil que tumbada.',
    'standing pelvic floor contraction women'),
  ex('Marching in Place', 'Marcha en el sitio', reps(20), ['pelvicFloor', 'core'],
    'Standing, lift one knee then the other at a calm pace, pelvic floor gently engaged, torso tall.',
    'De pie, sube una rodilla y luego la otra a ritmo tranquilo, suelo pélvico suavemente activo, torso erguido.',
    'marching in place pelvic floor'),
  ex('Modified Plank', 'Plancha sobre rodillas', secs(30), ['core', 'pelvicFloor'],
    'Forearms and knees on the floor, body straight from head to knees; pelvic floor and belly gently engaged, breathe.',
    'Antebrazos y rodillas en el suelo, cuerpo recto de la cabeza a las rodillas; suelo pélvico y abdomen suavemente activos, respira.',
    'knee plank proper form'),
  ex('Deep Belly Breathing', 'Respiración abdominal profunda', secs(60), ['pelvicFloor'],
    'Seated or lying, breathe slowly into the belly: the pelvic floor drops on the inhale and lifts gently on the exhale.',
    'Sentada o tumbada, respira despacio hacia el vientre: el suelo pélvico baja al inspirar y sube suavemente al espirar.',
    'diaphragmatic breathing pelvic floor'),
  ex("Happy Baby Pose", 'Postura del bebé feliz', secs(30), ['pelvicFloor'],
    'On your back, hold the outsides of the feet with the knees wide towards the armpits; breathe and let the pelvic floor open.',
    'Boca arriba, agarra los pies por fuera con las rodillas abiertas hacia las axilas; respira y deja que el suelo pélvico se abra.',
    'happy baby pose'),
  ex("Child's Pose", 'Postura del niño', secs(30), ['pelvicFloor'],
    'Kneel and sit back on the heels, arms stretched forward, forehead down; slow breaths, pelvic floor relaxed.',
    'Arrodíllate y siéntate sobre los talones, brazos estirados hacia delante, frente al suelo; respiraciones lentas, suelo pélvico relajado.',
    "child's pose"),
]

/* ---------- Military Calisthenics: the 28-day sequence, then what the 30-day plan adds ---------- */

export const MILITARY = {
  name: 'Military Calisthenics', names: { es: 'Calistenia militar' },
  exercises: [
    'Push ups',
    AIR_SQUATS,
    'Plank',
    LUNGES,
    'Pull ups',
    'Dips',
    'Mountain Climbers',
    'Wide Push ups',
    LYING_LEG_RAISES,
    'Diamond Push ups',
    'Decline Push ups',
    ex('Inchworm', 'Oruga', reps(10), ['fullBody', 'core'],
      'From standing, hands to the floor, walk them out to a plank, do a push-up if you like, walk the feet back in and stand.',
      'De pie, manos al suelo, camina con ellas hasta la plancha, haz una flexión si quieres, acerca los pies caminando y levántate.',
      'inchworm exercise proper form'),
    'Side Plank',
    ex('Jump Squats', 'Sentadillas con salto', reps(15), ['quads', 'glutes'],
      'Squat down and explode up into a jump, land softly into the next squat.',
      'Baja en sentadilla y explota en un salto, aterriza suave en la siguiente sentadilla.'),
    'Burpees',
    'Crunches',
    'Pike Push ups',
    'Step-ups',
    V_UPS,
    ex('Superman Hold', 'Superman isométrico', secs(20), ['back', 'glutes'],
      'Face down, lift arms, chest and legs off the floor and hold, looking down.',
      'Boca abajo, despega brazos, pecho y piernas del suelo y mantén, mirando al suelo.',
      'superman hold exercise'),
    'Walking Lunges',
    ex('Commando Plank', 'Plancha comando', reps(10, side), ['core', 'shoulders', 'triceps'],
      'From a forearm plank, press up onto one hand then the other, lower back down one arm at a time; hips still.',
      'Desde plancha de antebrazos, sube a una mano y luego a la otra, baja de brazo en brazo; cadera quieta.',
      'commando plank up down plank'),
    ex('Pistol Squats', 'Sentadilla a una pierna (pistol)', reps(6, side), ['quads', 'glutes'],
      'Stand on one leg, the other straight in front, lower as far as you control and stand; hold a post if needed.',
      'De pie sobre una pierna, la otra estirada delante, baja hasta donde controles y sube; agárrate a un poste si hace falta.',
      'pistol squat progression'),
    ex('Knee to Elbow', 'Rodilla al codo', reps(20), ['core'],
      'Standing, lift one knee and bring the opposite elbow to it, twisting the torso; alternate at a quick pace.',
      'De pie, sube una rodilla y lleva el codo contrario a ella girando el tronco; alterna a ritmo rápido.',
      'standing knee to elbow exercise'),
    'Archer Push ups',
    'Hollow Hold',
    ex('Split Squats', 'Sentadilla dividida', reps(12, side), ['quads', 'glutes'],
      'Staggered stance, lower straight down until the back knee nearly touches, stand; keep the same stance for all reps.',
      'Un pie adelante y otro atrás, baja en vertical hasta que la rodilla de atrás casi toque y sube; misma posición en todas las reps.'),
    ex('Burpee Pull ups', 'Burpee con dominada', reps(8), ['fullBody', 'back'],
      'A burpee under the bar; jump up, grab it and do a pull-up, drop and repeat.',
      'Un burpee bajo la barra; salta, agárrala y haz una dominada, suelta y repite.',
      'burpee pull up proper form'),
    // the 30-day plan's extras
    SHOULDER_TAPS,
    ex('Pike Hold', 'Pica isométrica', secs(20), ['shoulders', 'core'],
      'Hips high in an inverted V, arms straight, weight on the hands; hold.',
      'Cadera alta en V invertida, brazos estirados, peso sobre las manos; mantén.',
      'pike hold exercise'),
    HIGH_KNEES,
    'Glute Bridge',
    ex('Reverse Lunges', 'Zancadas hacia atrás', reps(12, side), ['quads', 'glutes'],
      'Step back, lower the back knee towards the floor, return; easier on the knees than forward lunges.',
      'Da un paso atrás, baja la rodilla de atrás hacia el suelo y vuelve; más suave para las rodillas que la zancada hacia delante.'),
    'Bicycle Crunch',
    FLUTTER_KICKS,
    'Bench Dips',
    ex('Push-up Hold', 'Flexión isométrica', secs(20), ['chest', 'triceps', 'core'],
      'Hold the bottom of a push-up, chest a fist from the floor, body straight.',
      'Mantén la posición baja de la flexión, el pecho a un puño del suelo, cuerpo recto.',
      'push up hold bottom position'),
    'Russian Twists',
    ex('Bear Crawl', 'Marcha del oso', secs(20), ['fullBody', 'core'],
      'On hands and feet with the knees an inch off the floor, crawl forward moving opposite hand and foot together.',
      'Sobre manos y pies con las rodillas a un dedo del suelo, avanza moviendo a la vez mano y pie contrarios.'),
    ex('Hip Openers', 'Apertura de cadera', reps(10, side), ['glutes'],
      'Standing, lift a knee, swing it out to the side and down in a circle; opens the hip before legs.',
      'De pie, sube una rodilla, llévala en círculo hacia fuera y abajo; abre la cadera antes de pierna.',
      'standing hip opener exercise'),
  ],
}

/* ---------- Bodyweight: the seven-column chart, column by column ---------- */

export const BODYWEIGHT = {
  name: 'Bodyweight', names: { es: 'Peso corporal' },
  exercises: [
    // abs
    SIT_UPS, REVERSE_CRUNCHES, 'Bicycle Crunch', FLUTTER_KICKS, LYING_LEG_RAISES, 'Plank',
    // quads
    LUNGES, HIGH_KNEES,
    ex('Turning Kicks', 'Patadas giratorias', reps(10, side), ['quads', 'glutes', 'core'],
      'Standing, lift the knee and kick out to the side rotating the hip, return; alternate or one side at a time.',
      'De pie, sube la rodilla y patea hacia el lado girando la cadera, vuelve; alterna o un lado cada vez.',
      'turning kick exercise'),
    'Mountain Climbers',
    ex('Plank Jump-ins', 'Saltos a plancha', reps(15), ['core', 'quads'],
      'High plank, jump both feet in to the hands and back out; hips level.',
      'Plancha alta, salta con los dos pies hacia las manos y vuelve; cadera estable.',
      'plank jump in exercise'),
    AIR_SQUATS,
    // glutes
    ex('Donkey Kicks', 'Patada de burro', reps(15, side), ['glutes'],
      'On hands and knees, kick one bent leg up and back with the sole to the ceiling, squeeze the glute, lower.',
      'A cuatro patas, lleva una pierna flexionada arriba y atrás con la planta al techo, aprieta el glúteo y baja.',
      'donkey kick exercise proper form'),
    'Glute Bridge',
    ex('Jump Knee Tucks', 'Salto con rodillas al pecho', reps(10), ['quads', 'glutes', 'fullBody'],
      'Jump and pull both knees to the chest, land softly.',
      'Salta y lleva las dos rodillas al pecho, aterriza suave.',
      'tuck jump proper form'),
    KEGEL_SHARED[3], // Side-lying Leg Lifts
    // triceps
    ex('Close-grip Push ups', 'Flexiones agarre estrecho', reps(12), ['triceps', 'chest'],
      'Hands just inside shoulder-width, elbows close to the body on the way down.',
      'Manos algo más juntas que los hombros, codos pegados al cuerpo al bajar.',
      'close grip push up proper form'),
    'Bench Dips',
    ex('Bodyweight Tricep Extension', 'Extensión de tríceps con peso corporal', reps(10), ['triceps'],
      'Forearms on a bench or bar, body straight: let the head drop below the hands by bending the elbows, press back up.',
      'Antebrazos en un banco o barra, cuerpo recto: deja que la cabeza baje por debajo de las manos doblando los codos y empuja de vuelta.',
      'bodyweight tricep extension'),
    // biceps
    'Chin ups',
    ex('Doorframe Rows', 'Remo en marco de puerta', reps(10), ['back', 'biceps'],
      'Hold both sides of a door frame, lean back with straight arms, pull the chest to the frame.',
      'Agarra el marco de una puerta por los dos lados, échate atrás con los brazos rectos y lleva el pecho al marco.',
      'doorway row exercise'),
    'Inverted Row',
    // back
    'Pull ups',
    ex('Superman', 'Superman', reps(12), ['back', 'glutes'],
      'Face down, lift arms and legs together, pause a second, lower.',
      'Boca abajo, sube brazos y piernas a la vez, pausa un segundo y baja.',
      'superman exercise proper form'),
    ex('Star Plank', 'Plancha estrella', secs(20, side), ['core', 'shoulders'],
      'Side plank with the top arm and leg raised; hold.',
      'Plancha lateral con el brazo y la pierna de arriba levantados; mantén.',
      'star plank exercise'),
    ex('Bird Dog Plank', 'Plancha con brazo y pierna contrarios', secs(20, side), ['core'],
      'High plank, raise one arm and the opposite leg and hold without twisting.',
      'Plancha alta, levanta un brazo y la pierna contraria y mantén sin girar.',
      'plank opposite arm leg raise'),
    // chest
    'Push ups',
    ex('Plank Rotations', 'Plancha con rotación', reps(10, side), ['core', 'shoulders'],
      'High plank, rotate into a side plank reaching the top arm to the ceiling, come back; alternate.',
      'Plancha alta, rota a plancha lateral llevando el brazo de arriba al techo y vuelve; alterna.',
      'plank rotation exercise'),
    ex('Chest Squeezes', 'Compresión isométrica de pecho', secs(20), ['chest'],
      'Palms pressed together in front of the chest, elbows up; push hard and hold.',
      'Palmas apretadas delante del pecho, codos arriba; empuja fuerte y mantén.',
      'isometric chest squeeze'),
    'Pike Push ups',
    SHOULDER_TAPS,
    ex('Pseudo Planche Push ups', 'Flexiones pseudo planche', reps(6), ['chest', 'shoulders', 'core'],
      'Hands by the hips, fingers turned out, lean far forward over the hands and do a push-up.',
      'Manos a la altura de la cadera, dedos hacia fuera, inclínate mucho hacia delante sobre las manos y haz una flexión.',
      'pseudo planche push up'),
    'Clap Push ups',
  ],
}

/* ---------- Gym staples from the weekly plan that the library did not have ---------- */

export const TRICEPS_3 = [
  ex('Rope Pushdown', 'Extensión de tríceps con cuerda', reps(12, { kg: 20 }), ['triceps'],
    'Cable with the rope, elbows at your sides, push down and pull the ends apart at the bottom.',
    'Polea con cuerda, codos pegados, empuja hacia abajo y separa los extremos al final.'),
]
export const CORE_3 = [LYING_LEG_RAISES, SIT_UPS, REVERSE_CRUNCHES, V_UPS, FLUTTER_KICKS]

/* ---------- curate-5: the hand-made exercises still without proper names or cues ---------- */

/**
 * Renames apply only while the exercise keeps its original id and name; the user's own wording is
 * kept as a last line of the description. Fills add only what is missing. The two seated rows the
 * user typed twice fold into the curated ones when the duplicate has no sets of its own.
 */
export const CURATE_5 = {
  id: 'curate-5', kind: 'curate',
  exercises: [
    { id: 'curl-barra-agarre-prono-y-subida-hombros', from: 'Curl barra agarre prono y subida hombros',
      set: { name: 'Reverse Curl with Shrug', names: { es: 'Curl inverso con encogimiento de hombros' }, muscles: ['forearms', 'biceps', 'back'],
        desc: `${both('Overhand grip on the bar: curl it up, and at the top shrug the shoulders towards the ears; lower both.', 'Agarre prono en la barra: sube el curl y arriba encoge los hombros hacia las orejas; baja ambos.')}\nCurl barra agarre prono y subida hombros`,
        link: yt('reverse barbell curl and shrug') } },
    { id: 'curl-prone-grip', from: 'Curl prone grip',
      set: { name: 'Reverse Curl', names: { es: 'Curl inverso' }, muscles: ['forearms', 'biceps'],
        desc: both('Overhand grip, elbows at your sides, curl the bar up and lower slowly; forearms and brachialis.', 'Agarre prono, codos pegados, sube la barra y baja despacio; antebrazos y braquial.'),
        link: yt('reverse curl proper form') } },
    { id: 'curl-with-shoulder-rise', from: 'Curl with shoulder rise',
      set: { names: { es: 'Curl con elevación de hombro' },
        desc: both('Dumbbell curl, and keep going: at the top raise the elbow forward so the front shoulder works too; lower the same way.', 'Curl con mancuerna y sigue subiendo: arriba eleva el codo hacia delante para que trabaje también el hombro; baja igual.'),
        link: yt('dumbbell curl to front raise') } },
    { id: 'curl-with-wrist-twist', from: 'Curl with wrist twist',
      set: { names: { es: 'Curl con giro de muñeca' }, muscles: ['biceps', 'forearms'],
        desc: both('Curl up with the palm up, turn the wrist over at the top and lower with the palm down (Zottman style).', 'Sube con la palma arriba, gira la muñeca arriba y baja con la palma hacia abajo (estilo Zottman).'),
        link: yt('zottman curl proper form') } },
    { id: 'fondos-en-banco-sentado', from: 'Fondos en banco sentado',
      set: { name: 'Seated Dip Machine', names: { es: 'Fondos en máquina sentado' },
        desc: `${both('Seated dip machine: elbows back, press the handles down until the arms are straight, come back up slowly.', 'Máquina de fondos sentado: codos atrás, empuja los agarres hacia abajo hasta estirar los brazos y sube despacio.')}\nFondos en banco sentado`,
        link: yt('seated dip machine proper form') } },
    { id: 'polea-abajo-arriba-un-solo-lado', from: 'Polea abajo arriba un solo lado',
      set: { name: 'One-arm Low-to-High Cable Fly', names: { es: 'Cruce de polea de abajo arriba a un brazo' }, muscles: ['chest', 'shoulders'],
        desc: `${both('Low cable, one arm: sweep the hand up and across to the opposite shoulder, control it back.', 'Polea baja, un brazo: sube la mano en arco cruzando hacia el hombro contrario y vuelve controlado.')}\nPolea abajo arriba un solo lado`,
        link: yt('single arm low to high cable fly') } },
  ],
  fill: [
    { id: 'abductor', from: 'Abductor',
      set: { desc: both('Hip abductor machine: knees against the pads, open the legs against the weight, close slowly.', 'Máquina de abductores: rodillas contra las almohadillas, abre las piernas contra el peso y cierra despacio.'),
        link: yt('hip abduction machine proper form') } },
    { id: 'seated-row', from: 'Seated row',
      set: { names: { es: 'Remo sentado' }, desc: both('Chest up, pull the handle to the stomach, squeeze the shoulder blades.', 'Pecho arriba, lleva el agarre al abdomen y junta las escápulas.'), link: yt('seated cable row proper form') } },
    { id: 'diverging-seated-row', from: 'Diverging seated row',
      set: { names: { es: 'Remo sentado divergente' }, desc: both('Iso-lateral row machine: chest on the pad, pull both handles back and out, squeeze.', 'Máquina de remo iso-lateral: pecho en el apoyo, tira de los dos agarres atrás y hacia fuera, aprieta.'), link: yt('iso lateral row machine proper form') } },
  ],
  merges: [
    { from: 'seated-row', fromName: 'Seated row', into: 'remo-sentado' },
    { from: 'diverging-seated-row', fromName: 'Diverging seated row', into: 'remo-sentado-divergente' },
  ],
}

/**
 * curate-6 (0.15.1): the user explained the movement curate-5 had read as a shrug: an overhand curl
 * to the chin, then the bar pressed straight overhead (and maybe lowered behind the neck for the
 * triceps). Guarded on the curate-5 name, so it only touches a phone that got that one.
 */
export const CURATE_6 = {
  id: 'curate-6', kind: 'curate',
  exercises: [
    { id: 'curl-barra-agarre-prono-y-subida-hombros', from: 'Reverse Curl with Shrug',
      set: { name: 'Reverse Curl and Press', names: { es: 'Curl inverso y press sobre la cabeza' }, muscles: ['forearms', 'biceps', 'shoulders', 'triceps'],
        desc: `${both('Overhand grip: curl the bar up to the chin for the forearms, then press it straight overhead to full arm length; lower the same way. To add the triceps, lower it behind the neck before pressing back up.', 'Agarre prono: sube la barra en curl hasta la barbilla para los antebrazos y luego empújala en vertical hasta estirar los brazos; baja igual. Para sumar tríceps, bájala por detrás de la nuca antes de volver a empujar.')}\nCurl barra agarre prono y subida hombros`,
        link: yt('reverse curl to overhead press barbell') } },
  ],
}
