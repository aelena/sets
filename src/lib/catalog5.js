/**
 * 2026-10-21 (0.12.1): burpees for the Functional group; lateral crunches and two scissor
 * variations for Core (Bicycle Crunch is there since 0.11.0). Add-only, existing groups only.
 */
const yt = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q).replace(/%20/g, '+')}`
const both = (en, es) => `EN: ${en}\nES: ${es}`
const ex = (name, es, target, muscles, en, esDesc, search = `${name} proper form`) =>
  ({ name, names: { es }, ...target, muscles, desc: both(en, esDesc), link: yt(search) })

export const BURPEES = [
  ex('Burpees', 'Burpees', { sets: 3, reps: 10 }, ['quads', 'chest', 'core'],
    'Squat, hands down, jump the feet back to a plank, chest to the floor, jump the feet in, jump up with the arms overhead.',
    'Agáchate, manos al suelo, salta atrás a plancha, pecho al suelo, recoge los pies de un salto y salta con los brazos arriba.',
    'burpee proper form'),
]

export const CORE_2 = [
  ex('Lateral Crunch', 'Crunch lateral', { sets: 3, reps: 12, perSide: true }, ['core'],
    'On your back, knees bent, curl up and take one elbow to the inside of the opposite knee; lower and repeat, then the other side.',
    'Boca arriba, rodillas flexionadas, sube y lleva un codo al interior de la rodilla contraria; baja y repite, luego el otro lado.',
    'cross body crunch elbow to opposite knee'),
  ex('Scissor Kicks', 'Tijeras', { type: 'time', sets: 3, seconds: 30 }, ['core'],
    'In the hollow hold, lower back down, legs straight and off the floor; move them up and down alternately, small and controlled.',
    'En posición hollow, lumbar pegada al suelo, piernas estiradas y despegadas; súbelas y bájalas alternando, corto y controlado.',
    'scissor kicks abs'),
  ex('Cross Scissors', 'Tijeras cruzadas', { type: 'time', sets: 3, seconds: 30 }, ['core'],
    'In the hollow hold, legs straight and off the floor; open and cross them over each other side to side, alternating which leg is on top.',
    'En posición hollow, piernas estiradas y despegadas; ábrelas y crúzalas de lado a lado, alternando la que queda encima.',
    'cross scissor kicks abs'),
]
