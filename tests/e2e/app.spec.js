import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { CHANGELOG } from '../../src/lib/changelog.js'

const VERSION = JSON.parse(readFileSync('package.json', 'utf8')).version

/** Open the app and wait past the splash: a fresh phone seeds every pack first, which takes a while on a loaded WebKit. */
const open = async page => {
  await page.goto('/')
  await expect(page.getByRole('tab').first()).toBeVisible({ timeout: 30_000 })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(v => localStorage.setItem('exercise-tracker:settings', JSON.stringify({ lang: 'en', askHowItWent: false, lastBackup: Date.now(), lastSeenVersion: v })), VERSION)
  await open(page)
})

const row = (page, name) => page.locator('li', { has: page.getByRole('button', { name: `Log set: ${name}`, exact: true }) })

test('seeded groups show in order and switch', async ({ page }) => {
  await expect(page.getByRole('tab', { name: 'Kettlebell Supergroup' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.title').first()).toHaveText('Chest Thrusts')
  await expect(page.locator('.title')).toHaveCount(12)
  await page.getByRole('tab', { name: 'My Warm up Routine' }).click()
  await expect(page.locator('.title')).toHaveText(['Arm superseries', 'Disc routine', 'Push-up Touch Superseries'])
  await page.getByRole('button', { name: /Disc routine/ }).first().click()
  await expect(page.getByText(/^Plate superseries: front, lateral and halos/)).toBeVisible()
})

test('log a set prefilled from the target, undo it, then edit one', async ({ page }) => {
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await expect(page.getByLabel('reps')).toHaveValue('10')
  await expect(page.getByLabel('kg', { exact: true })).toHaveValue('16')
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('1/5')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('0/5')

  // second set is prefilled from the first one, not the target
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByLabel('reps').fill('8')
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await expect(page.getByLabel('reps')).toHaveValue('8')
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('2/5')

  await row(page, 'Halos').getByRole('button', { name: /^Halos/ }).click()
  await page.getByRole('button', { name: '1: 8 @16kg' }).click()
  await page.getByLabel('kg', { exact: true }).fill('20')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('button', { name: '1: 8 @20kg' })).toBeVisible()
})

test('session with a rest ends in a summary', async ({ page }) => {
  await page.getByRole('button', { name: 'Start session' }).click()
  await expect(page.getByRole('button', { name: 'Stop session' })).toBeEnabled()
  await page.getByRole('button', { name: 'Log set: Chest Thrusts', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('button', { name: 'Rest', exact: true }).click()
  await expect(page.getByTestId('rest-clock')).toBeVisible()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Stop rest' }).click()
  await expect(page.getByTestId('rest-clock')).toBeHidden()
  await page.getByRole('button', { name: 'Stop session' }).click()
  const summary = page.getByTestId('summary')
  await expect(summary).toContainText('1 sets · 1 exercises · 800 kg volume')
  await expect(summary).toContainText('Rest: 1×')
  await expect(summary).toContainText('Chest Thrusts: 50 @16kg')
  await page.getByRole('button', { name: 'Close' }).last().click()

  await page.getByRole('button', { name: 'Progress' }).click()
  await page.getByRole('button', { name: 'Charts' }).click() // Progress opens on Overview
  await expect(page.locator('.chart canvas')).toBeVisible()
  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByText(/^Session \d\d:\d\d/)).toBeVisible()
})

test('notes are saved for the day', async ({ page }) => {
  await page.getByRole('button', { name: 'Notes' }).click()
  await page.getByRole('textbox', { name: 'Notes' }).fill('Left shoulder a bit tight')
  await page.getByRole('button', { name: 'Add note' }).click()
  await expect(page.locator('.notes')).toContainText('Left shoulder a bit tight')
})

test('edit a group: add a timed exercise and reorder', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('button', { name: /My Warm up Routine/ }).click()
  await page.getByRole('button', { name: 'New exercise' }).click()
  await page.getByLabel('Name', { exact: true }).fill('Plank')
  await page.getByRole('button', { name: 'Time', exact: true }).click()
  await page.getByLabel('Seconds').fill('60')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('button', { name: 'Remove: Plank' })).toBeVisible()
  const plankUp = page.locator('.items li', { hasText: 'Plank' }).getByRole('button', { name: 'Up', exact: true })
  await plankUp.click()
  await expect(page.locator('.items li').nth(2)).toContainText('Plank')
  await plankUp.click()
  await expect(page.locator('.items li').nth(1)).toContainText('Plank')
  await page.getByRole('button', { name: 'Train' }).click()
  await page.getByRole('tab', { name: 'My Warm up Routine' }).click()
  await expect(page.locator('.title')).toHaveText(['Arm superseries', 'Plank', 'Disc routine', 'Push-up Touch Superseries'])
  await page.getByRole('button', { name: 'Log set: Plank', exact: true }).click()
  await expect(page.getByLabel('seconds')).toHaveValue('60')
})

test('Spanish UI translates the UI and shows Spanish exercise names', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Español' }).click()
  await page.getByRole('button', { name: 'Entrenar' }).click()
  await expect(page.getByRole('button', { name: 'Empezar sesión' })).toBeVisible()
  await expect(page.locator('.title').first()).toHaveText('Empujes desde el pecho')
})

test('exports the config file', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Export exercise config/ }).click()])
  expect(download.suggestedFilename()).toMatch(/^sets-config-\d{4}-\d\d-\d\d\.json$/)
})

