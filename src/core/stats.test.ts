import { describe, expect, it } from 'vitest'
import { computeStats } from './stats'
import { TreeBuilder } from './test/fixtures'
import { createEmptyTree } from './model/tree'
import { addPersonEvent } from './model/operations'

const d = (value: string) => ({ value, qualifier: 'exact' as const })

describe('computeStats', () => {
  const tree = new TreeBuilder()
    .person('gp', 'Jan', 'male', {
      birth: { date: d('1900'), place: 'Kraków' },
      death: { date: d('1980') }
    })
    .person('gm', 'Anna Maria', 'female', {
      surname: 'Kowalska',
      birthSurname: 'Nowak',
      birth: { date: d('1905'), place: 'Kraków' },
      death: { date: d('1995') }
    })
    .person('p', 'Jan', 'male', { birth: { date: d('1930'), place: 'Łódź' }, living: true })
    .person('c', 'Ola', 'female', { living: true })
    .person('x', 'Ewa', 'unknown')
    .child('gp', 'p')
    .child('gm', 'p')
    .child('p', 'c')
    .build()
  const s = computeStats(tree, { language: 'pl' })

  it('counts people, status and sex', () => {
    expect(s).toMatchObject({
      people: 5,
      living: 2,
      deceased: 2,
      unknownStatus: 1,
      female: 2,
      male: 2
    })
  })

  it('measures generations and lifespans', () => {
    expect(s.generations).toBe(3)
    expect(s.averageLifespan).toBe(85)
    expect(s.longestLived).toEqual({ personId: 'gm', years: 90 })
  })

  it('ranks names (first given name, birth surname) and places', () => {
    expect(s.givenNames[0]).toEqual({ label: 'Jan', count: 2, personIds: ['gp', 'p'] })
    expect(s.givenNames.map((g) => g.label)).toContain('Anna')
    expect(s.surnames[0]).toMatchObject({ label: 'Kowalski', count: 4 })
    expect(s.surnames.map((x) => x.label)).toContain('Nowak')
    expect(s.birthPlaces).toEqual([
      { label: 'Kraków', count: 2, personIds: ['gp', 'gm'] },
      { label: 'Łódź', count: 1, personIds: ['p'] }
    ])
  })

  it('lists people with missing data', () => {
    expect(s.missingDates.sort()).toEqual(['c', 'x'])
    expect(s.missingParents.sort()).toEqual(['gm', 'gp', 'x'])
  })

  it('handles an empty tree', () => {
    expect(computeStats(createEmptyTree('E'))).toMatchObject({
      people: 0,
      generations: 0,
      averageLifespan: null,
      longestLived: null
    })
  })
})

describe('life event statistics', () => {
  it('counts event types and places and lists people without events', () => {
    let tree = new TreeBuilder().person('jan', 'Jan').person('ewa', 'Ewa').person('ola', 'Ola').tree
    tree = addPersonEvent(tree, 'jan', { type: 'emigration', place: 'Hamburg' }).tree
    tree = addPersonEvent(tree, 'jan', { type: 'occupation', place: 'Łódź' }).tree
    tree = addPersonEvent(tree, 'ewa', { type: 'emigration', place: 'Hamburg' }).tree
    const stats = computeStats(tree)
    expect(stats.eventTypes.map((i) => [i.label, i.count])).toEqual([
      ['emigration', 2],
      ['occupation', 1]
    ])
    expect(stats.eventPlaces[0]).toMatchObject({ label: 'Hamburg', count: 2 })
    expect(stats.withoutEvents).toEqual(['ola'])
  })
})
