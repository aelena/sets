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
  await expect(page.getByText('Superserie con disco')).toBeVisible()
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
  await page.getByLabel('Name').fill('Plank')
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

test('Spanish UI keeps exercise names untranslated', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Español' }).click()
  await page.getByRole('button', { name: 'Entrenar' }).click()
  await expect(page.getByRole('button', { name: 'Empezar sesión' })).toBeVisible()
  await expect(page.locator('.title').first()).toHaveText('Chest Thrusts')
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
  await expect(halos.getByTitle('Personal best')).toHaveCount(0) // fewer than 12 sessions: no flames yet

  await page.evaluate(async () => {
    const db = await new Promise(ok => { const r = indexedDB.open('exercise-tracker'); r.onsuccess = () => ok(r.result) })
    const tx = db.transaction('sessions', 'readwrite')
    for (let i = 1; i <= 12; i++) tx.objectStore('sessions').put({ id: `old-${i}`, start: Date.UTC(2026, 8, i, 17), end: Date.UTC(2026, 8, i, 18), summary: '' })
    await new Promise(ok => (tx.oncomplete = ok))
    db.close()
  })
  await page.reload()
  await expect(halos.getByTitle('Personal best')).toBeVisible()
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
  await expect.poll(() => img.evaluate(i => i.naturalHeight)).toBe(1350)
  await page.getByRole('radio', { name: 'ember' }).click()
  const [shot] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Share', exact: true }).click()])
  expect(shot.suggestedFilename()).toMatch(/^sets-recap-\d{4}-\d\d-\d\d\.jpg$/)
})

test('log running from duration and pace, an other activity, both in the summary', async ({ page }) => {
  await page.getByRole('button', { name: 'Start session' }).click()
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
  await page.getByRole('button', { name: /^Dips/ }).click()
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

  await page.getByRole('button', { name: 'Only what I did today' }).click()
  await expect(page.getByTestId('today-bar')).toBeVisible()
  await expect(page.getByRole('tab')).toHaveCount(0)
  await expect(page.locator('.title')).toHaveText(['Halos', 'Barbell Curl'])
  await page.getByRole('button', { name: 'Log set: Halos', exact: true }).click()
  await page.getByRole('button', { name: 'Log set', exact: true }).click()
  await expect(row(page, 'Halos').getByTestId('count')).toHaveText('2/5')

  await page.getByRole('button', { name: 'Only what I did today' }).click()
  await expect(page.getByRole('tab', { name: 'Biceps' })).toBeVisible()
})
