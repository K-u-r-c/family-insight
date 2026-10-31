import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from './i18n'
import { guideUrl } from './links'

const DOCS = join(__dirname, '..', '..', 'docs')

describe('guideUrl', () => {
  it('points to the user guide in the UI language', () => {
    expect(guideUrl('en')).toBe('https://k-u-r-c.github.io/family-insight/guide/')
    expect(guideUrl('pl')).toBe('https://k-u-r-c.github.io/family-insight/pl/guide/')
    expect(guideUrl('pl', 'csv-import')).toBe(
      'https://k-u-r-c.github.io/family-insight/pl/guide/csv-import'
    )
    expect(guideUrl('de', 'csv-import')).toBe(
      'https://k-u-r-c.github.io/family-insight/de/guide/csv-import'
    )
    expect(guideUrl('xx')).toBe('https://k-u-r-c.github.io/family-insight/guide/')
  })

  it('has a translated guide with every English page for every app language', () => {
    const pages = readdirSync(join(DOCS, 'guide')).sort()
    for (const language of SUPPORTED_LANGUAGES.filter((l) => l !== 'en')) {
      const dir = join(DOCS, language, 'guide')
      expect(existsSync(dir), language).toBe(true)
      expect(readdirSync(dir).sort(), language).toEqual(pages)
      expect(guideUrl(language)).toContain(`/${language}/guide/`)
    }
  })
})