test('shows last time and flames a personal best', async ({ page }) => {
  const halos = row(page, 'Halos')
  await page.clock.setFixedTime(new Date(2026, 9, 14, 18, 0))
  await page.reload()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(halos.getByTestId('count')).toHaveText('1/5')

  await page.clock.setFixedTime(new Date(2026, 9, 16, 18, 0))
  await page.reload()
  await expect(halos.getByTestId('count')).toHaveText('0/5')
  await expect(halos.getByTestId('last')).toHaveText('last: 1×10 @16kg · Wed')
  await expect(halos.getByTitle('Personal best')).toHaveCount(0)

  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByLabel('reps').fill('12')
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(halos.getByTestId('count')).toHaveText('1/5')
  await expect(halos.getByTitle('Personal best')).toHaveCount(0) // Halos' 2nd day: no flames yet

  // ten more earlier Halos days (8 reps), so today is its 12th training day
  await page.evaluate(async () => {
    const db = await new Promise(ok => { const r = indexedDB.open('exercise-tracker'); r.onsuccess = () => ok(r.result) })
    const tx = db.transaction('sets', 'readwrite')
    for (let d = 1; d <= 10; d++) tx.objectStore('sets').add({ ts: new Date(2026, 8, d, 18).getTime(), date: `2026-09-${String(d).padStart(2, '0')}`, exerciseId: 'halos', reps: 8, kg: 16, sessionId: null })
    await new Promise(ok => (tx.oncomplete = ok))
    db.close()
  })
  await page.reload()
  await expect(halos.getByTitle('Personal best')).toBeVisible()
  // another exercise with no history logs a big set today: no flame, it has only one day
  await page.getByRole('button', { name: 'Log set: Chest Thrusts', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(row(page, 'Chest Thrusts').getByTitle('Personal best')).toHaveCount(0)
  await halos.getByRole('button', { name: /^Halos/ }).click()
  await expect(page.getByRole('button', { name: '1: 12 @16kg' }).getByLabel('Personal best')).toBeVisible()
})

test('summary offers a backup and a shareable recap image', async ({ page }) => {
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('button', { name: 'Stop session' }).click()
  await expect(page.getByText('Last backup: today')).toBeVisible()

  const [backup] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Back up' }).click()])
  expect(backup.suggestedFilename()).toMatch(/^sets-backup-.*\.json$/)

  await page.getByRole('button', { name: 'Share image' }).click()
  const img = page.getByTestId('recap-preview')
  await expect(img).toBeVisible()
  expect(await img.evaluate(i => [i.naturalWidth, i.naturalHeight])).toEqual([1080, 1920])
  await page.getByRole('button', { name: 'Post 4:5' }).click()
  await expect.poll(() => img.evaluate(i => i.naturalHeight), { timeout: 15_000 }).toBe(1350) // re-render can be slow under load
  await page.getByRole('radio', { name: 'ember' }).click()
  const [shot] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Share', exact: true }).click()])
  expect(shot.suggestedFilename()).toMatch(/^sets-recap-\d{4}-\d\d-\d\d\.jpg$/)
})

test('log running from duration and pace, an other activity, both in the summary', async ({ page }) => {
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('tab', { name: 'Cardio & more' }).click()
  await expect(page.locator('.title')).toHaveCount(0) // the activities tab shows no exercises
  await page.getByRole('button', { name: 'Log activity: Running' }).click()
  await page.getByLabel('Duration (min)').fill('30')
  await page.getByLabel('Pace (min/km)').fill("6'")
  await expect(page.getByLabel('Distance (km)')).toHaveValue('5')
  await expect(page.getByTestId('activity-preview')).toHaveText('30 min · 5 km · 6:00/km')
  await page.getByRole('button', { name: 'Log activity', exact: true }).click()
  await expect(page.getByRole('button', { name: '30 min · 5 km · 6:00/km' })).toBeVisible()

  await page.getByRole('button', { name: 'Other activity…' }).click()
  await page.getByLabel('Activity name').fill('Swimming')
  await page.getByLabel('Duration (min)').fill('40')
  await page.getByRole('button', { name: 'Log activity', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Log activity: Swimming' })).toBeVisible()
  await expect(page.getByRole('button', { name: '40 min', exact: true })).toBeVisible()

  // editing an entry: change the distance, pace follows
  await page.getByRole('button', { name: '30 min · 5 km · 6:00/km' }).click()
  await page.getByLabel('Distance (km)').fill('6')
  await expect(page.getByLabel('Pace (min/km)')).toHaveValue('5:00')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('button', { name: '30 min · 6 km · 5:00/km' })).toBeVisible()

  await page.getByRole('button', { name: 'Stop session' }).click()
  const summary = page.getByTestId('summary')
  await expect(summary).toContainText('0 sets · 0 exercises · 2 activities')
  await expect(summary).toContainText('Running: 30 min · 6 km · 5:00/km')
  await expect(summary).toContainText('Swimming: 40 min')
})

test('calendar marks session days and opens a day', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 14, 18, 0))
  await page.reload()
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('button', { name: 'Stop session' }).click()
  await page.getByRole('button', { name: 'Close' }).last().click()
  await page.clock.setFixedTime(new Date(2026, 9, 16, 9, 0))
  await page.reload()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click() // ad hoc, no session
  await page.getByRole('button', { name: 'Log set', exact: true }).click()

  await page.getByRole('button', { name: 'Progress' }).click()
  await page.getByRole('button', { name: 'Calendar' }).click()
  await expect(page.getByTestId('cal-count')).toHaveText('1 sessions')
  const session = page.locator('[data-date="2026-10-14"]')
  await expect(session).toHaveClass(/session/)
  expect(await session.evaluate(e => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color])).toEqual(['rgb(31, 95, 191)', 'rgb(255, 255, 255)'])
  await expect(page.locator('[data-date="2026-10-16"]')).toHaveClass(/other/)
  await expect(page.locator('[data-date="2026-10-15"]')).not.toHaveClass(/session|other/)

  await session.click()
  await expect(page.getByText(/^Session 18:00/)).toBeVisible()
  await page.getByRole('button', { name: '›' }).click()
  await expect(page.getByTestId('cal-count')).toHaveText('0 sessions')
})

test('calendar session days stay blue with white text in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Stop session' }).click()
  await page.getByRole('button', { name: 'Close' }).last().click()
  await page.getByRole('button', { name: 'Progress' }).click()
  await page.getByRole('button', { name: 'Calendar' }).click()
  const today = page.locator('.day.session')
  expect(await today.evaluate(e => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color])).toEqual(['rgb(47, 111, 214)', 'rgb(255, 255, 255)'])
})

test('classic groups come with a description in the UI language and a form link', async ({ page }) => {
  await page.getByRole('tab', { name: 'Triceps' }).click()
  await page.getByRole('button', { name: /^Dips/ }).click()
  await expect(page.getByText(/^Upright torso for triceps/)).toBeVisible()
  await expect(page.getByRole('link', { name: /Watch how/ })).toHaveAttribute('href', /search_query=Dips\+proper\+form/)
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Español' }).click()
  await page.getByRole('button', { name: 'Entrenar' }).click()
  await page.getByRole('button', { name: /^Fondos \d/ }).click() // names follow the UI language too (not "Fondos en banco")
  await expect(page.getByText(/^Torso erguido para tríceps/)).toBeVisible()
  await expect(page.getByText(/^Upright torso/)).toHaveCount(0)
})

