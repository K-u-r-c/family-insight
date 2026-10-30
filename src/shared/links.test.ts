import { describe, expect, it } from 'vitest'
import { guideUrl } from './links'

describe('guideUrl', () => {
  it('points to the user guide in the UI language', () => {
    expect(guideUrl('en')).toBe('https://k-u-r-c.github.io/family-insight/guide/')
    expect(guideUrl('pl')).toBe('https://k-u-r-c.github.io/family-insight/pl/guide/')
    expect(guideUrl('pl', 'csv-import')).toBe(
      'https://k-u-r-c.github.io/family-insight/pl/guide/csv-import'
    )
    expect(guideUrl('de', 'csv-import')).toBe(
      'https://k-u-r-c.github.io/family-insight/guide/csv-import'
    )
  })
})
