import { get } from 'svelte/store'
import { repo } from './store.js'
import { settings, portable } from './settings.js'
import { deliver, jsonBlob } from './export.js'
import { dateKey } from './time.js'

/** Full backup through the share sheet; the date is only recorded when the file actually left the app. */
export async function backupNow() {
  const file = await repo.backup(portable(get(settings)))
  if (await deliver(jsonBlob(file), `set-tracker-backup-${dateKey()}.json`)) settings.update(s => ({ ...s, lastBackup: Date.now() }))
}

/** Whole days since the last backup, or null when there never was one. */
export const daysSince = (ts, now = Date.now()) => (ts ? Math.floor((now - ts) / 864e5) : null)
