import { get } from 'svelte/store'
import { repo, notify } from './store.js'
import { settings } from './settings.js'
import { t } from './i18n.js'
import { deliver, jsonBlob } from './export.js'
import { dateKey } from './time.js'
import * as drive from './drive.js'

const pad = n => String(n).padStart(2, '0')

/** sets-session-2026-10-16-1805.json */
export async function sessionFile(id) {
  const data = await repo.sessionExport(id)
  const d = new Date(data.session.start)
  return { blob: jsonBlob(data), name: `sets-session-${dateKey(d)}-${pad(d.getHours())}${pad(d.getMinutes())}.json` }
}

/** Share sheet: Files, the Google Drive app, AirDrop... works with no setup. */
export async function shareSession(id) {
  const { blob, name } = await sessionFile(id)
  await deliver(blob, name)
}

export const driveReady = () => !!get(settings).driveClientId

/**
 * Upload straight to the Sets folder in Google Drive. Without a valid token this leaves for
 * Google's sign-in and finishes the upload when the app comes back (see resumeDrive).
 */
export async function uploadSession(id, { quiet = false } = {}) {
  const tr = get(t)
  const clientId = get(settings).driveClientId
  if (!clientId) return notify(tr('driveNotConfigured'))
  if (!drive.connected()) {
    if (quiet) return notify(tr('driveFailed', { error: tr('driveConnect') }), { label: tr('uploadDrive'), run: () => uploadSession(id) }, 8000)
    notify(tr('driveWaiting'))
    return drive.connect(clientId, { type: 'session', id })
  }
  try {
    const { blob, name } = await sessionFile(id)
    await drive.upload(blob, name)
    notify(tr('driveUploaded', { name }))
  } catch (e) {
    if (e.message === 'not_connected' && !quiet) return drive.connect(clientId, { type: 'session', id })
    notify(tr('driveFailed', { error: e.message }), { label: tr('uploadDrive'), run: () => uploadSession(id) }, 8000)
  }
}

/** On start: finish whatever was waiting for Google's sign-in. */
export async function resumeDrive() {
  const r = drive.handleRedirect()
  if (!r) return
  if (r.error) return notify(get(t)('driveFailed', { error: r.error }), null, 8000)
  if (r.action?.type === 'session') await uploadSession(r.action.id)
}
