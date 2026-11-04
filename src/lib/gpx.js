/**
 * A run recorded elsewhere, read after the fact: the watch or the running app (Strava, Garmin,
 * Nike Run Club, Apple Health through an exporter) records it in the background and exports a GPX
 * file; Sets reads the file. Nothing is tracked here: no GPS, no screen kept on, no permissions.
 *
 * A small regex reader rather than DOMParser: GPX is flat enough, and it runs in node for the tests.
 */

const R = 6371000
const rad = d => (d * Math.PI) / 180

/** Metres between two { lat, lon } points along the sphere. */
export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const unescape = s => String(s ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').trim()
const text = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`))
  return m ? unescape(m[1]) : null
}
const attr = (attrs, name) => attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`))?.[1]

function pointsOf(xml, tag) {
  const out = []
  for (const m of xml.matchAll(new RegExp(`<${tag}\\b([^>]*?)(?:/>|>([\\s\\S]*?)</${tag}>)`, 'g'))) {
    const lat = +attr(m[1], 'lat'), lon = +attr(m[1], 'lon')
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const inner = m[2] ?? ''
    const ele = text(inner, 'ele'), time = text(inner, 'time')
    const t = time ? Date.parse(time) : NaN
    out.push({ lat, lon, ele: ele !== null && ele !== '' && Number.isFinite(+ele) ? +ele : null, t: Number.isFinite(t) ? t : null })
  }
  return out
}

/** Track points, or the route points of a file that only has a planned route. */
export const readPoints = xml => {
  const trk = pointsOf(xml, 'trkpt')
  return trk.length ? trk : pointsOf(xml, 'rtept')
}

/** The track's name, else the file's. */
export const readName = xml => text(xml.match(/<trk\b[\s\S]*?<\/trk>/)?.[0] ?? '', 'name') ?? text(xml, 'name') ?? ''

const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d

/**
 * Distance, times and climb over the points.
 * Moving time leaves out stops (a light, a stop: under 0.5 m/s) and recording gaps (auto-pause:
 * over a minute between points). Climb counts once a rise since the last low passes 3 m, so the
 * altitude noise of a phone's GPS does not pile up.
 */
export function analyze(points) {
  let meters = 0, movingMs = 0, ascent = 0, base = null
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i]
    const d = haversine(a, b)
    meters += d
    if (a.t != null && b.t != null) {
      const dt = b.t - a.t
      if (dt > 0 && dt <= 60_000 && d / (dt / 1000) >= 0.5) movingMs += dt
    }
  }
  for (const p of points) {
    if (p.ele == null) continue
    if (base == null || p.ele < base) base = p.ele
    else if (p.ele - base >= 3) { ascent += p.ele - base; base = p.ele }
  }
  const timed = points.filter(p => p.t != null)
  const start = timed[0]?.t ?? null, end = timed.at(-1)?.t ?? null
  return { meters, start, end, elapsedMs: start != null ? end - start : null, movingMs: start != null ? movingMs : null, ascent: Math.round(ascent) }
}

/** At most `max` points of the track, as [lat, lon] pairs rounded to a metre, first and last kept. */
export function simplify(points, max = 300) {
  if (points.length <= max) return points.map(p => [round(p.lat, 5), round(p.lon, 5)])
  const step = (points.length - 1) / (max - 1)
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]).map(p => [round(p.lat, 5), round(p.lon, 5)])
}

/**
 * The run in a GPX file: what the activity log stores and the import sheet shows.
 * Throws 'gpxNoTrack' with fewer than two points. `minutes` is the moving time (the elapsed time
 * when the file has no timestamps or no movement), `start` null when the file carries no times.
 */
export function parseGpx(xml) {
  const points = readPoints(String(xml ?? ''))
  if (points.length < 2) throw new Error('gpxNoTrack')
  const s = analyze(points)
  const minutes = s.movingMs ? s.movingMs / 60_000 : s.elapsedMs ? s.elapsedMs / 60_000 : null
  return {
    name: readName(xml),
    start: s.start, end: s.end,
    km: round(s.meters / 1000, 2),
    minutes: minutes != null ? round(minutes, 1) : null,
    elapsedMinutes: s.elapsedMs != null ? round(s.elapsedMs / 60_000, 1) : null,
    ascent: s.ascent,
    track: simplify(points),
    points: points.length,
  }
}

/**
 * The track scaled into a w × h box (keeping its shape: longitudes shrink with the latitude),
 * centred, as [x, y] pixel pairs. Empty for a track with fewer than two points.
 */
export function fitTrack(track, w, h, pad = 0) {
  if (!track || track.length < 2) return []
  const lats = track.map(p => p[0]), lons = track.map(p => p[1])
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const kx = Math.cos(rad((minLat + maxLat) / 2))
  const spanX = (maxLon - minLon) * kx || 1e-9, spanY = maxLat - minLat || 1e-9
  const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY)
  const ox = (w - spanX * scale) / 2, oy = (h - spanY * scale) / 2
  return track.map(([lat, lon]) => [round(ox + (lon - minLon) * kx * scale, 1), round(oy + (maxLat - lat) * scale, 1)])
}

/** An SVG path ("M x y L x y …") for the fitted track. */
export const trackPath = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
