import { describe, expect, it } from 'vitest'
import {
  ageAt,
  compareFuzzyDates,
  formatFuzzyDate,
  parseFuzzyDate,
  serializeFuzzyDate,
  shortFuzzyDate,
  yearOf
} from './fuzzyDate'
import type { FuzzyDate } from '../model/types'

const d = (value: string, qualifier: FuzzyDate['qualifier'] = 'exact'): FuzzyDate => ({
  value,
  qualifier
})

describe('parseFuzzyDate', () => {
  it.each([
    ['1890', d('1890')],
    ['1890-05', d('1890-05')],
    ['1890-5-2', d('1890-05-02')],
    ['1890-05-12', d('1890-05-12')],
    ['12.05.1890', d('1890-05-12')],
    ['2.5.1890', d('1890-05-02')],
    ['12/05/1890', d('1890-05-12')],
    ['05.1890', d('1890-05')],
    ['  1890  ', d('1890')],
    ['987', d('0987')],
    ['~1890', d('1890', 'about')],
    ['abt 1890', d('1890', 'about')],
    ['ABT. 1890-05', d('1890-05', 'about')],
    ['about 1890', d('1890', 'about')],
    ['ca. 1890', d('1890', 'about')],
    ['ok. 1890', d('1890', 'about')],
    ['około 12.05.1890', d('1890-05-12', 'about')],
    ['<1900', d('1900', 'before')],
    ['bef 1900', d('1900', 'before')],
    ['before 1900', d('1900', 'before')],
    ['przed 1900', d('1900', 'before')],
    ['>1900', d('1900', 'after')],
    ['> 1900', d('1900', 'after')],
    ['aft 1900', d('1900', 'after')],
    ['after 1900', d('1900', 'after')],
    ['po 1900', d('1900', 'after')],
    ['2000-02-29', d('2000-02-29')]
  ])('parses %j', (input, expected) => {
    expect(parseFuzzyDate(input)).toEqual(expected)
  })

  it.each([
    '',
    '   ',
    'abc',
    '1890-13',
    '1890-02-30',
    '1900-02-29',
    '31.04.1890',
    '00.1890',
    '0',
    '12345',
    '~',
    'po',
    '1890-05-12T00:00'
  ])('rejects %j', (input) => {
    expect(parseFuzzyDate(input)).toBeNull()
  })

  it('handles null and undefined', () => {
    expect(parseFuzzyDate(null)).toBeNull()
    expect(parseFuzzyDate(undefined)).toBeNull()
  })
})

describe('serializeFuzzyDate', () => {
  it.each([
    [d('1890'), '1890'],
    [d('1890-05', 'about'), '~1890-05'],
    [d('1890-05-12', 'before'), '<1890-05-12'],
    [d('1890', 'after'), '>1890']
  ])('serializes %j', (date, text) => {
    expect(serializeFuzzyDate(date)).toBe(text)
    expect(parseFuzzyDate(text)).toEqual(date)
  })
})

describe('formatFuzzyDate', () => {
  it.each([
    [d('1890'), '1890', '1890'],
    [d('1890', 'about'), 'about 1890', 'ok. 1890'],
    [d('1890-05'), 'May 1890', 'maj 1890'],
    [d('1890-05', 'about'), 'about May 1890', 'ok. maja 1890'],
    [d('1890-05', 'before'), 'before May 1890', 'przed majem 1890'],
    [d('1890-11', 'after'), 'after November 1890', 'po listopadzie 1890'],
    [d('1890-05-12'), '12 May 1890', '12 maja 1890'],
    [d('1890-09-01', 'before'), 'before 1 September 1890', 'przed 1 września 1890']
  ])('formats %j', (date, en, pl) => {
    expect(formatFuzzyDate(date, 'en')).toBe(en)
    expect(formatFuzzyDate(date, 'pl')).toBe(pl)
  })

  it('short form for cards', () => {
    expect(shortFuzzyDate(d('1890-05-12', 'about'))).toBe('~1890')
  })
})

describe('compareFuzzyDates', () => {
  it('sorts chronologically with unknown last', () => {
    const dates = [
      undefined,
      d('1890-05'),
      d('1890', 'after'),
      d('1890'),
      d('1889-12-31'),
      d('1890', 'before'),
      d('1890-05-01')
    ]
    expect(dates.sort(compareFuzzyDates)).toEqual([
      d('1889-12-31'),
      d('1890', 'before'),
      d('1890'),
      d('1890', 'after'),
      d('1890-05'),
      d('1890-05-01'),
      undefined
    ])
  })

  it('yearOf', () => {
    expect(yearOf(d('1890-05'))).toBe(1890)
    expect(yearOf(undefined)).toBeUndefined()
  })
})

describe('ageAt', () => {
  it('computes completed years', () => {
    expect(ageAt(d('1990-06-15'), d('2020-06-14'))).toEqual({ years: 29, approximate: false })
    expect(ageAt(d('1990-06-15'), d('2020-06-15'))).toEqual({ years: 30, approximate: false })
  })

  it('marks partial dates approximate', () => {
    expect(ageAt(d('1890'), d('1955'))).toEqual({ years: 65, approximate: true })
    expect(ageAt(d('1890-05-12', 'about'), d('1955-06-01'))).toEqual({
      years: 65,
      approximate: true
    })
  })

  it('uses today by default and rejects negative ages', () => {
    expect(ageAt(d('2000-01-01'), new Date(2026, 0, 1))?.years).toBe(26)
    expect(ageAt(d('2000'), d('1990'))).toBeUndefined()
    expect(ageAt(undefined)).toBeUndefined()
  })
})
