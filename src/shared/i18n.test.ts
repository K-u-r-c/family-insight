import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import pl from './locales/pl.json'
import { resolveLanguage } from './i18n'

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  )
}

describe('translations', () => {
  it('English and Polish define exactly the same keys', () => {
    expect(keys(pl).sort()).toEqual(keys(en).sort())
  })

  it('has no empty strings', () => {
    for (const [lang, dict] of Object.entries({ en, pl })) {
      for (const key of keys(dict)) {
        const value = key
          .split('.')
          .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], dict)
        expect(value, `${lang}:${key}`).not.toBe('')
      }
    }
  })
})

describe('resolveLanguage', () => {
  it('maps system locales to supported languages', () => {
    expect(resolveLanguage('pl-PL')).toBe('pl')
    expect(resolveLanguage('en_GB')).toBe('en')
    expect(resolveLanguage('de-DE')).toBe('en')
    expect(resolveLanguage(undefined)).toBe('en')
  })
})
