/**
 * Writes plans/plan-template.json: the blank plan the app's "Download plan template" gives, filled
 * with the built-in library (a fresh install's exercises) instead of one phone's. Run after a
 * library release: `npm run plan-template`. A unit test fails when the committed file is stale.
 */
import 'fake-indexeddb/auto'
import { writeFileSync } from 'node:fs'
import { createDb } from '../src/lib/db.js'
import { createRepo } from '../src/lib/repo.js'
import { planTemplate } from '../src/lib/plan.js'

export async function builtInTemplate() {
  const repo = createRepo(createDb(`plan-template-${Date.now()}`))
  await repo.seedIfEmpty()
  await repo.applyPacks()
  return planTemplate((await repo.library()).exercises)
}

if (process.argv[1]?.endsWith('plan-template.mjs')) {
  const tpl = await builtInTemplate()
  writeFileSync('plans/plan-template.json', JSON.stringify(tpl, null, 2) + '\n')
  console.log(`plans/plan-template.json: ${tpl.library.length} exercises`)
}
