import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TILE_URL,
  defaultSettings,
  pushRecentFile,
  removeRecentFile,
  sanitizeSettings
} from './settings'

const isLang = (v: unknown): boolean => v === 'en' || v === 'pl'

describe('settings', () => {
  it('derives defaults from the language', () => {
    expect(defaultSettings('pl')).toMatchObject({
      language: 'pl',
      csvDelimiter: ';',
      theme: 'system'
    })
    expect(defaultSettings('en').csvDelimiter).toBe(',')
  })

  it('accepts the known styles only', () => {
    const d = defaultSettings('en')
    expect(d.style).toBe('modern')
    expect(sanitizeSettings({ style: 'tapestry' }, d, isLang).style).toBe('tapestry')
    expect(sanitizeSettings({ style: 'gothic' }, d, isLang).style).toBe('modern')
    expect(sanitizeSettings({ style: 7 }, d, isLang).style).toBe('modern')
  })

  it('returns defaults for garbage input', () => {
    const d = defaultSettings('en')
    expect(sanitizeSettings('nope', d, isLang)).toEqual(d)
    expect(sanitizeSettings(null, d, isLang)).toEqual(d)
    expect(sanitizeSettings([1, 2], d, isLang)).toEqual(d)
  })

  it('keeps valid values and drops invalid or unknown ones', () => {
    const d = defaultSettings('en')
    const s = sanitizeSettings(
      {
        language: 'pl',
        theme: 'neon',
        csvDelimiter: ';',
        autosave: 'yes',
        evil: true,
        recentFiles: [{ path: '/a.finsight', name: 'A', openedAt: 'x' }, { path: 3 }, 'bad'],
        windowBounds: { width: 100, height: 99999, maximized: true, x: 'a', y: 10 },
        panels: { sidebarOpen: false, sidebarWidth: 5000, detailsWidth: 'wide' }
      },
      d,
      isLang
    )
    expect(s).toEqual({
      ...d,
      language: 'pl',
      csvDelimiter: ';',
      recentFiles: [{ path: '/a.finsight', name: 'A', openedAt: 'x' }],
      windowBounds: { width: 400, height: 20000, maximized: true, y: 10 },
      panels: { sidebarOpen: false, sidebarWidth: 600, detailsWidth: 380 }
    })
    expect(s).not.toHaveProperty('evil')
  })

  it('keeps online place lookup off unless explicitly allowed', () => {
    const base = defaultSettings('en')
    expect(base.onlinePlaceLookup).toBe(false)
    expect(sanitizeSettings({ onlinePlaceLookup: 'yes' }, base, () => true).onlinePlaceLookup).toBe(
      false
    )
    expect(sanitizeSettings({ onlinePlaceLookup: true }, base, () => true).onlinePlaceLookup).toBe(
      true
    )
  })

  it('accepts only valid tile server templates', () => {
    const base = defaultSettings('en')
    expect(base).toMatchObject({ onlineMaps: false, mapTileUrl: DEFAULT_TILE_URL })
    const url = 'https://tiles.example.org/{z}/{x}/{y}.png'
    expect(sanitizeSettings({ mapTileUrl: url }, base, () => true).mapTileUrl).toBe(url)
    expect(
      sanitizeSettings({ mapTileUrl: 'javascript:{z}{x}{y}' }, base, () => true).mapTileUrl
    ).toBe(DEFAULT_TILE_URL)
  })

  it('sanitises the update settings', () => {
    const base = defaultSettings('en')
    expect(base.updates).toEqual({ checkAutomatically: true })
    const ok = sanitizeSettings(
      {
        updates: {
          checkAutomatically: false,
          lastCheck: '2026-10-30T10:00:00Z',
          skippedVersion: '1.2.0'
        }
      },
      base,
      () => true
    )
    expect(ok.updates).toEqual({
      checkAutomatically: false,
      lastCheck: '2026-10-30T10:00:00Z',
      skippedVersion: '1.2.0'
    })
    const bad = sanitizeSettings(
      { updates: { checkAutomatically: 'no', lastCheck: 'yesterday', skippedVersion: 'latest' } },
      ok,
      () => true
    )
    expect(bad.updates).toEqual(ok.updates)
    expect(sanitizeSettings({ updates: { skippedVersion: null } }, ok, () => true).updates).toEqual(
      {
        checkAutomatically: false,
        lastCheck: '2026-10-30T10:00:00Z'
      }
    )
  })

  it('merges patches onto current settings', () => {
    const current = sanitizeSettings(
      { theme: 'dark', autosave: false },
      defaultSettings('en'),
      isLang
    )
    const next = sanitizeSettings({ ...current, language: 'pl' }, current, isLang)
    expect(next).toMatchObject({ theme: 'dark', autosave: false, language: 'pl' })
  })

  it('maintains the recent files list', () => {
    const f = (path: string): { path: string; name: string; openedAt: string } => ({
      path,
      name: path,
      openedAt: ''
    })
    let list = [f('a'), f('b'), f('c')]
    list = pushRecentFile(list, f('b'))
    expect(list.map((x) => x.path)).toEqual(['b', 'a', 'c'])
    expect(pushRecentFile(list, f('z'), 3).map((x) => x.path)).toEqual(['z', 'b', 'a'])
    expect(removeRecentFile(list, 'a').map((x) => x.path)).toEqual(['b', 'c'])
  })
})
