import { dateKey } from './time.js'

/**
 * Weeks of a month, Monday first, padded with the neighbouring months' days.
 * month is 0-based, as in Date. Each cell: { date: 'YYYY-MM-DD', day, inMonth }.
 */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7 // Monday = 0
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Math.ceil((lead + days) / 7) * 7
  const weeks = []
  for (let i = 0; i < cells; i++) {
    const d = new Date(year, month, 1 - lead + i)
    if (i % 7 === 0) weeks.push([])
    weeks.at(-1).push({ date: dateKey(d), day: d.getDate(), inMonth: d.getMonth() === month })
  }
  return weeks
}

/** Narrow weekday names, Monday first, in the given locale. */
export const weekdays = lang =>
  Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(lang, { weekday: 'narrow' }).format(new Date(2026, 9, 12 + i))) // 12 Oct 2026 is a Monday
