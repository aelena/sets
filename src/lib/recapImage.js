import { FORMATS, FLAME } from './recap.js'

/** Printed on every recap so whoever sees it can find the app. */
export const APP_URL = 'aelena.com/sets'

/** Background photos bundled with the app: drop images in src/assets/backgrounds and rebuild. */
export const PHOTOS = Object.entries(
  import.meta.glob('../assets/backgrounds/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }),
).map(([path, url]) => ({ id: path.split('/').pop(), url }))

export const loadImage = src => new Promise((ok, fail) => {
  const img = new Image()
  img.onload = () => ok(img)
  img.onerror = () => fail(new Error('Could not load image'))
  img.src = src
})

const bigDuration = ms => {
  const m = Math.round(ms / 60000)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
}

/** Shrink text to fit `max` px, adding an ellipsis. */
const fit = (ctx, text, max) => {
  if (ctx.measureText(text).width <= max) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1)
  return `${t}…`
}

/**
 * Draw the recap on a canvas sized for Instagram.
 * background: { gradient: [from, to] } or { image: HTMLImageElement }.
 */
export async function drawRecap(data, { format = 'story', detail = 'full', background, family, lang, userName = '', L }) {
  const [W, H] = FORMATS[format]
  const story = format === 'story'
  const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H })
  const ctx = canvas.getContext('2d')
  await Promise.all([400, 700].map(w => document.fonts?.load(`${w} 40px ${family}`).catch(() => {})))
  const font = (w, px) => `${w} ${px}px ${family}, ui-monospace, monospace`

  if (background?.image) {
    const img = background.image
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight)
    const w = img.naturalWidth * s, h = img.naturalHeight * s
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h)
    const shade = ctx.createLinearGradient(0, 0, 0, H)
    shade.addColorStop(0, 'rgba(0,0,0,.35)')
    shade.addColorStop(0.45, 'rgba(0,0,0,.55)')
    shade.addColorStop(1, 'rgba(0,0,0,.82)')
    ctx.fillStyle = shade
  } else {
    const [a, b] = background?.gradient ?? ['#111111', '#2b2b2b']
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H)
    g.addColorStop(0, a)
    g.addColorStop(1, b)
    ctx.fillStyle = g
  }
  ctx.fillRect(0, 0, W, H)

  if (background?.image) Object.assign(ctx, { shadowColor: 'rgba(0,0,0,.55)', shadowBlur: 14 }) // text over bright patches of a photo

  const pad = 88, inner = W - 2 * pad
  const white = 'rgba(255,255,255,.96)', dim = 'rgba(255,255,255,.7)', flameColor = '#ff8a4c'
  ctx.textBaseline = 'alphabetic'
  let y = story ? 250 : pad + 40 // story: below Instagram's top bar

  // untimed: the label on top and the day as the big line, since there is no duration to show
  const span = new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short' }).format(data.start)
  const dateText = data.untimed
    ? L.untimedSession
    : new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(data.start)
  ctx.fillStyle = white
  ctx.font = font(700, 44)
  ctx.fillText(fit(ctx, dateText, inner), pad, y)
  if (userName) {
    y += 54
    ctx.fillStyle = dim
    ctx.font = font(400, 34)
    ctx.fillText(fit(ctx, userName, inner), pad, y)
  }

  // the block of numbers sits at the bottom, clear of Instagram's top bar and reply bar,
  // so a photo shows through above it; the exercise list gets whatever room is left
  const durPx = story ? 168 : 136
  const lineH = story ? 66 : 58
  const topLimit = story ? 360 : 260
  const bottom = H - (story ? 280 : 150)
  // sparse: no exercise list, the muscles trained carry the story
  const lines = detail === 'sparse' ? [] : data.lines
  const muscles = (data.muscles ?? []).slice(0, detail === 'sparse' ? 4 : 3).map(L.muscle)
  const musclePx = detail === 'sparse' ? 48 : 36
  const fixed = 110 + 46 + (muscles.length ? musclePx + 44 : 0) + (data.bests ? 82 : 0) + (lines.length ? (story ? 110 : 84) : 0)
  const room = Math.max(0, Math.floor((bottom - topLimit - durPx * 0.75 - fixed) / lineH) + 1)
  const shown = lines.length > room ? lines.slice(0, Math.max(0, room - 1)) : lines
  const listed = shown.length + (shown.length < lines.length ? 1 : 0)
  y = bottom - fixed - Math.max(0, listed - 1) * lineH

  ctx.fillStyle = white
  ctx.font = font(700, durPx)
  ctx.font = font(700, data.untimed ? Math.round(durPx * 0.7) : durPx)
  ctx.fillText(fit(ctx, data.untimed ? span : bigDuration(data.durationMs), inner + 6), pad - 6, y)

  y += 110
  const nf = new Intl.NumberFormat(lang)
  const stats = [[nf.format(data.sets), L.sets], [nf.format(data.exercises), L.exercises]]
  if (data.volume) stats.push([`${nf.format(data.volume)}`, `kg ${L.volume}`])
  else if (data.rests) stats.push([nf.format(data.rests), L.rests])
  const col = inner / stats.length
  stats.forEach(([v, label], i) => {
    ctx.fillStyle = white
    ctx.font = font(700, 68)
    ctx.fillText(fit(ctx, v, col - 16), pad + i * col, y)
    ctx.fillStyle = dim
    ctx.font = font(400, 30)
    ctx.fillText(fit(ctx, label, col - 16), pad + i * col, y + 46)
  })
  y += 46

  if (muscles.length) {
    y += musclePx + 44
    ctx.fillStyle = white
    ctx.font = font(700, musclePx)
    ctx.fillText(fit(ctx, muscles.join(' · '), inner), pad, y)
  }

  const flame = (x, top, size) => {
    ctx.save()
    ctx.translate(x, top)
    ctx.scale(size / 24, size / 24)
    ctx.fillStyle = flameColor
    ctx.fill(new Path2D(FLAME))
    ctx.restore()
  }
  if (data.bests) {
    y += 82
    flame(pad, y - 40, 46)
    ctx.fillStyle = flameColor
    ctx.font = font(700, 40)
    ctx.fillText(data.bests === 1 ? L.bestOne : `${data.bests} ${L.bests}`, pad + 60, y)
  }

  if (lines.length) {
    y += story ? 110 : 84
    ctx.strokeStyle = 'rgba(255,255,255,.25)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(pad, y - 56); ctx.lineTo(W - pad, y - 56); ctx.stroke()
  }
  for (const line of shown) {
    // the name keeps at least half the row; the detail takes what is left
    ctx.font = font(700, 36)
    const nameW = Math.min(ctx.measureText(line.name).width, inner * 0.5) + (line.best ? 56 : 0)
    ctx.font = font(400, 32)
    const detail = fit(ctx, line.detail, inner - nameW - 32)
    const dw = ctx.measureText(detail).width
    ctx.fillStyle = dim
    ctx.fillText(detail, W - pad - dw, y)
    ctx.font = font(700, 36)
    const name = fit(ctx, line.name, inner - dw - (line.best ? 60 : 24))
    ctx.fillStyle = white
    ctx.fillText(name, pad, y)
    if (line.best) flame(pad + ctx.measureText(name).width + 10, y - 30, 34)
    y += lineH
  }
  if (shown.length < lines.length) {
    ctx.fillStyle = dim
    ctx.font = font(400, 32)
    ctx.fillText(L.more(lines.length - shown.length), pad, y)
  }

  const footer = H - (story ? 170 : pad)
  ctx.fillStyle = white
  ctx.font = font(700, 34)
  ctx.fillText(APP_URL, pad, footer)
  const urlW = ctx.measureText(APP_URL).width
  ctx.fillStyle = dim
  ctx.font = font(400, 28)
  ctx.fillText(fit(ctx, ` · ${L.pitch}`, inner - urlW), pad + urlW, footer)
  return canvas
}

export const toJpeg = canvas => new Promise(ok => canvas.toBlob(ok, 'image/jpeg', 0.9))
