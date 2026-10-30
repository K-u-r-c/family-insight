import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { MODEL_ERROR_CODES } from '../core/model/errors'
import {
  csvDelimiterFor,
  enablePseudoLocale,
  i18nResources,
  isLanguage,
  languageOptions,
  LOCALES,
  resolveLanguage,
  SUPPORTED_LANGUAGES
} from './i18n'
import { pseudoLocalize, pseudoString } from './pseudo'

type Dict = Record<string, unknown>

/** Every message key with its text, `a.b.c` style. */
function entries(obj: Dict, prefix = ''): [string, string][] {
  return Object.entries(obj).flatMap(([k, v]): [string, string][] =>
    typeof v === 'object' && v !== null
      ? entries(v as Dict, `${prefix}${k}.`)
      : [[`${prefix}${k}`, String(v)]]
  )
}

const PLURAL = /_(zero|one|two|few|many|other)$/
const base = (key: string): string => key.replace(PLURAL, '')
const placeholders = (text: string): string[] =>
  [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]!).sort()

/** Plural forms a language needs, from the platform's own rules (pl/ru: one, few, many, other). */
const pluralForms = (lang: string): string[] =>
  new Intl.PluralRules(lang).resolvedOptions().pluralCategories.filter((c) => c !== 'zero')

/**
 * Texts that may stay the same as in English: format names everywhere (`key`), or words that
 * happen to be the same in one language (`lang:key`).
 */
const SAME_AS_ENGLISH = new Set([
  'pl:history.importCsv',
  'pl:relations.add.partner',
  'pl:export.format',
  'pl:gedcom.importTitle',
  'gedcom.version551',
  'gedcom.version70',
  'export.png',
  'export.svg',
  'export.pdf',
  'csv.delimiterName.tab'
])

const en = LOCALES.en.translation as Dict
const enEntries = new Map(entries(en))
const enBases = new Set([...enEntries.keys()].map(base))

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'locales' ? [] : sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

describe.each(SUPPORTED_LANGUAGES.map((lang) => [lang]))('translations: %s', (lang) => {
  const dict = LOCALES[lang].translation as Dict
  const list = new Map(entries(dict))
  const keys = [...list.keys()]

  it('defines the same messages as English', () => {
    expect([...new Set(keys.map(base))].sort()).toEqual([...enBases].sort())
    expect(keys.filter((k) => !PLURAL.test(k)).sort()).toEqual(
      [...enEntries.keys()].filter((k) => !PLURAL.test(k)).sort()
    )
  })

  it('has every plural form the language needs, and only those', () => {
    const forms = pluralForms(lang)
    const bases = new Set(keys.filter((k) => PLURAL.test(k)).map(base))
    for (const b of bases) {
      for (const form of forms) expect(keys, `${lang}: ${b}_${form}`).toContain(`${b}_${form}`)
    }
    for (const key of keys.filter((k) => PLURAL.test(k))) {
      expect(forms, `${lang}: ${key}`).toContain(key.match(PLURAL)![1])
    }
  })

  it('uses the same placeholders as English', () => {
    for (const [key, text] of list) {
      const english = enEntries.get(key) ?? enEntries.get(`${base(key)}_other`)
      // Plural messages always receive `count`; a form may use it even where English doesn't
      // (Russian `_one` also covers 21, 31 …).
      const strip = (list: string[]): string[] =>
        PLURAL.test(key) ? list.filter((p) => p !== 'count') : list
      expect(strip(placeholders(text)), `${lang}: ${key}`).toEqual(
        strip(placeholders(english ?? ''))
      )
    }
  })

  it('has no empty or untranslated messages', () => {
    for (const [key, text] of list) {
      expect(text.trim(), `${lang}: ${key}`).not.toBe('')
      if (
        lang === 'en' ||
        SAME_AS_ENGLISH.has(base(key)) ||
        SAME_AS_ENGLISH.has(`${lang}:${base(key)}`)
      )
        continue
      const english = enEntries.get(key) ?? enEntries.get(`${base(key)}_other`) ?? ''
      // Texts without words (placeholders, codes, the app's name) may match.
      const words = english.replace(/\{\{\s*\w+\s*\}\}/g, '').replace(/Family Insight/g, '')
      if (/[a-zà-ž]{3}/.test(words)) {
        expect(text, `${lang}: ${key} is still in English`).not.toBe(english)
      }
    }
  })

  it('has a message for every model error code', () => {
    for (const code of MODEL_ERROR_CODES) {
      expect(((dict.errors as Dict).model as Dict)[code], `${lang} ${code}`).toBeTruthy()
    }
  })
})

describe('count messages', () => {
  it('every message with {{count}} is pluralised', () => {
    const missing = [...enEntries]
      .filter(([key, text]) => text.includes('{{count}}') && !PLURAL.test(key))
      .map(([key]) => key)
    expect(missing).toEqual([])
  })
})

describe('usage in source code', () => {
  const code = sourceFiles(join(__dirname, '..'))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n')
  const literals = new Set(
    [...code.matchAll(/['"`]([a-zA-Z][\w-]*(?:\.[\w-]+)+)['"`]/g)].map((m) => m[1]!)
  )
  const prefixes = [...code.matchAll(/`([a-zA-Z][\w-]*(?:\.[\w-]+)*\.)\$\{/g)].map((m) => m[1]!)

  it('every t("…") key exists', () => {
    const calls = [...code.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!)
    expect(calls.filter((k) => !enBases.has(k))).toEqual([])
  })

  it('every key is used somewhere', () => {
    const unused = [...enBases].filter(
      (k) => !literals.has(k) && !prefixes.some((p) => k.startsWith(p))
    )
    expect(unused).toEqual([])
  })
})

describe('languages', () => {
  it('maps system locales and regional tags to supported languages', () => {
    expect(resolveLanguage('pl-PL')).toBe('pl')
    expect(resolveLanguage('en_GB')).toBe('en')
    expect(resolveLanguage('EN-us')).toBe('en')
    expect(resolveLanguage('zh-Hant-TW')).toBe('en')
    expect(resolveLanguage(undefined)).toBe('en')
    expect(resolveLanguage('')).toBe('en')
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(resolveLanguage(`${lang}-XX`)).toBe(lang)
    }
  })

  it('lists every language in its own name, with its CSV delimiter', () => {
    expect(languageOptions()).toEqual(
      SUPPORTED_LANGUAGES.map((code) => ({ value: code, label: LOCALES[code].nativeName }))
    )
    expect(csvDelimiterFor('pl')).toBe(';')
    expect(csvDelimiterFor('en')).toBe(',')
    expect(csvDelimiterFor('xx')).toBe(',')
  })
})

describe('pseudo-locale', () => {
  afterEach(() => undefined)

  it('accents letters, keeps placeholders and makes texts ~40 % longer', () => {
    const text = pseudoString('Delete {{name}}?')
    expect(text).toContain('{{name}}')
    expect(text.startsWith('Ḓéļéţé {{name}}?')).toBe(true)
    expect(text.length).toBeGreaterThanOrEqual(Math.round('Delete ?'.length * 1.4))
    expect(pseudoLocalize({ a: { b: 'Hi' } })).toEqual({ a: { b: pseudoString('Hi') } })
  })

  it('is only available once enabled', () => {
    expect(isLanguage('xx')).toBe(false)
    enablePseudoLocale()
    expect(isLanguage('xx')).toBe(true)
    expect(resolveLanguage('xx')).toBe('xx')
    expect(Object.keys(i18nResources())).toContain('xx')
    expect(languageOptions().at(-1)!.value).toBe('xx')
  })
})
