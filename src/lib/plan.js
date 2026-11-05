import { cleanExercise } from './config.js'
import { dateKey, slugify } from './time.js'
import { nameOf } from './names.js'

/**
 * Training plans: a weekly template run for a number of days from a start date ("30-day
 * challenge"). A plan only says what to do; what was done is the sets logged as usual, so a day's
 * status is worked out from the sets of that date. Plans come in and go out as JSON, the same
 * shape both ways, so a plan can be drafted with any chatbot from the exported template.
 */

export const PLAN_FORMAT = 'sets/plan'
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/** 'mon'…'sun' of a 'YYYY-MM-DD'. */
export const weekdayOf = date => {
  const [y, m, d] = date.split('-').map(Number)
  return WEEKDAYS[(new Date(y, m - 1, d).getDay() + 6) % 7]
}

/** Whole days from a to b ('YYYY-MM-DD'), DST-safe. */
export const daysBetween = (a, b) => {
  const t = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((t(b) - t(a)) / 864e5)
}
export const addDays = (date, n) => {
  const [y, m, d] = date.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + n))
}

const str = v => (v == null ? '' : String(v).trim())
const fold = s => str(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const pos = v => (v === '' || v == null || !Number.isFinite(+v) || +v <= 0 ? null : +v)
/** 12, "12", [10, 12] or "10-12" → 12 or [10, 12]; null when it does not read as a count. */
const amount = v => {
  if (Array.isArray(v)) { const [a, b] = v.map(pos); return a && b ? (a === b ? a : [Math.min(a, b), Math.max(a, b)]) : a ?? b ?? null }
  const m = str(v).match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/)
  return m ? amount([m[1], m[2]]) : pos(v)
}
export const low = v => (Array.isArray(v) ? v[0] : v)
export const showAmount = v => (Array.isArray(v) ? `${v[0]}–${v[1]}` : v == null ? '' : String(v))
const isDate = s => /^\d{4}-\d\d-\d\d$/.test(str(s))

/**
 * A plan file (or the plan of a backup) checked and resolved against the library: every item gets
 * an exerciseId, matched by id, then English name, then Spanish name (case and accents ignored).
 * Items naming an exercise the phone does not have yet come back in `created`, ready to add.
 */
