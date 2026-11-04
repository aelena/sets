import { describe, it, expect } from 'vitest'
import { haversine, readPoints, readName, analyze, simplify, parseGpx, fitTrack, trackPath } from '../../src/lib/gpx.js'

const T0 = Date.parse('2026-11-04T08:00:00Z')
const iso = ms => new Date(ms).toISOString()
/** A straight run north along a meridian: 0.009° of latitude is about 1 km. */
const trkpt = (i, { ele = 10, dt = 60 } = {}) => `<trkpt lat="${(40 + i * 0.009).toFixed(5)}" lon="-3.7"><ele>${ele}</ele><time>${iso(T0 + i * dt * 1000)}</time></trkpt>`
const gpx = (inner, name = 'Morning Run') =>
  `<?xml version="1.0"?><gpx version="1.1" creator="test"><metadata><name>file</name></metadata><trk><name>${name}</name><trkseg>${inner}</trkseg></trk></gpx>`

describe('reading points', () => {
  it('reads lat, lon, elevation and time from track points, with self-closing and bare points', () => {
    const pts = readPoints(`<trkpt lat="40" lon="-3.7"><ele>650.5</ele><time>2026-11-04T08:00:00Z</time></trkpt><trkpt lat='40.1' lon='-3.71'/><trkpt lat="x" lon="1"/>`)
    expect(pts).toEqual([{ lat: 40, lon: -3.7, ele: 650.5, t: T0 }, { lat: 40.1, lon: -3.71, ele: null, t: null }])
  })

  it('falls back to route points, and names the track before the file', () => {
    expect(readPoints('<rte><rtept lat="1" lon="2"/><rtept lat="1.1" lon="2"/></rte>')).toHaveLength(2)
    expect(readName(gpx('', 'Parque del Retiro &amp; back'))).toBe('Parque del Retiro & back')
    expect(readName('<gpx><metadata><name><![CDATA[Only file]]></name></metadata></gpx>')).toBe('Only file')
    expect(readName('<gpx></gpx>')).toBe('')
  })

  it('measures distance along the sphere', () => {
    expect(haversine({ lat: 40, lon: -3.7 }, { lat: 40.009, lon: -3.7 })).toBeCloseTo(1001, 0)
  })
})

describe('analyze', () => {
  it('sums distance, elapsed and moving time, and climbs past the noise', () => {
    const inner = [0, 1, 2, 3, 4, 5].map(i => trkpt(i, { ele: [10, 11, 12, 14, 20, 18][i] })).join('')
    const s = analyze(readPoints(inner))
    expect(s.meters).toBeCloseTo(5005, -1)
    expect(s.elapsedMs).toBe(5 * 60_000)
    expect(s.movingMs).toBe(5 * 60_000)
    expect(s.ascent).toBe(10) // 10 → 20 counts in two steps of 3 m or more (14, 20); 10 → 11 → 12 is noise
    expect(s.start).toBe(T0)
  })

  it('leaves stops and recording gaps out of the moving time', () => {
    // a point every 10 s: 1 km in 5 min, 30 s standing at a light, 1 km more, a 10-minute gap (auto-pause), 1 km more
    const pts = []
    const walk = (fromLat, n, step, t0) => { for (let i = 0; i <= n; i++) pts.push({ lat: fromLat + i * step, lon: -3.7, ele: null, t: t0 + i * 10_000 }) }
    walk(40, 30, 0.0003, T0)
    walk(40.009, 3, 0, T0 + 310_000)
    walk(40.009, 30, 0.0003, T0 + 340_000)
    walk(40.018, 30, 0.0003, T0 + 640_000 + 600_000)
    const s = analyze(pts)
    expect(s.movingMs).toBe(900_000)
    expect(s.elapsedMs).toBe(1_540_000)
    expect(s.meters).toBeCloseTo(3003, -1)
  })

  it('has no times for a planned route', () => {
    const s = analyze([{ lat: 40, lon: -3.7, ele: null, t: null }, { lat: 40.009, lon: -3.7, ele: null, t: null }])
    expect(s).toMatchObject({ start: null, end: null, elapsedMs: null, movingMs: null, ascent: 0 })
  })
})

describe('parseGpx', () => {
  it('gives the run the log stores: km, moving minutes, ascent and a short track', () => {
    const run = parseGpx(gpx([0, 1, 2, 3, 4, 5].map(i => trkpt(i, { ele: 10 + i * 4 })).join('')))
    expect(run).toMatchObject({ name: 'Morning Run', start: T0, end: T0 + 300_000, km: 5, minutes: 5, elapsedMinutes: 5, ascent: 20, points: 6 })
    expect(run.track).toHaveLength(6)
    expect(run.track[0]).toEqual([40, -3.7])
  })

  it('rejects a file without a track', () => {
    expect(() => parseGpx(gpx(''))).toThrow('gpxNoTrack')
    expect(() => parseGpx('not xml at all')).toThrow('gpxNoTrack')
    expect(() => parseGpx(gpx(trkpt(0)))).toThrow('gpxNoTrack')
  })

  it('keeps the elapsed time as minutes when nothing moved, and no minutes without times', () => {
    const still = parseGpx(gpx(`<trkpt lat="40" lon="-3.7"><time>${iso(T0)}</time></trkpt><trkpt lat="40" lon="-3.7"><time>${iso(T0 + 120_000)}</time></trkpt>`))
    expect(still).toMatchObject({ km: 0, minutes: 2, elapsedMinutes: 2 })
    const route = parseGpx('<gpx><rte><rtept lat="40" lon="-3.7"/><rtept lat="40.009" lon="-3.7"/></rte></gpx>')
    expect(route).toMatchObject({ km: 1, minutes: null, elapsedMinutes: null, start: null })
  })
})

describe('tracks on screen', () => {
  it('thins a long track to the limit keeping both ends', () => {
    const pts = Array.from({ length: 1000 }, (_, i) => ({ lat: 40 + i * 0.0001, lon: -3.7 }))
    const t = simplify(pts, 300)
    expect(t).toHaveLength(300)
    expect(t[0]).toEqual([40, -3.7])
    expect(t.at(-1)).toEqual([40.0999, -3.7])
    expect(simplify(pts.slice(0, 3))).toHaveLength(3)
  })

  it('fits a track into a box keeping its shape, and draws it as a path', () => {
    const pts = fitTrack([[40, -3.7], [40.009, -3.7], [40.009, -3.6882]], 100, 100, 10) // 1 km north, then ~1 km east
    expect(pts).toHaveLength(3)
    expect(pts[0][1]).toBeCloseTo(90, 0) // start at the bottom left
    expect(pts[1]).toEqual([expect.closeTo(10, 0), expect.closeTo(10, 0)])
    expect(pts[2][0]).toBeCloseTo(90, 0)
    expect(trackPath(pts)).toMatch(/^M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L/)
    expect(fitTrack([[40, -3.7]], 100, 100)).toEqual([])
  })
})
