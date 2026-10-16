import { describe, it, expect, beforeEach } from 'vitest'
import { authUrl, parseRedirect, handleRedirect, session, upload, SCOPE } from '../../src/lib/drive.js'

const store = new Map()
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) }
beforeEach(() => store.clear())

describe('drive auth', () => {
  it('builds the token-flow URL for drive.file', () => {
    const u = new URL(authUrl({ clientId: 'abc.apps.googleusercontent.com', redirect: 'https://aelena.com/sets/', state: 's1' }))
    expect(u.origin + u.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(Object.fromEntries(u.searchParams)).toMatchObject({
      client_id: 'abc.apps.googleusercontent.com', redirect_uri: 'https://aelena.com/sets/', response_type: 'token', scope: SCOPE, state: 's1',
    })
  })

  it('reads the redirect, keeps the token, rejects a foreign state', () => {
    expect(parseRedirect('#access_token=t1&expires_in=3599&state=s1')).toEqual({ token: 't1', expiresIn: 3599, state: 's1' })
    expect(parseRedirect('#error=access_denied&state=s1')).toEqual({ error: 'access_denied', state: 's1' })
    expect(parseRedirect('')).toBeNull()

    const loc = { hash: '#access_token=t1&expires_in=3600&state=s1', pathname: '/sets/', search: '' }
    const hist = { replaceState: (a, b, url) => (hist.url = url) }
    store.set('sets:drive:pending', JSON.stringify({ state: 's1', action: { type: 'session', id: 'x' } }))
    expect(handleRedirect(loc, hist, 1000)).toEqual({ action: { type: 'session', id: 'x' } })
    expect(hist.url).toBe('/sets/')
    expect(session(1000).token).toBe('t1')

    store.set('sets:drive:pending', JSON.stringify({ state: 'other' }))
    expect(handleRedirect({ ...loc, hash: '#access_token=t2&state=s1' }, hist, 1000)).toEqual({ error: 'state_mismatch' })
  })
})

describe('drive upload', () => {
  it('creates the Sets folder once, then uploads into it', async () => {
    store.set('sets:drive', JSON.stringify({ token: 'tok', expires: Date.now() + 3600_000 }))
    const calls = []
    const fake = async (url, init = {}) => {
      calls.push({ url, method: init.method ?? 'GET', auth: init.headers?.Authorization, body: init.body })
      const json = url.includes('/drive/v3/files?q=') ? { files: [] } : url.includes('/drive/v3/files?fields=id') ? { id: 'folder1' } : { id: 'file1', name: 'a.json' }
      return { ok: true, status: 200, json: async () => json, text: async () => '' }
    }
    expect(await upload(new Blob(['{}'], { type: 'application/json' }), 'a.json', fake)).toEqual({ id: 'file1', name: 'a.json' })
    await upload(new Blob(['{}']), 'b.json', fake)
    expect(calls.map(c => `${c.method} ${new URL(c.url).pathname}`)).toEqual([
      'GET /drive/v3/files', 'POST /drive/v3/files', 'POST /upload/drive/v3/files', 'POST /upload/drive/v3/files',
    ])
    expect(calls.every(c => c.auth === 'Bearer tok')).toBe(true)
    expect(JSON.parse(await calls[2].body.get('metadata').text())).toEqual({ name: 'a.json', parents: ['folder1'] })
  })

  it('refuses without a token', async () => {
    await expect(upload(new Blob(['x']), 'x', async () => ({}))).rejects.toThrow('not_connected')
  })
})
