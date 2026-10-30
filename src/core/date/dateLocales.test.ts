import { describe, expect, it } from 'vitest'
import type { DateQualifier, FuzzyDate } from '../model/types'
import { DATE_LANGUAGES, DATE_LOCALES, type DateLanguage } from './dateLocales'
import { dateInputText, formatFuzzyDate, parseFuzzyDate } from './fuzzyDate'
import { lifespanLabel } from './lifespan'

const QUALIFIERS: DateQualifier[] = ['exact', 'about', 'before', 'after']

describe.each(DATE_LANGUAGES.map((l) => [l]))('dates in %s', (language) => {
  const locale = DATE_LOCALES[language]

  it('reads every month name form', () => {
    for (const [form, names] of Object.entries(locale.months)) {
      names.forEach((name, i) => {
        const month = String(i + 1).padStart(2, '0')
        expect(parseFuzzyDate(`${name} 1890`), `${form} ${name}`).toEqual({
          value: `1890-${month}`,
          qualifier: 'exact'
        })
        expect(parseFuzzyDate(`12 ${name.toUpperCase()} 1890`), `${form} ${name}`).toEqual({
          value: `1890-${month}-12`,
          qualifier: 'exact'
        })
      })
    }
    for (const [alias, month] of Object.entries(locale.aliases ?? {})) {
      expect(parseFuzzyDate(`${alias} 1890`)?.value).toBe(`1890-${String(month).padStart(2, '0')}`)
    }
  })

  it('reads every qualifier phrase', () => {
    for (const [qualifier, phrases] of Object.entries(locale.qualifiers)) {
      for (const phrase of phrases) {
        expect(parseFuzzyDate(`${phrase} 1890`), phrase).toEqual({ value: '1890', qualifier })
        expect(parseFuzzyDate(`${phrase} ${locale.months.day[4]} 1890`)?.qualifier, phrase).toBe(
          qualifier
        )
      }
    }
  })

  it('reads back everything it writes (parse(format(d)) = d)', () => {
    const values = ['1890', '0987', '1890-01', '1890-05', '1890-12', '1890-03-01', '1890-02-28']
    for (let month = 1; month <= 12; month++) {
      values.push(
        `1901-${String(month).padStart(2, '0')}-${month === 2 ? 29 - 1 : 30 - (month % 2)}`
      )
    }
    for (const value of values) {
      for (const qualifier of QUALIFIERS) {
        const date: FuzzyDate = { value, qualifier }
        const text = formatFuzzyDate(date, language)
        expect(parseFuzzyDate(text, language), text).toEqual(date)
        expect(parseFuzzyDate(text), `${text} without a language`).toEqual(date)
        expect(parseFuzzyDate(dateInputText(date, language), language)?.value, text).toBe(value)
      }
    }
  })

  it('writes an abbreviation for born and died', () => {
    const person = { birth: { date: { value: '1921', qualifier: 'exact' } } }
    expect(lifespanLabel(person as never, language)).toMatch(/1921$/)
    expect(lifespanLabel(person as never, language)).not.toBe('1921')
  })
})