export function normalizePlan(input, known = [], today = dateKey()) {
  if (!input || typeof input !== 'object') throw new Error('planNotJson')
  if (input.format && input.format !== PLAN_FORMAT) throw new Error('planFormat')
  if (!input.week || typeof input.week !== 'object') throw new Error('planNoWeek')
  const warnings = []
  const byId = new Map(known.map(e => [e.id, e]))
  const created = []
  const taken = new Set(byId.keys())
  const pool = () => [...known.filter(e => !e.archived), ...created, ...known.filter(e => e.archived)]
  const find = raw => {
    const id = str(raw.exerciseId ?? raw.id)
    if (id && byId.has(id)) return byId.get(id)
    const en = fold(raw.exercise ?? raw.name), es = fold(raw.es ?? raw.names?.es)
    return pool().find(e => en && fold(e.name) === en)
      ?? pool().find(e => es && fold(e.names?.es) === es)
      ?? pool().find(e => en && fold(e.names?.es) === en)
      ?? pool().find(e => es && fold(e.name) === es)
  }

  const item = raw => {
    if (typeof raw === 'string') raw = { exercise: raw }
    if (!raw || typeof raw !== 'object') return null
    const seconds = amount(raw.seconds), reps = amount(raw.reps)
    let ex = find(raw)
    if (!ex) {
      const name = str(raw.exercise ?? raw.name) || str(raw.es)
      if (!name) { warnings.push('item without an exercise name skipped'); return null }
      let id = slugify(name), n = 2
      while (taken.has(id)) id = `${slugify(name)}-${n++}`
      taken.add(id)
      ex = cleanExercise({
        name, type: seconds != null && reps == null ? 'time' : 'reps', sets: pos(raw.sets) ?? 3,
        reps: low(reps) ?? 10, seconds: low(seconds) ?? 30, kg: pos(raw.kg), perSide: !!raw.perSide,
        desc: str(raw.note ?? raw.desc), ...(str(raw.es) ? { names: { es: str(raw.es) } } : {}),
      }, id)
      created.push(ex)
    }
    const timed = ex.type === 'time'
    return {
      exerciseId: ex.id,
      sets: Math.round(pos(raw.sets) ?? ex.sets ?? 3),
      ...(timed ? { seconds: seconds ?? reps ?? ex.seconds } : { reps: reps ?? ex.reps }),
      ...(pos(raw.kg) != null ? { kg: pos(raw.kg) } : {}),
      ...(raw.perSide ?? ex.perSide ? { perSide: true } : {}),
      ...(str(raw.note) ? { note: str(raw.note) } : {}),
    }
  }
  const day = raw => {
    if (!raw || typeof raw !== 'object') return { rest: true }
    const items = (Array.isArray(raw.items) ? raw.items : []).map(item).filter(Boolean)
    return {
      name: str(raw.name), ...(raw.names?.es ? { names: { es: str(raw.names.es) } } : {}),
      ...(raw.rest || !items.length ? { rest: true } : {}), items,
      ...(str(raw.note) ? { note: str(raw.note) } : {}),
    }
  }

  const week = Object.fromEntries(WEEKDAYS.map(k => [k, day(input.week[k])]))
  if (WEEKDAYS.every(k => week[k].rest)) throw new Error('planNoTraining')
  const overrides = {}
  for (const [date, raw] of Object.entries(input.overrides ?? {}))
    if (isDate(date)) overrides[date] = day(raw)
    else warnings.push(`override "${date}" is not a date`)
  const name = str(input.name) || str(input.names?.es) || 'Plan'
  const plan = {
    id: str(input.id) || slugify(name),
    name, ...(input.names?.es ? { names: { es: str(input.names.es) } } : {}),
    start: isDate(input.start) ? str(input.start) : today,
    days: Math.min(366, Math.max(1, Math.round(pos(input.days) ?? 30))),
    goal: str(typeof input.goal === 'object' ? input.goal?.text : input.goal),
    rules: (Array.isArray(input.rules) ? input.rules : []).map(str).filter(Boolean),
    phases: (Array.isArray(input.phases) ? input.phases : [])
      .map(p => ({ weeks: (Array.isArray(p.weeks) ? p.weeks : [p.week ?? p.weeks]).map(pos).filter(Boolean), focus: str(p.focus), ...(p.es ? { es: str(p.es) } : {}) }))
      .filter(p => p.weeks.length && p.focus),
    week, overrides,
    ...(str(input.source) ? { source: str(input.source) } : {}),
  }
  if (!isDate(input.start)) warnings.push('no start date: starts today')
  return { plan, created, warnings }
}

/** The plan's day for a date: number (1-based), the day's content (an override wins), or null outside the plan. */
export function planDay(plan, date) {
  if (!plan) return null
  const n = daysBetween(plan.start, date) + 1
  if (n < 1 || n > plan.days) return null
  const day = plan.overrides?.[date] ?? plan.week[weekdayOf(date)] ?? { rest: true }
  return { n, date, weekday: weekdayOf(date), ...day, rest: !!day.rest || !day.items?.length, items: day.items ?? [] }
}
export const endOf = plan => addDays(plan.start, plan.days - 1)

/**
 * How a plan day went, from the exercise ids logged that date:
 * done (every planned exercise has a set), partial (some, or other training that day), missed
 * (a past training day with nothing), today (nothing yet today), future, rest; null outside the plan.
 */
export function dayStatus(plan, date, logged = new Set(), today = dateKey()) {
  const d = planDay(plan, date)
  if (!d) return null
  if (d.rest) return 'rest'
  if (date > today) return 'future'
  const ids = [...new Set(d.items.map(i => i.exerciseId))]
  const hit = ids.filter(id => logged.has(id)).length
  if (hit === ids.length) return 'done'
  if (hit || logged.size) return 'partial'
  return date === today ? 'today' : 'missed'
}