test('Today toggle lists what was done today across groups', async ({ page }) => {
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('tab', { name: 'Biceps' }).click()
  await page.getByRole('button', { name: 'Log set: Barbell Curl', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(row(page, 'Barbell Curl').getByTestId('count')).toHaveText('1/4') // every target is at least 4 sets

  await page.getByRole('button', { name: 'Only my current workout' }).click()
  await expect(page.getByTestId('today-bar')).toBeVisible()
  await expect(page.getByRole('tab')).toHaveCount(0)
  await expect(page.locator('.title')).toHaveText(['Halos', 'Barbell Curl'])
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('2/5')

  await page.getByRole('button', { name: 'Only my current workout' }).click()
  await expect(page.getByRole('tab', { name: 'Biceps' })).toBeVisible()
})

test('Spanish UI shows Spanish names; the activities tab sits after the groups', async ({ page }) => {
  await expect(page.getByRole('tab').last()).toHaveText('Cardio & more')
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Español' }).click()
  await page.getByRole('button', { name: 'Entrenar' }).click()
  await page.getByRole('tab', { name: 'Espalda' }).click()
  await expect(page.locator('.title').first()).toHaveText('Peso muerto')
  await page.getByRole('tab', { name: 'Cardio y más' }).click()
  await expect(page.locator('.aname')).toHaveText(['Bici estática', 'Remo', 'Correr', 'Sprints'])
})

test('Overview: days since each muscle, sessions per week, session length', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 6, 18, 0)) // ten days before "today"
  await page.reload()
  await page.getByRole('tab', { name: 'Leg Day' }).click()
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Back Squat', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.clock.setFixedTime(new Date(2026, 9, 6, 18, 45))
  await page.getByRole('button', { name: 'Stop session' }).click()
  await page.getByRole('button', { name: 'Close' }).last().click()

  await page.clock.setFixedTime(new Date(2026, 9, 16, 18, 0))
  await page.reload()
  await page.getByRole('tab', { name: 'Kettlebell Supergroup' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()

  await page.getByRole('button', { name: 'Progress' }).click()
  const rows = page.getByTestId('recency').locator('li')
  const quads = rows.filter({ hasText: 'Quads' })
  await expect(quads).toContainText('10 days ago')
  await expect(quads).toContainText('a week')
  await expect(rows.first()).toContainText('10 days ago') // most stale first
  await expect(page.getByTestId('recency')).toContainText('Kettlebell Supergroup')
  await expect(page.getByTestId('recency')).toContainText('today')
  await expect(page.getByTestId('avg-length')).toHaveText('avg 45 min over the last 1')
  // round 2
  await expect(page.getByTestId('streak')).toContainText('weeks in a row')
  await expect(page.getByRole('heading', { name: 'Sets per muscle per week' })).toBeVisible()
  await expect(page.getByRole('img', { name: /^Quads: / })).toBeVisible()
  await expect(page.getByTestId('avg-volume')).toBeVisible()
  await expect(page.getByTestId('time-of-day')).toContainText('Evening')
  await expect(page.locator('.chart canvas')).toHaveCount(4) // sessions/week, length, volume, rest
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize().width)
})

test('loose sets complete into an untimed session for the day, apart from a timed one', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 19, 10, 0))
  await page.reload()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('button', { name: 'Log set: Chest Thrusts', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(page.getByTestId('loose-bar')).toContainText('2 logged outside a timed session today')

  await page.getByRole('button', { name: 'Complete' }).click()
  const summary = page.getByTestId('summary')
  await expect(summary).toContainText('2026-10-19 · untimed')
  await expect(summary).toContainText('2 sets · 2 exercises')
  await page.getByRole('button', { name: 'Share image' }).click()
  await expect(page.getByTestId('recap-preview')).toBeVisible()
  expect(await page.getByTestId('recap-preview').evaluate(i => i.naturalHeight)).toBe(1920)
  await page.getByRole('dialog', { name: 'Session recap' }).getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Close' }).last().click()
  await expect(page.getByTestId('loose-bar')).toHaveCount(0)

  // the gym in the evening: a timed session of its own
  await page.clock.setFixedTime(new Date(2026, 9, 19, 18, 0))
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(page.getByTestId('loose-bar')).toHaveCount(0)
  await page.getByRole('button', { name: 'Stop session' }).click()
  await expect(page.getByTestId('summary')).toContainText('1 sets · 1 exercises')
  await page.getByRole('button', { name: 'Close' }).last().click()

  await page.getByRole('button', { name: 'Progress' }).click()
  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByText('Untimed session', { exact: true })).toBeVisible()
  await expect(page.getByText(/^Session 18:00/)).toBeVisible()
})

test('reordering groups in Edit changes the tabs on Train', async ({ page }) => {
  await expect(page.getByRole('tab').nth(1)).toHaveText('My Warm up Routine')
  await page.getByRole('button', { name: 'Edit' }).click()
  const core = page.locator('.items li', { hasText: 'Core' })
  for (let i = 0; i < 6; i++) await core.getByRole('button', { name: 'Up', exact: true }).click()
  await expect(page.locator('.items li').first()).toContainText('Core')
  await page.getByRole('button', { name: 'Train' }).click()
  await expect(page.getByRole('tab').first()).toHaveText('Core')
  await expect(page.getByRole('tab').last()).toHaveText('Cardio & more')
  await page.reload()
  await expect(page.getByRole('tab').first()).toHaveText('Core')
})