describe('written dates', () => {
  const d = (value: string, qualifier: DateQualifier = 'exact'): FuzzyDate => ({ value, qualifier })
  const cases: [FuzzyDate, Record<Exclude<DateLanguage, 'en' | 'pl'>, string>][] = [
    [
      d('1890-05-12'),
      {
        de: '12. Mai 1890',
        fr: '12 mai 1890',
        es: '12 de mayo de 1890',
        it: '12 maggio 1890',
        pt: '12 de maio de 1890',
        ru: '12 мая 1890'
      }
    ],
    [
      d('1890-03-01', 'before'),
      {
        de: 'vor dem 1. März 1890',
        fr: 'avant le 1er mars 1890',
        es: 'antes del 1 de marzo de 1890',
        it: 'prima del 1º marzo 1890',
        pt: 'antes de 1 de março de 1890',
        ru: 'до 1 марта 1890'
      }
    ],
    [
      d('1890-03'),
      {
        de: 'März 1890',
        fr: 'mars 1890',
        es: 'marzo de 1890',
        it: 'marzo 1890',
        pt: 'março de 1890',
        ru: 'март 1890'
      }
    ],
    [
      d('1890-03', 'about'),
      {
        de: 'ca. März 1890',
        fr: 'vers mars 1890',
        es: 'hacia marzo de 1890',
        it: 'circa marzo 1890',
        pt: 'por volta de março de 1890',
        ru: 'около марта 1890'
      }
    ],
    [
      d('1890', 'after'),
      {
        de: 'nach 1890',
        fr: 'après 1890',
        es: 'después de 1890',
        it: 'dopo il 1890',
        pt: 'depois de 1890',
        ru: 'после 1890'
      }
    ]
  ]
  it.each(cases)('%j', (date, expected) => {
    for (const [language, text] of Object.entries(expected)) {
      expect(formatFuzzyDate(date, language as DateLanguage), language).toBe(text)
    }
  })

  it('edits numbers in the order of the language', () => {
    const date = d('1890-05-12')
    expect(dateInputText(date, 'en')).toBe('1890-05-12')
    expect(dateInputText(date, 'de')).toBe('12.05.1890')
    expect(dateInputText(date, 'ru')).toBe('12.05.1890')
    expect(dateInputText(date, 'fr')).toBe('12/05/1890')
    expect(dateInputText(d('1890-05'), 'it')).toBe('05/1890')
  })
})

describe('reading dates', () => {
  it.each([
    ['1er mars 1890', '1890-03-01'],
    ['12. März 1890', '1890-03-12'],
    ['12 Maerz 1890', null],
    ['12 marz 1890', '1890-03-12'],
    ['12 de marzo de 1890', '1890-03-12'],
    ['1º maggio 1890', '1890-05-01'],
    ['12 марта 1890 г.', '1890-03-12'],
    ['март 1890 года', '1890-03'],
    ['12 marca 1890 r.', '1890-03-12'],
    ['March 12, 1890', '1890-03-12'],
    ['12th March 1890', '1890-03-12'],
    ['sept. 1890', '1890-09'],
    ['mar 1890', '1890-03'],
    ['jui 1890', null],
    ['ma 1890', null],
    ['12 foo 1890', null]
  ])('%s', (text, value) => {
    expect(parseFuzzyDate(text)?.value ?? null).toBe(value)
  })

  it('reads MM/DD/YYYY in English only when day-first is impossible', () => {
    expect(parseFuzzyDate('05/23/1890', 'en')?.value).toBe('1890-05-23')
    expect(parseFuzzyDate('05/06/1890', 'en')?.value).toBe('1890-06-05')
    expect(parseFuzzyDate('05/23/1890', 'fr')).toBeNull()
    expect(parseFuzzyDate('05.23.1890', 'en')).toBeNull()
  })

  it('reads the qualifiers of the issue in any UI language', () => {
    const about = ['um', 'ca.', 'gegen', 'vers', 'env.', 'hacia', 'cerca de', 'circa', 'verso']
    const more = ['intorno al', 'por volta de', 'около', 'ок.', 'примерно']
    for (const word of [...about, ...more]) {
      expect(parseFuzzyDate(`${word} 1890`, 'en')?.qualifier, word).toBe('about')
    }
    for (const word of ['vor', 'avant', 'antes de', 'prima del', 'до']) {
      expect(parseFuzzyDate(`${word} 1890`, 'pl')?.qualifier, word).toBe('before')
    }
    for (const word of ['nach', 'après', 'después de', 'dopo', 'depois de', 'после']) {
      expect(parseFuzzyDate(`${word} 1890`, 'ru')?.qualifier, word).toBe('after')
    }
  })
})
