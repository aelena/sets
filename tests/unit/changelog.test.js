import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { CHANGELOG, compareVersions, newSince } from '../../src/lib/changelog.js'

describe('changelog', () => {
  it('compares versions numerically', () => {
    expect([compareVersions('0.10.0', '0.9.0'), compareVersions('0.10.1', '0.10.1'), compareVersions('0.9.9', '0.10.0')]).toEqual([1, 0, -1])
  })

  it('lists what is new since the last seen version, newest first, at most three', () => {
    expect(newSince('0.10.1', '0.12.0').map(e => e.version)).toEqual(['0.12.0', '0.11.0'])
    expect(newSince('0.12.0', '0.12.0')).toEqual([])
    expect(newSince(null, '0.12.0').map(e => e.version)).toEqual(['0.12.0', '0.11.0', '0.10.1'])
  })

  it('has an entry for the version being released, in both languages', () => {
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
    const entry = CHANGELOG.find(e => e.version === version)
    expect(entry, `CHANGELOG needs an entry for ${version}`).toBeTruthy()
    expect(entry.en.length).toBeGreaterThan(0)
    expect(entry.es.length).toBe(entry.en.length)
    expect(CHANGELOG[0].version).toBe(version) // newest first
  })
})
