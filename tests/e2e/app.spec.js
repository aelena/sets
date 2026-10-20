import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('exercise-tracker:settings', JSON.stringify({ lang: 'en', lastBackup: Date.now() })))
  await page.goto('/')
})

const row = (page, name) => page.locator('li', { has: page.getByRole('button', { name: `Log set: ${name}`, exact: true }) })

test('seeded groups show in order and switch', async ({ page }) => {
  await expect(page.getByRole('tab', { name: 'Kettlebell Supergroup' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.title').first()).toHaveText('Chest Thrusts')
  await expect(page.locator('.title')).toHaveCount(12)
  await page.getByRole('tab', { name: 'My Warm up Routine' }).click()
  await expect(page.locator('.title')).toHaveText(['Arm superseries', 'Disc routine'])
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
  await page.getByRole('button', { name: 'Up', exact: true }).last().click()
  await expect(page.locator('.items li').nth(1)).toContainText('Plank')
  await page.getByRole('button', { name: 'Train' }).click()
  await page.getByRole('tab', { name: 'My Warm up Routine' }).click()
  await expect(page.locator('.title')).toHaveText(['Arm superseries', 'Plank', 'Disc routine'])
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
  await page.getByRole('button', { name: /^Fondos/ }).click() // names follow the UI language too
  await expect(page.getByText(/^Torso erguido para tríceps/)).toBeVisible()
  await expect(page.getByText(/^Upright torso/)).toHaveCount(0)
})

test('Today toggle lists what was done today across groups', async ({ page }) => {
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await page.getByRole('tab', { name: 'Biceps' }).click()
  await page.getByRole('button', { name: 'Log set: Barbell Curl', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(row(page, 'Barbell Curl').getByTestId('count')).toHaveText('1/3')

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
  await page.getByRole('button', { name: 'Rest', exact: true }).click()
  await page.waitForTimeout(300)
  expect((await wake()).requests).toBe(2) // "Never" holds even through a rest
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
  await expect(page.locator('.title').last()).toHaveText('Glute Bridge')
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
  await expect(page.getByTestId('summary')).toContainText('18:00 → 19:00 · 1h 00m')
  await page.getByRole('button', { name: 'Close' }).last().click()
  await expect(page.getByTestId('loose-bar')).toHaveCount(0)
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
