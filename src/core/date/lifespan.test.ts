import { describe, expect, it } from 'vitest'
import { lifespanLabel } from './lifespan'
import { checkPersonDates, checkTreeDates } from './plausibility'
import type { Person, PersonEvent } from '../model/types'
import { NOW, TreeBuilder } from '../test/fixtures'

const p = (extra: Partial<Person>): Person => ({
  id: 'p',
  givenNames: 'Jan',
  surname: 'K',
  sex: 'male',
  events: [],
  createdAt: '',
  updatedAt: '',
  ...extra
})

describe('lifespanLabel', () => {
  it.each([
    [{}, '', ''],
    [{ birth: { date: { value: '1890-05-12', qualifier: 'exact' } } }, 'b. 1890', 'ur. 1890'],
    [{ death: { date: { value: '1955', qualifier: 'about' } } }, 'd. ~1955', 'zm. ~1955'],
    [
      {
        birth: { date: { value: '1890', qualifier: 'exact' } },
        death: { date: { value: '1955', qualifier: 'exact' } }
      },
      '1890 – 1955',
      '1890 – 1955'
    ],
    [
      { birth: { date: { value: '1890', qualifier: 'exact' } }, living: false },
      '1890 – ?',
      '1890 – ?'
    ]
  ] as [Partial<Person>, string, string][])('%j', (extra, en, pl) => {
    expect(lifespanLabel(p(extra), 'en')).toBe(en)
    expect(lifespanLabel(p(extra), 'pl')).toBe(pl)
  })
})

describe('plausibility', () => {
  const now = new Date('2026-01-01')

  it('warns about death before birth and unrealistic ages', () => {
    const codes = (x: Partial<Person>): string[] => checkPersonDates(p(x), now).map((i) => i.code)
    expect(
      codes({
        birth: { date: { value: '1900', qualifier: 'exact' } },
        death: { date: { value: '1890', qualifier: 'exact' } }
      })
    ).toEqual(['death-before-birth'])
    expect(codes({ birth: { date: { value: '1800', qualifier: 'exact' } } })).toEqual([
      'unrealistic-age'
    ])
    expect(
      codes({ birth: { date: { value: '1800', qualifier: 'exact' } }, living: false })
    ).toEqual([])
    expect(codes({ birth: { date: { value: '1950', qualifier: 'exact' } } })).toEqual([])
  })

  it('warns when a biological parent is younger than the child', () => {
    const tree = new TreeBuilder()
      .person('a', 'A', 'male', { birth: { date: { value: '1950', qualifier: 'exact' } } })
      .person('b', 'B', 'male', { birth: { date: { value: '1940', qualifier: 'exact' } } })
      .child('a', 'b')
      .build()
    expect(checkTreeDates(tree, now).map((i) => i.code)).toEqual(['parent-younger-than-child'])
  })
})

describe('event plausibility', () => {
  const d = (value: string) => ({ value, qualifier: 'exact' as const })
  const codes = (person: Person): string[] => checkPersonDates(person, NOW).map((i) => i.code)
  const born = { birth: { date: d('1890-05-10') }, death: { date: d('1950-03-01') } }
  const withEvent = (event: Partial<PersonEvent>): Person =>
    p({ ...born, living: false, events: [{ id: 'e', type: 'residence', ...event }] })

  it('warns about events before birth or after death, except burial and cremation', () => {
    expect(codes(withEvent({ date: d('1889') }))).toEqual(['event-before-birth'])
    expect(codes(withEvent({ date: d('1955') }))).toEqual(['event-after-death'])
    expect(codes(withEvent({ type: 'burial', date: d('1950-03-04') }))).toEqual([])
    expect(codes(withEvent({ type: 'cremation', date: d('1951') }))).toEqual([])
    expect(codes(withEvent({ date: d('1920') }))).toEqual([])
  })

  it('does not warn when partial dates only overlap', () => {
    expect(codes(withEvent({ type: 'baptism', date: d('1890') }))).toEqual([])
    expect(codes(withEvent({ date: d('1950') }))).toEqual([])
  })

  it('warns when an event ends before it starts', () => {
    expect(codes(withEvent({ date: d('1918'), endDate: d('1914') }))).toEqual([
      'event-end-before-start'
    ])
    expect(codes(withEvent({ date: d('1914'), endDate: d('1918') }))).toEqual([])
  })
})
