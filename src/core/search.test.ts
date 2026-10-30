import { describe, expect, it } from 'vitest'
import { matchRanges, searchPersons } from './search'
import { TreeBuilder } from './test/fixtures'
import { addPersonEvent } from './model/operations'

const tree = new TreeBuilder()
  .person('a', 'Łucja', 'female', {
    surname: 'Żółkiewska',
    birthSurname: 'Wiśniewska',
    birth: { date: { value: '1890-05', qualifier: 'exact' }, place: 'Łódź' }
  })
  .person('b', 'Jan', 'male', { surname: 'Kowalski', death: { place: 'Kraków' } })
  .person('c', 'Ćwierć', 'other', { surname: 'Ąćęńóśźż' })
  .build()

const ids = (query: string): string[] => searchPersons(tree, query).map((p) => p.id)

describe('searchPersons', () => {
  it('ignores case and Polish diacritics, including ł', () => {
    expect(ids('lodz')).toEqual(['a'])
    expect(ids('ŁÓDŹ')).toEqual(['a'])
    expect(ids('zolkiewska')).toEqual(['a'])
    expect(ids('lucja')).toEqual(['a'])
    expect(ids('krakow')).toEqual(['b'])
    expect(ids('acenoszz')).toEqual(['c'])
    expect(ids('cwierc')).toEqual(['c'])
  })

  it('searches birth surnames and years, requiring every word', () => {
    expect(ids('wisniewska')).toEqual(['a'])
    expect(ids('1890')).toEqual(['a'])
    expect(ids('jan kowal')).toEqual(['b'])
    expect(ids('jan lodz')).toEqual([])
  })

  it('returns everyone for an empty query', () => {
    expect(ids('  ')).toHaveLength(3)
  })
})

describe('matchRanges', () => {
  it('finds ranges in the original text, merged and sorted', () => {
    expect(matchRanges('Łucja Żółkiewska', 'zolk luc')).toEqual([
      [0, 3],
      [6, 10]
    ])
    expect(matchRanges('Anna Nowak', 'an')).toEqual([[0, 2]])
    expect(matchRanges('Anna Nowak', '')).toEqual([])
  })
})

describe('searching life events', () => {
  it('finds people by event places, descriptions and custom names', () => {
    let tree = new TreeBuilder().person('jan', 'Jan').person('ewa', 'Ewa').tree
    tree = addPersonEvent(tree, 'jan', { type: 'emigration', place: 'Hamburg' }).tree
    tree = addPersonEvent(tree, 'ewa', { type: 'occupation', description: 'Nauczycielka' }).tree
    tree = addPersonEvent(tree, 'ewa', { type: 'custom', customType: 'Pielgrzymka' }).tree
    const names = (q: string): string[] => searchPersons(tree, q).map((p) => p.givenNames)
    expect(names('hamburg')).toEqual(['Jan'])
    expect(names('nauczycielka')).toEqual(['Ewa'])
    expect(names('pielgrzymka')).toEqual(['Ewa'])
  })
})
