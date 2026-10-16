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