test('keeps the screen on during a session, always, or never', async ({ page }) => {
  await page.addInitScript(() => {
    window.__wake = { requests: 0, releases: 0 }
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request: async () => { window.__wake.requests++; return { release: async () => { window.__wake.releases++ }, addEventListener() {} } } },
    })
  })
  await page.reload()
  const wake = () => page.evaluate(() => window.__wake)
  expect((await wake()).requests).toBe(0) // default: only in a session
  await page.getByRole('button', { name: 'Start session' }).click()
  await expect.poll(async () => (await wake()).requests).toBe(1)
  await page.getByRole('button', { name: 'Stop session' }).click()
  await expect.poll(async () => (await wake()).releases).toBe(1)
  await page.getByRole('button', { name: 'Close' }).last().click()

  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByTestId('wake-status')).toHaveText('Not keeping the screen on right now.')
  await page.getByRole('button', { name: 'Always', exact: true }).click()
  await expect(page.getByTestId('wake-status')).toHaveText('The screen is being kept on now.')
  await page.getByRole('button', { name: 'Never', exact: true }).click()
  await expect(page.getByTestId('wake-status')).toHaveText('Not keeping the screen on right now.')
  await page.getByRole('button', { name: 'Train' }).click()
  await expect(page.getByRole('button', { name: 'Rest', exact: true })).toBeDisabled() // no session: no rest
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.waitForTimeout(300)
  expect((await wake()).requests).toBe(2) // "Never" holds even in a session
})

test('counters reset after Complete and after stopping a session; last shows "today"', async ({ page }) => {
  const halos = row(page, 'Halos')
  await page.clock.setFixedTime(new Date(2026, 9, 19, 9, 0))
  await page.reload()
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
    await page.getByRole('button', { name: 'Log set', exact: true }).click()
  }
  await expect(halos.getByTestId('count')).toHaveText('2/5')
  await page.getByRole('button', { name: 'Complete' }).click()
  await page.getByRole('button', { name: 'Close' }).last().click() // no image: completed anyway
  await expect(halos.getByTestId('count')).toHaveText('0/5')
  await expect(halos.getByTestId('last')).toHaveText('last: 2×10 @16kg · today')

  await page.clock.setFixedTime(new Date(2026, 9, 19, 18, 0)) // the gym, later that day
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(halos.getByTestId('count')).toHaveText('1/5')
  await page.getByRole('button', { name: 'Stop session' }).click()
  await page.getByRole('button', { name: 'Close' }).last().click()
  await expect(halos.getByTestId('count')).toHaveText('0/5')
  await expect(halos.getByTestId('last')).toHaveText('last: 1×10 @16kg · today')
})

test('opening the app on a new day completes yesterday\'s loose sets and starts at 0', async ({ page }) => {
  const halos = row(page, 'Halos')
  await page.clock.setFixedTime(new Date(2026, 9, 18, 21, 0))
  await page.reload()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(page.getByTestId('loose-bar')).toBeVisible()

  await page.clock.setFixedTime(new Date(2026, 9, 19, 8, 0))
  await page.reload()
  await expect(page.getByText(/^Earlier loose sets were completed as untimed sessions \(1\)/)).toBeVisible()
  await expect(page.getByTestId('loose-bar')).toHaveCount(0)
  await expect(halos.getByTestId('count')).toHaveText('0/5')
  await page.getByRole('button', { name: 'Progress' }).click()
  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByText('Untimed session', { exact: true })).toBeVisible()
})

test('Kegels for men and women are the last groups; push-up variations and hip thrust are there', async ({ page }) => {
  const tabs = page.getByRole('tab')
  await expect(tabs.nth(-3)).toHaveText('Kegels · Men')
  await expect(tabs.nth(-2)).toHaveText('Kegels · Women')
  await expect(tabs.last()).toHaveText('Cardio & more')
  await page.getByRole('tab', { name: 'Kegels · Women' }).click()
  await page.getByRole('button', { name: /^Quick Kegels \(women\)/ }).click()
  await expect(page.getByText(/vagina and anus draw up and in/)).toBeVisible()
  await page.getByRole('tab', { name: 'Push ups' }).click()
  await expect(page.locator('.title')).toContainText(['Push ups', 'Diamond Push ups', 'Wide Push ups', 'Archer Push ups'])
  await page.getByRole('tab', { name: 'Leg Day' }).click()
  await expect(page.locator('.title')).toContainText(['Barbell Hip Thrust', 'Glute Bridge'])
})

test('sprints log seconds or metres, never prefilled', async ({ page }) => {
  await page.getByRole('tab', { name: 'Cardio & more' }).click()
  await page.getByRole('button', { name: 'Log activity: Sprints' }).click()
  await page.getByLabel('Time (seconds)').fill('30')
  await expect(page.getByTestId('activity-preview')).toHaveText('30 s')
  await page.getByRole('button', { name: 'Log activity', exact: true }).click()
  await expect(page.getByRole('button', { name: '30 s', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Log activity: Sprints' }).click()
  await expect(page.getByLabel('Time (seconds)')).toHaveValue('') // no defaults
  await expect(page.getByLabel('Distance (metres)')).toHaveValue('')
  await page.getByLabel('Distance (metres)').fill('400')
  await page.getByLabel('Time (seconds)').fill('70')
  await expect(page.getByTestId('activity-preview')).toHaveText('70 s · 400 m · 2:55/km')
  await page.getByRole('button', { name: 'Log activity', exact: true }).click()
  await expect(page.getByRole('button', { name: '70 s · 400 m · 2:55/km' })).toBeVisible()

  // no staleness rules: sprints do not create a cardio row in Overview
  await page.getByRole('button', { name: 'Progress' }).click()
  await expect(page.getByTestId('recency')).toHaveCount(0)
})

test('a morning run joins the evening gym session when it ends', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 20, 8, 0))
  await page.reload()
  await page.getByRole('tab', { name: 'Cardio & more' }).click()
  await page.getByRole('button', { name: 'Log activity: Running' }).click()
  await page.getByLabel('Duration (min)').fill('45')
  await page.getByLabel('Distance (km)').fill('8.5')
  await page.getByRole('button', { name: 'Log activity', exact: true }).click()
  await expect(page.getByTestId('loose-bar')).toBeVisible() // left hanging, not completed

  await page.clock.setFixedTime(new Date(2026, 9, 20, 18, 0))
  await page.getByRole('tab', { name: 'Kettlebell Supergroup' }).click()
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.clock.setFixedTime(new Date(2026, 9, 20, 19, 0))
  await page.getByRole('button', { name: 'Stop session' }).click()

  const offer = page.getByTestId('bundle')
  await expect(offer).toContainText('Running 45 min · 8.5 km')
  await page.getByRole('button', { name: 'Add to this session' }).click()
  await expect(offer).toHaveCount(0)
  await expect(page.getByTestId('summary')).toContainText('Running: 45 min · 8.5 km')
  await expect(page.getByTestId('summary')).toContainText('18:00 → 19:00 · 1h 00m · total 1h 45m')
  await page.getByRole('button', { name: 'Share image' }).click()
  await expect(page.getByTestId('recap-preview')).toBeVisible()
  await page.getByRole('dialog', { name: 'Session recap' }).getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Close' }).last().click()
  await expect(page.getByTestId('loose-bar')).toHaveCount(0)
})

