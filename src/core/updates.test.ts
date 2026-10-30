import { describe, expect, it } from 'vitest'
import { compareVersions, isCheckDue, isValidVersion, shouldOffer, updateSupport } from './updates'

describe('updates', () => {
  it('knows which builds can update themselves', () => {
    expect(updateSupport('nsis')).toBe('auto')
    expect(updateSupport('appimage')).toBe('auto')
    expect(updateSupport('portable')).toBe('notify')
    expect(updateSupport('deb')).toBe('notify')
    expect(updateSupport('mac')).toBe('notify')
    expect(updateSupport('dev')).toBe('none')
  })

  it('compares semantic versions', () => {
    expect(compareVersions('1.1.0', '1.0.1')).toBeGreaterThan(0)
    expect(compareVersions('v1.10.0', '1.9.9')).toBeGreaterThan(0)
    expect(compareVersions('1.1.0', '1.1.0')).toBe(0)
    expect(compareVersions('1.1.0-beta.2', '1.1.0')).toBeLessThan(0)
    expect(compareVersions('1.1.0-beta.10', '1.1.0-beta.2')).toBeGreaterThan(0)
    expect(compareVersions('1.1.0-alpha', '1.1.0-beta')).toBeLessThan(0)
    expect(compareVersions('2.0.0', '10.0.0')).toBeLessThan(0)
    expect(isValidVersion('1.2.3')).toBe(true)
    expect(isValidVersion('1.2')).toBe(false)
  })

  it('checks once a day', () => {
    const now = new Date('2026-10-30T12:00:00Z')
    expect(isCheckDue(undefined, now)).toBe(true)
    expect(isCheckDue('2026-10-30T01:00:00Z', now)).toBe(false)
    expect(isCheckDue('2026-10-29T11:00:00Z', now)).toBe(true)
    expect(isCheckDue('not a date', now)).toBe(true)
    expect(isCheckDue('2027-01-01T00:00:00Z', now)).toBe(true) // clock changed
  })

  it('offers newer versions unless skipped (manual checks always)', () => {
    expect(shouldOffer('1.0.1', '1.1.0', undefined)).toBe(true)
    expect(shouldOffer('1.1.0', '1.1.0', undefined)).toBe(false)
    expect(shouldOffer('1.2.0', '1.1.0', undefined)).toBe(false)
    expect(shouldOffer('1.0.1', '1.1.0', '1.1.0')).toBe(false)
    expect(shouldOffer('1.0.1', '1.1.0', '1.1.0', true)).toBe(true)
    expect(shouldOffer('1.0.1', '1.2.0', '1.1.0')).toBe(true)
  })
})
