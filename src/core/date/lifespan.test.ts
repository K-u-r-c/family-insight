import { describe, expect, it } from 'vitest'
import { lifespanLabel } from './lifespan'
import { checkPersonDates, checkTreeDates } from './plausibility'
import type { Person } from '../model/types'
import { TreeBuilder } from '../test/fixtures'

const p = (extra: Partial<Person>): Person => ({
  id: 'p',
  givenNames: 'Jan',
  surname: 'K',
  sex: 'male',
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