test('a run after the gym session joins it from the loose bar, and the image is made again', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 20, 18, 0))
  await page.reload()
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.clock.setFixedTime(new Date(2026, 9, 20, 19, 0))
  await page.getByRole('button', { name: 'Stop session' }).click()
  await expect(page.getByTestId('bundle')).toHaveCount(0) // nothing loose yet
  await page.getByRole('button', { name: 'Close' }).last().click()

  await page.clock.setFixedTime(new Date(2026, 9, 20, 19, 30))
  await page.getByRole('tab', { name: 'Cardio & more' }).click()
  await page.getByRole('button', { name: 'Log activity: Running' }).click()
  await page.getByLabel('Duration (min)').fill('30')
  await page.getByLabel('Distance (km)').fill('5')
  await page.getByRole('button', { name: 'Log activity', exact: true }).click()
  const bar = page.getByTestId('loose-bar')
  await expect(bar).toContainText('1 logged outside a timed session today')
  await bar.getByRole('button', { name: "Add to today's session" }).click()
  await expect(page.getByTestId('summary')).toContainText('18:00 → 19:00 · 1h 00m · total 1h 30m')
  await expect(page.getByTestId('summary')).toContainText('Running: 30 min · 5 km')
  await expect(page.getByTestId('bundle')).toHaveCount(0)
  await page.getByRole('button', { name: 'Share image' }).click()
  await expect(page.getByTestId('recap-preview')).toBeVisible()
  await page.getByRole('dialog', { name: 'Session recap' }).getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Close' }).last().click()
  await expect(bar).toHaveCount(0)

  // History shows one session for the day, with the run in it
  await page.getByRole('button', { name: 'Progress' }).click()
  await page.getByRole('button', { name: 'History' }).click()
  await page.getByText('Session 18:00 · 1h 30m').click()
  await expect(page.locator('details pre')).toContainText('Running: 30 min · 5 km')
  await expect(page.getByRole('button', { name: "Add the day's loose items to this session" })).toHaveCount(0)
})

test('Settings → Share Sets shows the QR code and the address', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Share Sets' }).click()
  const sheet = page.getByRole('dialog', { name: 'Share Sets' })
  await expect(sheet.getByTestId('qr')).toBeVisible()
  await expect(sheet.getByTestId('qr')).toHaveAttribute('aria-label', 'https://aelena.com/sets/')
  await expect(sheet).toContainText('aelena.com/sets')
  await sheet.getByRole('button', { name: 'Close', exact: true }).first().click()
  await expect(sheet).toHaveCount(0)
})

test('keeping it separate leaves the run for the Complete bar', async ({ page }) => {
  await page.getByRole('tab', { name: 'Cardio & more' }).click()
  await page.getByRole('button', { name: 'Log activity: Running' }).click()
  await page.getByLabel('Duration (min)').fill('30')
  await page.getByRole('button', { name: 'Log activity', exact: true }).click()
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Stop session' }).click()
  await page.getByRole('button', { name: 'Keep separate' }).click()
  await expect(page.getByTestId('bundle')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close' }).last().click()
  await expect(page.getByTestId('loose-bar')).toBeVisible()
})

test('stopwatch: start, lap, stop, reset; digital and analog; keeps running when closed', async ({ page }) => {
  await page.getByRole('button', { name: 'Stopwatch' }).click()
  const time = page.getByTestId('stopwatch-time')
  await expect(time).toHaveText('00:00.00')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Lap', exact: true }).click()
  await expect(page.getByTestId('laps')).toContainText('Lap 1')
  await page.getByRole('button', { name: 'Analog' }).click()
  await expect(page.getByRole('img', { name: /^\d\d:\d\d\.\d\d$/ })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('button', { name: 'Stopwatch' })).toHaveClass(/ticking/) // still running
  await page.reload()
  await page.getByRole('button', { name: 'Stopwatch' }).click()
  await page.getByRole('button', { name: 'Stop', exact: true }).click()
  const stopped = await time.textContent()
  expect(stopped > '00:01.00').toBe(true)
  await page.waitForTimeout(400)
  await expect(time).toHaveText(stopped)
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(time).toHaveText('00:00.00')
  await expect(page.getByTestId('laps')).toHaveCount(0)
})

test('recap title is drawn and kept with the session; Chest and the bodyweight groups sit before Kegels; version shows', async ({ page }) => {
  const tabs = page.getByRole('tab')
  await expect(tabs.nth(-6)).toHaveText('Chest')
  await expect(tabs.nth(-5)).toHaveText('Bodyweight')
  await expect(tabs.nth(-4)).toHaveText('Military Calisthenics')
  await expect(tabs.nth(-3)).toHaveText('Kegels · Men')

  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('button', { name: 'Stop session' }).click()
  await page.getByRole('button', { name: 'Share image' }).click()
  const img = page.getByTestId('recap-preview')
  await expect(img).toBeVisible()
  const plain = await img.getAttribute('src')
  await page.getByTestId('recap-title').fill('Killer day')
  await expect(img).not.toHaveAttribute('src', plain, { timeout: 15_000 })
  await page.waitForTimeout(600) // saved after a short pause
  await page.getByRole('dialog', { name: 'Session recap' }).getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Share image' }).click()
  await expect(page.getByTestId('recap-title')).toHaveValue('Killer day')

  await page.reload()
  await page.getByRole('button', { name: 'Settings' }).click()
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
  await expect(page.getByText(`Sets v${version} · MIT · github.com/aelena`)).toBeVisible()
})

test('the push-up superseries is in the warm-up; Chest has the pectoral fly and the review additions', async ({ page }) => {
  await page.getByRole('tab', { name: 'My Warm up Routine' }).click()
  await expect(page.locator('.title')).toContainText(['Arm superseries', 'Disc routine', 'Push-up Touch Superseries'])
  await page.getByRole('button', { name: /^Push-up Touch Superseries/ }).click()
  await expect(page.getByText(/29 push-ups/)).toBeVisible()
  await page.getByRole('tab', { name: 'Chest' }).click()
  await expect(page.locator('.title')).toContainText(['Incline Dumbbell Press', 'Pectoral Fly (Pec Deck)', 'Incline Dumbbell Fly'])
  await page.getByRole('tab', { name: 'Back', exact: true }).click()
  await expect(page.locator('.title')).toContainText(['One-arm Dumbbell Row', 'Bent-over Dumbbell Row'])
})

test("after an update the what's-new screen shows once; a fresh install skips it", async ({ page }) => {
  // each reload: 1 = fresh install (nothing seen, nothing logged), 2 = updated from 0.10.1
  await page.addInitScript(() => {
    const step = Number(sessionStorage.getItem('wn') ?? 0) + 1
    sessionStorage.setItem('wn', step)
    const s = JSON.parse(localStorage.getItem('exercise-tracker:settings'))
    localStorage.setItem('exercise-tracker:settings', JSON.stringify({ ...s, lastSeenVersion: step === 1 ? null : '0.10.1' }))
  })
  const dialog = page.getByRole('dialog', { name: "What's new" })
  const seen = () => page.evaluate(() => JSON.parse(localStorage.getItem('exercise-tracker:settings')).lastSeenVersion)
  await page.reload()
  await expect(page.getByRole('tab').first()).toBeVisible({ timeout: 30_000 })
  await expect.poll(seen).toBe(VERSION)
  await expect(dialog).toHaveCount(0)
  await page.reload()
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('whatsnew-version')).toHaveText(VERSION)
  await expect(dialog).toContainText(CHANGELOG[1].version) // the previous release is listed too
  await dialog.getByRole('button', { name: 'OK' }).click()
  await expect(dialog).toHaveCount(0)
  expect(await seen()).toBe(VERSION)
})

