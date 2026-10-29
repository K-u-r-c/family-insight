import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import pl from './locales/pl.json'
import { resolveLanguage } from './i18n'
import { MODEL_ERROR_CODES } from '../core/model/errors'

type Dict = Record<string, unknown>

function keys(obj: Dict, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v as Dict, `${prefix}${k}.`) : [`${prefix}${k}`]
  )
}

const PLURAL = /_(zero|one|two|few|many|other)$/
const REQUIRED_PLURALS: Record<string, string[]> = {
  en: ['one', 'other'],
  pl: ['one', 'few', 'many', 'other']
}
const base = (key: string): string => key.replace(PLURAL, '')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'locales' ? [] : sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

describe('translations', () => {
  const enKeys = keys(en)
  const plKeys = keys(pl)

  it('English and Polish define the same message keys', () => {
    expect([...new Set(plKeys.map(base))].sort()).toEqual([...new Set(enKeys.map(base))].sort())
    expect(plKeys.filter((k) => !PLURAL.test(k)).sort()).toEqual(
      enKeys.filter((k) => !PLURAL.test(k)).sort()
    )
  })

  it('plural keys have every form the language needs', () => {
    for (const [lang, list] of [
      ['en', enKeys],
      ['pl', plKeys]
    ] as const) {
      const bases = new Set(list.filter((k) => PLURAL.test(k)).map(base))
      for (const b of bases) {
        for (const form of REQUIRED_PLURALS[lang]!) {
          expect(list, `${lang}: ${b}_${form}`).toContain(`${b}_${form}`)
        }
      }
    }
  })

  it('has no empty strings', () => {
    for (const [lang, dict] of Object.entries({ en, pl })) {
      for (const key of keys(dict)) {
        const value = key.split('.').reduce<unknown>((o, k) => (o as Dict)[k], dict)
        expect(value, `${lang}:${key}`).not.toBe('')
      }
    }
  })

  describe('usage in source code', () => {
    const files = sourceFiles(join(__dirname, '..'))
    const code = files.map((f) => readFileSync(f, 'utf8')).join('\n')
    const literals = new Set(
      [...code.matchAll(/['"`]([a-zA-Z][\w-]*(?:\.[\w-]+)+)['"`]/g)].map((m) => m[1]!)
    )
    const prefixes = [...code.matchAll(/`([a-zA-Z][\w-]*(?:\.[\w-]+)*\.)\$\{/g)].map((m) => m[1]!)
    const known = new Set(enKeys.map(base))

    it('every t("…") key exists', () => {
      const calls = [...code.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!)
      const missing = calls.filter((k) => !known.has(k))
      expect(missing).toEqual([])
    })

    it('every key is used somewhere', () => {
      const unused = [...known].filter(
        (k) => !literals.has(k) && !prefixes.some((p) => k.startsWith(p))
      )
      expect(unused).toEqual([])
    })
  })
})

describe('error messages', () => {
  it('every model error code has an EN and PL message', () => {
    for (const code of MODEL_ERROR_CODES) {
      expect((en.errors.model as Record<string, string>)[code], `en ${code}`).toBeTruthy()
      expect((pl.errors.model as Record<string, string>)[code], `pl ${code}`).toBeTruthy()
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
