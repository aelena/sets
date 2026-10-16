const pad = n => String(n).padStart(2, '0')

/** Local calendar day as YYYY-MM-DD: the key every set, note and chart groups by. */
export const dateKey = (d = new Date()) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

export const hhmm = d => {
  const x = new Date(d)
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`
}

/** 1h 05m, 7m 30s, 45s */
export const duration = ms => {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60
  return h ? `${h}h ${pad(m)}m` : m ? `${m}m ${pad(r)}s` : `${r}s`
}

/** Stopwatch face: 07:30 or 1:05:09 */
export const clock = ms => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const slugify = s =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'