test('body weight makes bodyweight sets count in the kg tally of the ✓ view and in the summary', async ({ page }) => {
  await page.addInitScript(v => localStorage.setItem('exercise-tracker:settings', JSON.stringify({ lang: 'en', askHowItWent: false, lastBackup: Date.now(), lastSeenVersion: v, bodyKg: 80 })), VERSION)
  await open(page)
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('tab', { name: 'Push ups' }).click()
  await page.getByRole('button', { name: 'Log set: Push ups', exact: true }).click()
  await expect(page.getByLabel('kg', { exact: true })).toHaveValue('') // bodyweight: kg stays empty
  await page.getByLabel('reps').fill('10')
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('tab', { name: 'Kettlebell Supergroup' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click() // 10 @16kg

  await page.getByRole('button', { name: 'Only my current workout' }).click()
  await expect(page.getByTestId('today-tally')).toHaveText('2 sets · 2 exercises · 960 kg')
  await expect(row(page, 'Push ups').getByTestId('row-kg')).toHaveText('800 kg')
  await expect(row(page, 'Halos').getByTestId('row-kg')).toHaveText('160 kg')
  await page.getByRole('button', { name: 'Stop session' }).click()
  await expect(page.getByTestId('summary')).toContainText('2 sets · 2 exercises · 960 kg volume')
  await expect(page.getByTestId('summary')).toContainText('Push ups: 10\n')
})

test('training with a partner: sets are counted apart, the summary has their block, the recap makes two images', async ({ page }) => {
  await page.addInitScript(v => localStorage.setItem('exercise-tracker:settings', JSON.stringify({ lang: 'en', askHowItWent: false, lastBackup: Date.now(), lastSeenVersion: v, userName: 'Toni', partnerMode: true, partnerName: 'Ana', partnerKg: 60 })), VERSION)
  await open(page)
  const who = page.getByRole('group', { name: 'Who is logging' })
  await expect(who.getByRole('button', { name: 'Toni' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await expect(page.getByTestId('log-who')).toHaveText('Set 1 of 5 · Toni')
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('1/5')
  await expect(row(page, 'Halos').getByTestId('other-count')).toHaveText('Ana 0/5')

  await who.getByRole('button', { name: 'Ana' }).click()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('0/5')
  await expect(row(page, 'Halos').getByTestId('other-count')).toHaveText('Toni 1/5')
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await expect(page.getByTestId('log-who')).toHaveText('Set 1 of 5 · Ana')
  await page.getByLabel('kg', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(page.getByText('Logged · Halos 1/5 · Ana')).toBeVisible()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('1/5')
  // the partner's next set is prefilled from her own, not from Toni's
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await expect(page.getByLabel('kg', { exact: true })).toHaveValue('8')
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('2/5')
  await who.getByRole('button', { name: 'Toni' }).click()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('1/5')
  await expect(row(page, 'Halos').getByTestId('other-count')).toHaveText('Ana 2/5')

  await page.getByRole('button', { name: 'Stop session' }).click()
  const summary = page.getByTestId('summary')
  await expect(summary).toContainText('1 sets · 1 exercises · 160 kg volume')
  await expect(summary).toContainText('— Ana —\n2 sets · 1 exercises · 160 kg volume\nHalos: 10 @8kg, 10 @8kg')

  await page.getByRole('button', { name: 'Share image' }).click()
  const img = page.getByTestId('recap-preview')
  await expect(img).toBeVisible()
  const recapWho = page.getByTestId('recap-who')
  await expect(recapWho.getByRole('button', { name: 'Toni' })).toHaveAttribute('aria-pressed', 'true')
  await recapWho.getByRole('button', { name: 'Ana' }).click()
  await expect(img).toBeVisible()
  const [hers] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Share', exact: true }).click()])
  expect(hers.suggestedFilename()).toMatch(/^sets-recap-\d{4}-\d\d-\d\d-ana\.jpg$/)
  const names = []
  page.on('download', d => names.push(d.suggestedFilename()))
  await page.getByRole('button', { name: 'Share both images' }).click()
  await expect.poll(() => names.length, { timeout: 15_000 }).toBe(2)
  expect(names.map(n => n.replace(/\d{4}-\d\d-\d\d/, 'D')).sort()).toEqual(['sets-recap-D-ana.jpg', 'sets-recap-D.jpg'])
})

test('import a GPX run: the sheet shows the run, it joins the gym session of its day, the recap carries the route', async ({ page }) => {
  // the gym session in the evening of Oct 20, then the run of that morning imported the day after
  await page.clock.setFixedTime(new Date(2026, 9, 20, 18, 0))
  await page.reload()
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.clock.setFixedTime(new Date(2026, 9, 20, 19, 0))
  await page.getByRole('button', { name: 'Stop session' }).click()
  await page.getByRole('button', { name: 'Close' }).last().click()

  await page.clock.setFixedTime(new Date(2026, 9, 21, 10, 0))
  await page.reload()
  const t0 = new Date(2026, 9, 20, 8, 0).getTime()
  const pts = Array.from({ length: 61 }, (_, i) => `<trkpt lat="${(40.4 + i * 0.00015).toFixed(5)}" lon="${(-3.7 + (i < 30 ? 0 : (i - 30) * 0.0002)).toFixed(5)}"><ele>${650 + Math.floor(i / 10) * 4}</ele><time>${new Date(t0 + i * 30_000).toISOString()}</time></trkpt>`)
  const buffer = Buffer.from(`<?xml version="1.0"?><gpx version="1.1" creator="test"><trk><name>Retiro loop</name><trkseg>${pts.join('')}</trkseg></trk></gpx>`)
  await page.getByRole('tab', { name: 'Cardio & more' }).click()
  await page.getByLabel('Import a run (GPX)…').setInputFiles({ name: 'retiro.gpx', mimeType: 'application/gpx+xml', buffer })
  await expect(page.getByRole('dialog', { name: 'Import run' })).toBeVisible()
  await expect(page.getByText('Retiro loop')).toBeVisible()
  await expect(page.getByTestId('gpx-when')).toContainText('08:00 → 08:30')
  await expect(page.getByTestId('gpx-stats')).toContainText('30 min')
  await expect(page.getByTestId('gpx-stats')).toContainText('↑24 m')
  await expect(page.getByTestId('route')).toBeVisible()
  await expect(page.getByLabel("Add to that day's session (18:00 → 19:00)")).toBeChecked()
  await page.getByRole('button', { name: 'Import run' }).click()

  // bundled straight into the gym session: the summary comes up with the run and the total time
  const summary = page.getByTestId('summary')
  await expect(summary).toContainText('1 sets · 1 exercises · 1 activities')
  await expect(summary).toContainText(/Running: 30 min · 1\.\d+ km · \d+:\d\d\/km · ↑24 m/)
  await expect(summary).toContainText('total 1h 30m')
  await expect(page.getByTestId('loose-bar')).toHaveCount(0)

  // the recap image renders with the route on it
  await page.getByRole('button', { name: 'Share image' }).click()
  const img = page.getByTestId('recap-preview')
  await expect(img).toBeVisible()
  expect(await img.evaluate(i => [i.naturalWidth, i.naturalHeight])).toEqual([1080, 1920])
  if (process.env.GPX_SHOT) await img.screenshot({ path: process.env.GPX_SHOT })
  await page.getByRole('button', { name: 'Close' }).last().click()

  // the same file again is refused
  await page.getByRole('button', { name: 'Close' }).last().click()
  await page.getByLabel('Import a run (GPX)…').setInputFiles({ name: 'retiro.gpx', mimeType: 'application/gpx+xml', buffer })
  await page.getByRole('button', { name: 'Import run' }).click()
  await expect(page.getByRole('alert')).toHaveText('This run is already logged.')
})

const PLAN = {
  format: 'sets/plan', version: 1, name: 'Kettlebell month', start: '2026-11-03', days: 30, goal: 'Strength',
  rules: ['Warm up 5 minutes'],
  week: {
    mon: { rest: true, name: 'Rest' },
    tue: { name: 'Legs', items: [{ exercise: 'Leg Press', sets: 3, reps: [10, 12] }] },
    wed: { name: 'Arms', items: [{ exercise: 'Dumbbell Curl', sets: 3, reps: 12 }] },
    thu: { name: 'Kettlebells', items: [{ exercise: 'Halos', sets: 3, reps: 12, kg: 12 }, { exercise: 'Cable Glute Kickback', es: 'Patada de glúteo', sets: 3, reps: 15, perSide: true }] },
    fri: { rest: true }, sat: { rest: true }, sun: { rest: true },
  },
}
const planTab = page => page.getByRole('navigation').getByRole('button', { name: 'Plan' })

test("a plan: import it, train today's day from its own tab, see done and missed days, export it to Calendar", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 5, 10, 0)) // Thursday, day 3
  await page.reload()
  await planTab(page).click()
  await expect(page.getByText(/^No plan yet/)).toBeVisible()
  await page.getByLabel('Import plan (JSON)…').setInputFiles({ name: 'plan.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(PLAN)) })
  // the start date and the name are chosen on import: today by default, so no missed days before it
  const sheet = page.getByTestId('plan-start')
  await expect(sheet.getByLabel('Plan name')).toHaveValue('Kettlebell month')
  await expect(sheet.getByLabel('Start date')).toHaveValue('2026-11-05')
  await expect(page.getByTestId('plan-span')).toHaveText('Day 1 Thu, Nov 5 · last day Fri, Dec 4 · 30 days')
  await sheet.getByRole('button', { name: 'Start plan' }).click()
  await expect(page.getByText('Plan imported: 1 new exercises')).toBeVisible()
  await expect(page.getByTestId('plan-day')).toHaveText('Day 1 of 30 · Week 1')
  await expect(page.getByTestId('plan-progress')).toHaveText('0 done · 0 in part · 0 missed')
  await expect(page.locator('[data-date="2026-11-04"]')).toHaveAttribute('data-status', 'out')

  // Edit: the plan really began on Tuesday
  await page.getByTestId('plan-head').getByRole('button', { name: 'Edit', exact: true }).click()
  await sheet.getByLabel('Start date').fill('2026-11-03')
  await sheet.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('plan-day')).toHaveText('Day 3 of 30 · Week 1')
  await expect(page.getByTestId('plan-progress')).toHaveText('0 done · 0 in part · 2 missed')
  await expect(page.locator('[data-date="2026-11-04"]')).toHaveAttribute('data-status', 'missed')
  await expect(page.locator('[data-date="2026-11-02"]')).toHaveAttribute('data-status', 'out')
  const today = page.getByTestId('plan-today')
  await expect(today).toContainText('Today · Kettlebells')
  await expect(today).toContainText(/Halos\s*3 × 12 · 12 kg/)
  await expect(today).toContainText(/Cable Glute Kickback\s*3 × 15 · per side/)

  // Calendar and the ChatGPT template are files
  const [ics] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Add to Calendar…' }).click()])
  expect(ics.suggestedFilename()).toBe('sets-plan-kettlebell-month.ics')
  const [tpl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download plan template…' }).click()])
  expect(tpl.suggestedFilename()).toBe('sets-plan-template.json')

  // Train it: the plan's tab with the plan's targets, and the nudge
  await today.getByRole('button', { name: 'Train it' }).click()
  await expect(page.getByRole('tab', { name: 'Plan · Kettlebells' })).toHaveAttribute('aria-selected', 'true')
  const nudge = page.getByTestId('plan-nudge')
  await expect(nudge).toContainText('Plan · day 3: Kettlebells')
  await expect(nudge).toContainText("Yesterday's plan day (Arms) was missed")
  await expect(page.locator('.title')).toHaveText(['Halos', 'Cable Glute Kickback'])
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('0/3')
  await expect(row(page, 'Halos')).toContainText('3 × 12 · 12 kg')
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await expect(page.getByLabel('reps')).toHaveValue('12')
  await expect(page.getByLabel('kg', { exact: true })).toHaveValue('12')
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('1/3')
  await nudge.getByRole('button', { name: 'Dismiss' }).click()
  await expect(nudge).toHaveCount(0)

  // back on Plan: today is in part, Halos ticked
  await planTab(page).click()
  await expect(page.locator('[data-date="2026-11-05"]')).toHaveAttribute('data-status', 'partial')
  await expect(page.getByTestId('plan-today')).toContainText('✓ Halos')
  await page.locator('[data-date="2026-11-03"]').click()
  await expect(page.getByTestId('plan-today')).toContainText('Legs')
  await expect(page.getByTestId('plan-today')).toContainText(/Leg Press\s*3 × 10–12/)

  // stopped, it waits under Your plans; started again on a new date and name
  page.on('dialog', d => d.accept())
  await page.getByRole('button', { name: 'Stop plan' }).click()
  await expect(page.getByText(/^No plan yet/)).toBeVisible()
  await page.getByTestId('stored-plans').getByRole('button', { name: 'Start… Kettlebell month' }).click()
  await expect(sheet.getByLabel('Start date')).toHaveValue('2026-11-05')
  await sheet.getByLabel('Plan name').fill('Kettlebell month, again')
  await sheet.getByRole('button', { name: 'Start plan' }).click()
  await expect(page.getByTestId('plan-head')).toContainText('Kettlebell month, again')
  await expect(page.getByTestId('plan-day')).toHaveText('Day 1 of 30 · Week 1')
  await expect(page.getByTestId('stored-plans')).toHaveCount(0)
})

test('an interval routine: written as text, run with the current and next step, flashing at the end, logged', async ({ page }) => {
  const t0 = new Date(2026, 10, 5, 18, 0).getTime()
  await page.clock.setFixedTime(t0)
  await page.reload()
  await page.getByRole('tab', { name: 'Cardio & more' }).click()
  await page.getByRole('button', { name: 'New interval routine…' }).click()
  await page.getByLabel('Name').fill('Core blast')
  await page.getByLabel('Steps').fill('30 seconds, climbers - 30 seconds, cross climbers - 30 seconds burpees - 30 sceonds elbow plank, 30 seconds straight arm plank, 30 shoulder touch planks')
  await expect(page.getByTestId('routine-steps').locator('li')).toHaveText(['30 s climbers', '30 s cross climbers', '30 s burpees', '30 s elbow plank', '30 s straight arm plank', '30 s shoulder touch planks'])
  await expect(page.getByTestId('routine-total')).toHaveText('6 steps · 3:00 in all')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Run: Core blast' })).toBeVisible()

  await page.getByRole('button', { name: 'Run: Core blast' }).click()
  await expect(page.getByTestId('interval-time')).toHaveText('3:00')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByTestId('interval-name')).toHaveText('Get ready')
  await expect(page.getByTestId('interval-next')).toHaveText('Next: climbers · 30\u00a0s')
  await page.clock.setFixedTime(t0 + 5_500)
  await expect(page.getByTestId('interval-name')).toHaveText('climbers')
  await expect(page.getByTestId('interval-time')).toHaveText('30')
  await expect(page.getByTestId('interval-next')).toHaveText('Next: cross climbers · 30\u00a0s')
  await expect(page.locator('.runner')).not.toHaveClass(/flash/)
  await page.clock.setFixedTime(t0 + 5_000 + 26_000)
  await expect(page.getByTestId('interval-time')).toHaveText('4')
  await expect(page.locator('.runner')).toHaveClass(/flash/) // the last 5 seconds
  await page.clock.setFixedTime(t0 + 5_000 + 181_000)
  await expect(page.getByTestId('interval-total')).toHaveText('3:00')
  await page.getByRole('button', { name: 'Log it' }).click()
  await expect(page.getByRole('button', { name: 'Log activity: Intervals' })).toBeVisible()
  await expect(page.getByRole('button', { name: '3 min', exact: true })).toBeVisible()
})

test('"How did it go?" after stopping a session: kept as a note of the session, or skipped', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByLabel('Ask "How did it go?" after a session').check()
  await page.getByRole('button', { name: 'Train' }).click()
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('button', { name: 'Stop session' }).click()
  const ask = page.getByRole('dialog', { name: 'How did it go?' })
  await expect(ask).toBeVisible()
  await ask.getByRole('textbox').fill('Strong today, grip gave out on the last set')
  await ask.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('summary')).toContainText('1 sets · 1 exercises')
  await page.getByRole('button', { name: 'Close' }).last().click()
  await page.getByRole('button', { name: 'Notes' }).click()
  await expect(page.getByText('Strong today, grip gave out on the last set')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).last().click()

  // the next one skipped straight to the summary and the image
  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('button', { name: 'Stop session' }).click()
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.getByRole('button', { name: 'Share image' }).click()
  await expect(page.getByTestId('recap-preview')).toBeVisible()
})
