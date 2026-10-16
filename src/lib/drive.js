/**
 * Google Drive upload with no backend: OAuth 2.0 token flow for client-side apps, as a full-page
 * redirect (popups are unreliable in iOS home-screen apps). Scope drive.file: the app only ever
 * sees files it created itself, kept in one "Sets" folder.
 */
export const SCOPE = 'https://www.googleapis.com/auth/drive.file'
export const FOLDER = 'Sets'
const KEY = 'sets:drive' // { token, expires, folderId }
const PENDING = 'sets:drive:pending' // { state, action } while Google's sign-in page is open

const read = (k, fallback = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback } }
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)) } catch {} }

/** The page Google sends the user back to: this app's own URL, which must be listed in the OAuth client. */
export const redirectUri = (loc = location) => `${loc.origin}${loc.pathname}`

export function authUrl({ clientId, redirect, state }) {
  const q = new URLSearchParams({ client_id: clientId, redirect_uri: redirect, response_type: 'token', scope: SCOPE, state, include_granted_scopes: 'true' })
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

/** "#access_token=…&expires_in=3599&state=…" → { token, expiresIn, state }, or an error, or null. */
export function parseRedirect(hash) {
  const p = new URLSearchParams(String(hash ?? '').replace(/^#/, ''))
  if (p.get('error')) return { error: p.get('error'), state: p.get('state') }
  if (!p.get('access_token')) return null
  return { token: p.get('access_token'), expiresIn: +p.get('expires_in') || 3600, state: p.get('state') }
}

export const session = (now = Date.now()) => {
  const s = read(KEY, {})
  return s.token && s.expires > now + 60_000 ? s : null
}
export const connected = () => !!session()
export const disconnect = () => write(KEY, null)

/** Leave for Google's sign-in; `action` is resumed when the user comes back. */
export function connect(clientId, action = null) {
  const state = Math.random().toString(36).slice(2)
  write(PENDING, { state, action })
  location.assign(authUrl({ clientId, redirect: redirectUri(), state }))
}

/** On start: if Google just sent us back, keep the token, clean the URL, return the pending action. */
export function handleRedirect(loc = location, hist = history, now = Date.now()) {
  const r = parseRedirect(loc.hash)
  if (!r) return null
  const pending = read(PENDING)
  write(PENDING, null)
  hist.replaceState(null, '', loc.pathname + loc.search)
  if (!pending || pending.state !== r.state) return { error: 'state_mismatch' }
  if (r.error) return { error: r.error }
  write(KEY, { ...read(KEY, {}), token: r.token, expires: now + r.expiresIn * 1000 })
  return { action: pending.action }
}

async function api(path, init = {}, f = fetch) {
  const s = session()
  if (!s) throw new Error('not_connected')
  const res = await f(`https://www.googleapis.com${path}`, { ...init, headers: { Authorization: `Bearer ${s.token}`, ...init.headers } })
  if (res.status === 401) { disconnect(); throw new Error('not_connected') }
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`.trim())
  return res.json()
}

async function folderId(f) {
  const cached = read(KEY, {}).folderId
  if (cached) return cached
  const q = encodeURIComponent(`name='${FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)
  const found = await api(`/drive/v3/files?q=${q}&fields=files(id)&spaces=drive`, {}, f)
  const id = found.files?.[0]?.id ?? (await api('/drive/v3/files?fields=id', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER, mimeType: 'application/vnd.google-apps.folder' }),
  }, f)).id
  write(KEY, { ...read(KEY, {}), folderId: id })
  return id
}

/** Upload one file into the Sets folder. Returns { id, name }. */
export async function upload(blob, name, f = fetch, retried = false) {
  const parent = await folderId(f)
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify({ name, parents: [parent] })], { type: 'application/json' }))
  form.append('file', blob, name)
  try {
    return await api('/upload/drive/v3/files?uploadType=multipart&fields=id,name', { method: 'POST', body: form }, f)
  } catch (e) {
    if (!retried && /^404/.test(e.message)) { write(KEY, { ...read(KEY, {}), folderId: null }); return upload(blob, name, f, true) } // folder was deleted
    throw e
  }
}
