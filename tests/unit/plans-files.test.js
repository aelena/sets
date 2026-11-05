import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { createDb } from '../../src/lib/db.js'
import { createRepo } from '../../src/lib/repo.js'
import { normalizePlan } from '../../src/lib/plan.js'
import { builtInTemplate } from '../../scripts/plan-template.mjs'

const read = p => JSON.parse(readFileSync(p, 'utf8'))
let n = 0
const fresh = async (now = new Date(2026, 10, 5, 10).getTime()) => {
  const repo = createRepo(createDb(`plans-${n++}`), () => now)
  await repo.seedIfEmpty()
  await repo.applyPacks()
  return repo
}

describe('plan files in the repository', () => {
  it('plans/plan-template.json is the built-in library\'s template (npm run plan-template when it fails)', async () => {
    expect(read('plans/plan-template.json')).toEqual(await builtInTemplate())
  })

  it('every example reads as a plan against a fresh install, without a start date', async () => {
    const { exercises } = await (await fresh()).library()
    const files = readdirSync('plans/examples').filter(f => f.endsWith('.json'))
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      const json = read(`plans/examples/${f}`)
      expect(json.start, f).toBe('')
      const { plan, created } = normalizePlan(json, exercises, '2026-11-05')
      expect(plan.days, f).toBeGreaterThan(0)
      expect(created.length, `${f} creates ${created.map(e => e.name)}`).toBeLessThanOrEqual(3)
    }
  })
})

describe('reusing plans', () => {
  const file = read('plans/examples/muscle-30-days-5x.json')

  it('imports on the chosen date under the chosen name: no missed days before it', async () => {
    const repo = await fresh()
    const { plan } = await repo.importPlan(file, { start: '2026-11-05', name: 'November block' })
    expect(plan).toMatchObject({ id: 'november-block', name: 'November block', start: '2026-11-05', active: true })
    expect(plan.names).toBeUndefined() // the file's Spanish name would hide the new one
    const kept = await repo.importPlan(file) // no choices: today, the file's name
    expect(kept.plan).toMatchObject({ id: 'muscle-30-days-5x', start: '2026-11-05', names: { es: 'Masa muscular en 30 días, 5 días a la semana' } })
    expect((await repo.db.plans.toArray()).filter(p => p.active).map(p => p.id)).toEqual(['muscle-30-days-5x'])
  })

  it('edits, stops and starts a plan again on a new date', async () => {
    const repo = await fresh()
    await repo.importPlan(file, { start: '2026-11-03' })
    await repo.updatePlan('muscle-30-days-5x', { start: '2026-11-05', name: 'Reto' })
    expect(await repo.activePlan()).toMatchObject({ start: '2026-11-05', name: 'Reto', id: 'muscle-30-days-5x' })
    expect((await repo.activePlan()).names).toBeUndefined()

    await repo.stopPlan('muscle-30-days-5x')
    expect(await repo.activePlan()).toBeNull()
    expect(await repo.db.plans.count()).toBe(1) // kept, to start again

    await repo.importPlan(file, { start: '2026-12-01', name: 'Other' })
    await repo.startPlan('muscle-30-days-5x', { start: '2027-01-04' })
    expect(await repo.activePlan()).toMatchObject({ id: 'muscle-30-days-5x', start: '2027-01-04', name: 'Reto' })
    expect((await repo.db.plans.get('other')).active).toBe(false)
  })
})