/** Tallies over the plan's days up to today: training days so far, done, partial, missed; the current week. */
export function planProgress(plan, loggedByDate, today = dateKey()) {
  const out = { done: 0, partial: 0, missed: 0, trainingDays: 0, total: 0, day: null, week: null }
  for (let i = 0; i < plan.days; i++) {
    const date = addDays(plan.start, i)
    const s = dayStatus(plan, date, loggedByDate.get(date) ?? new Set(), today)
    if (s !== 'rest') out.total++
    if (date > today) continue
    if (s !== 'rest' && s !== 'today') out.trainingDays++
    if (s in out) out[s]++
  }
  const n = daysBetween(plan.start, today) + 1
  out.day = n >= 1 && n <= plan.days ? n : null
  out.week = out.day ? Math.ceil(out.day / 7) : null
  return out
}

/** Messages for opening the app: today's plan day, and yesterday when it was missed. */
export function nudges(plan, loggedByDate, today = dateKey()) {
  if (!plan) return []
  const out = []
  const d = planDay(plan, today)
  if (d && !d.rest && dayStatus(plan, today, loggedByDate.get(today) ?? new Set(), today) !== 'done') out.push({ kind: 'today', day: d })
  const y = addDays(today, -1)
  if (dayStatus(plan, y, loggedByDate.get(y) ?? new Set(), today) === 'missed') out.push({ kind: 'missed', day: planDay(plan, y) })
  if (!d && today > endOf(plan) && daysBetween(endOf(plan), today) <= 3) out.push({ kind: 'ended' })
  return out
}

/** The phase whose weeks include the given plan day number. */
export const phaseOf = (plan, n) => (n ? plan.phases?.find(p => p.weeks.includes(Math.ceil(n / 7))) ?? null : null)

/** "3 × 12", "3 × 20–30 s", "3 × 10 · 40 kg · per side" (the per-side word passed in). */
export function targetLabel(item, ex, perSideWord = 'per side') {
  const timed = item.seconds != null || ex?.type === 'time'
  return [
    `${item.sets} × ${showAmount(timed ? item.seconds : item.reps)}${timed ? ' s' : ''}`,
    item.kg != null ? `${item.kg} kg` : null,
    item.perSide ? perSideWord : null,
  ].filter(Boolean).join(' · ')
}

/** The plan as a file, exercises by name (English and Spanish), the shape normalizePlan reads. */
export function exportPlan(plan, exercisesById) {
  const item = i => {
    const ex = exercisesById[i.exerciseId]
    return {
      exercise: ex?.name ?? i.exerciseId, ...(ex?.names?.es ? { es: ex.names.es } : {}),
      sets: i.sets, ...(i.seconds != null ? { seconds: i.seconds } : { reps: i.reps }),
      ...(i.kg != null ? { kg: i.kg } : {}), ...(i.perSide ? { perSide: true } : {}), ...(i.note ? { note: i.note } : {}),
    }
  }
  const day = d => (d.rest ? { rest: true, ...(d.name ? { name: d.name } : {}), ...(d.names ? { names: d.names } : {}), ...(d.note ? { note: d.note } : {}) }
    : { name: d.name, ...(d.names ? { names: d.names } : {}), items: d.items.map(item), ...(d.note ? { note: d.note } : {}) })
  return {
    format: PLAN_FORMAT, version: 1, id: plan.id, name: plan.name, ...(plan.names ? { names: plan.names } : {}),
    start: plan.start, days: plan.days, goal: plan.goal, rules: plan.rules, phases: plan.phases,
    week: Object.fromEntries(WEEKDAYS.map(k => [k, day(plan.week[k])])),
    overrides: Object.fromEntries(Object.entries(plan.overrides ?? {}).map(([date, d]) => [date, day(d)])),
  }
}

/**
 * A blank plan to hand to ChatGPT or any assistant with what you want: the instructions say how
 * to fill it, and `library` lists the exercises on this phone so the plan reuses their names
 * (one history per exercise) instead of inventing near-duplicates.
 */
