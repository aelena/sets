import { test, expect } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// Renders the recap image for a fixture session over every bundled background, both formats.
// Output: recap-samples/<background>-<format>.jpg (and attached to the report) for eyeballing.

const day = (d, h, m) => new Date(2026, 9, d, h, m).getTime()
const exercises = [
  { id: 'back-squat', name: 'Back Squat', type: 'reps', sets: 5, reps: 5, kg: 100 },
  { id: 'deadlift', name: 'Deadlift', type: 'reps', sets: 3, reps: 5, kg: 140 },
  { id: 'bench-press', name: 'Bench Press', type: 'reps', sets: 5, reps: 5, kg: 80 },
  { id: 'pull-ups', name: 'Pull ups', type: 'reps', sets: 3, reps: 10, kg: null },
  { id: 'plank', name: 'Plank', type: 'time', sets: 3, seconds: 60, kg: null },
].map(e => ({ reps: null, seconds: null, perSide: false, desc: '', link: '', archived: false, ...e }))

const block = (date, sessionId, start, plan) => {
  let ts = start
  return plan.flatMap(([exerciseId, list]) => list.map(([amount, kg]) => {
    ts += 3 * 60_000
    const timed = exerciseId === 'plank'
    return { ts, date, exerciseId, groupId: null, sessionId, reps: timed ? null : amount, seconds: timed ? amount : null, kg }
  }))
}
const lastWeek = block('2026-10-09', 'fx-old', day(9, 18, 0), [
  ['back-squat', Array(5).fill([5, 95])], ['deadlift', Array(3).fill([5, 135])], ['bench-press', Array(5).fill([5, 80])],
  ['pull-ups', [[10, null], [10, null], [9, null]]], ['plank', [[60, null], [60, null], [50, null]]],
])
const today = block('2026-10-16', 'fx-today', day(16, 18, 5), [
  ['back-squat', Array(5).fill([5, 100])], ['deadlift', [[5, 140], [5, 140], [5, 140]]], ['bench-press', [[5, 80], [5, 80], [5, 80], [5, 80], [4, 80]]],
  ['pull-ups', [[12, null], [10, null], [10, null]]], ['plank', [[60, null], [60, null], [60, null]]],
])
const sessions = [
  { id: 'fx-old', start: day(9, 18, 0), end: day(9, 19, 0), auto: false, summary: '', stats: { rests: 8, restMs: 720_000 } },
  { id: 'fx-today', start: day(16, 18, 5), end: day(16, 19, 13), auto: false, summary: 'fixture', stats: { rests: 9, restMs: 810_000 } },
]

test('recap samples over every background', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'webkit', 'one browser is enough to look at')
  test.setTimeout(180_000)
  await page.addInitScript(v => localStorage.setItem('exercise-tracker:settings', JSON.stringify({ lang: 'en', userName: 'Antonio', lastBackup: Date.now(), lastSeenVersion: v })), JSON.parse(readFileSync('package.json', 'utf8')).version)
  await page.goto('/')
  await expect(page.getByRole('tab').first()).toBeVisible() // Dexie has created the schema

  await page.evaluate(async ({ exercises, sets, sessions }) => {
    const db = await new Promise((ok, fail) => { const r = indexedDB.open('exercise-tracker'); r.onsuccess = () => ok(r.result); r.onerror = fail })
    const tx = db.transaction(['exercises', 'sets', 'sessions'], 'readwrite')
    exercises.forEach(e => tx.objectStore('exercises').put(e))
    sets.forEach(s => tx.objectStore('sets').add(s))
    sessions.forEach(s => tx.objectStore('sessions').put(s))
    await new Promise(ok => (tx.oncomplete = ok))
    db.close()
  }, { exercises, sets: [...lastWeek, ...today], sessions })
  await page.reload()

  await page.getByRole('button', { name: 'Progress' }).click()
  await page.getByRole('button', { name: 'History' }).click()
  await page.getByText(/^Session 18:05/).click()
  await page.getByRole('button', { name: 'Share image' }).click()
  const img = page.getByTestId('recap-preview')
  await expect(img).toBeVisible()

  const backgrounds = await page.getByRole('radiogroup', { name: 'Background' }).getByRole('radio').evaluateAll(rs => rs.map(r => r.getAttribute('aria-label')))
  expect(backgrounds.length).toBeGreaterThan(3)
  mkdirSync('recap-samples', { recursive: true })

  for (const format of ['story', 'post']) {
    await page.getByRole('button', { name: format === 'story' ? 'Story 9:16' : 'Post 4:5' }).click()
    for (const bg of backgrounds) {
      const before = await img.getAttribute('src')
      await page.getByRole('radio', { name: bg, exact: true }).click()
      if (bg !== backgrounds[0] || format !== 'story') await expect(img).not.toHaveAttribute('src', before)
      const { w, h, b64 } = await img.evaluate(async i => {
        await i.decode()
        const blob = await (await fetch(i.src)).blob()
        const b64 = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result.split(',')[1]); fr.readAsDataURL(blob) })
        return { w: i.naturalWidth, h: i.naturalHeight, b64 }
      })
      expect([w, h]).toEqual(format === 'story' ? [1080, 1920] : [1080, 1350])
      const name = `${bg.replace(/\.\w+$/, '')}-${format}.jpg`
      writeFileSync(`recap-samples/${name}`, Buffer.from(b64, 'base64'))
      await info.attach(name, { body: Buffer.from(b64, 'base64'), contentType: 'image/jpeg' })
    }
  }
})