export function planTemplate(library = []) {
  return {
    _instructions: [
      'Fill in this training plan for the Sets app (aelena.com/sets) from what I tell you, and return only the JSON, same structure.',
      'Keep "format" and "version" as they are. Leave "start" empty: the start date is chosen in the app when the plan is imported. "days" is how many days the plan runs.',
      '"week" is the weekly template, mon to sun. A training day has a short "name" and "items"; a rest day is { "rest": true, "name": "Rest" }.',
      'Each item: "exercise" (English name), "es" (Spanish name), "sets", and either "reps" or "seconds". A range is [min, max], e.g. "reps": [8, 12]. Optional: "kg", "perSide": true, "note".',
      'Use the exact names in "library" whenever the exercise is there. Only invent a new name when nothing in the library fits.',
      '"rules" are short training rules (warm-up, rest between sets, progression). "phases" give each week a focus. "overrides" can replace the template on specific dates: { "2026-11-12": { "name": "...", "items": [...] } }.',
      'Training only: no nutrition, no medical advice. Leave "library" out of your answer.',
    ],
    format: PLAN_FORMAT,
    version: 1,
    name: '',
    names: { es: '' },
    start: '',
    days: 30,
    goal: '',
    rules: [],
    phases: [{ weeks: [1], focus: '' }],
    week: {
      mon: { name: 'Legs', items: [{ exercise: 'Leg Press', es: 'Prensa', sets: 3, reps: 12 }, { exercise: 'Plank', es: 'Plancha', sets: 3, seconds: [20, 30] }] },
      tue: { rest: true, name: 'Rest' }, wed: { rest: true, name: 'Rest' }, thu: { rest: true, name: 'Rest' },
      fri: { rest: true, name: 'Rest' }, sat: { rest: true, name: 'Rest' }, sun: { rest: true, name: 'Rest' },
    },
    overrides: {},
    library: library.filter(e => !e.archived).map(e => (e.names?.es && e.names.es !== e.name ? `${e.name} · ${e.names.es}` : e.name)).sort((a, b) => a.localeCompare(b)),
  }
}

const icsText = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
/** RFC 5545 lines fold at 75 octets; continuation lines start with a space. */
const foldLine = line => {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const out = []
  let cur = '', size = 0
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length
    if (size + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; size = 0 }
    cur += ch; size += n
  }
  out.push(cur)
  return out.join('\r\n ')
}
const icsDate = (date, hm) => `${date.replace(/-/g, '')}T${hm.replace(':', '')}00`

/**
 * The plan's training days as calendar events (.ics) at the given local time, each with an alarm
 * `alarm` minutes before: the phone's Calendar does the reminding, no server, no notifications.
 */
export function planIcs(plan, exercisesById, { time = '18:00', minutes = 60, alarm = 30, lang = 'en', perSide = 'per side', now = new Date() } = {}) {
  const [h, m] = time.split(':').map(Number)
  const end = new Date(2000, 0, 1, h, m + minutes)
  const endHm = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sets//aelena.com/sets//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${icsText(nameOf(plan, lang))}`]
  for (let i = 0; i < plan.days; i++) {
    const date = addDays(plan.start, i)
    const d = planDay(plan, date)
    if (d.rest) continue
    const body = d.items.map(it => `${nameOf(exercisesById[it.exerciseId], lang) || it.exerciseId}: ${targetLabel(it, exercisesById[it.exerciseId], perSide)}`).join('\n')
    lines.push(
      'BEGIN:VEVENT', `UID:${plan.id}-${date}@sets`, `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(date, time)}`, `DTEND:${icsDate(end.getDate() > 1 ? addDays(date, 1) : date, endHm)}`,
      `SUMMARY:${icsText(`${nameOf(d, lang) || nameOf(plan, lang)} · ${d.n}/${plan.days}`)}`,
      `DESCRIPTION:${icsText(`${body}\n\naelena.com/sets`)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(nameOf(d, lang) || nameOf(plan, lang))}`, `TRIGGER:-PT${alarm}M`, 'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
